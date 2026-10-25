"""CivicSignal: watch local-government agendas and surface the items a resident cares about."""

from __future__ import annotations

import asyncio
import os
from datetime import date, timedelta

import httpx
from apify import Actor

from .adapters import berkeley, legistar
from .models import AgendaItem
from .scoring import score_with_claude, score_with_keywords

# Preset jurisdictions. Any other Legistar client slug can be passed via `extraLegistarClients`.
PRESETS: dict[str, tuple[str, str]] = {
    'berkeley': ('berkeley-eagenda', 'City of Berkeley'),
    'oakland': ('legistar', 'City of Oakland'),
    'sanjose': ('legistar', 'City of San José'),
    'alameda': ('legistar', 'City of Alameda'),
    'mountainview': ('legistar', 'City of Mountain View'),
    'sunnyvaleca': ('legistar', 'City of Sunnyvale'),
}

USER_AGENT = 'CivicSignal/1.0 (Apify Actor; civic agenda monitor; +https://github.com/2900xt/calhacks-2026)'


async def main() -> None:
    async with Actor:
        inp = await Actor.get_input() or {}
        interests = [i.strip() for i in inp.get('interests') or [] if i and i.strip()]
        if not interests:
            await Actor.fail(status_message='Input "interests" must list at least one topic you care about.')
            return

        jurisdictions = list(dict.fromkeys(inp.get('jurisdictions') or ['berkeley', 'oakland']))
        extra = [s.strip().lower() for s in inp.get('extraLegistarClients') or [] if s.strip()]
        days_back = int(inp.get('daysBack', 0))
        days_ahead = int(inp.get('daysAhead', 21))
        max_meetings = int(inp.get('maxMeetingsPerJurisdiction', 4))
        min_relevance = float(inp.get('minRelevance', 0.5))
        include_all = bool(inp.get('includeAllItems', False))
        api_key = inp.get('anthropicApiKey') or os.environ.get('ANTHROPIC_API_KEY')

        start = date.today() - timedelta(days=days_back)
        end = date.today() + timedelta(days=days_ahead)
        await Actor.set_status_message(f'Collecting agendas {start} → {end} for {len(jurisdictions) + len(extra)} jurisdictions')

        async with httpx.AsyncClient(timeout=30, follow_redirects=True, headers={'User-Agent': USER_AGENT}) as client:
            tasks = []
            for j in jurisdictions:
                if j == 'berkeley':
                    tasks.append(berkeley.fetch(client, start, end, max_meetings, Actor.log))
                elif j in PRESETS:
                    tasks.append(legistar.fetch(client, j, PRESETS[j][1], start, end, max_meetings, Actor.log))
                else:
                    Actor.log.warning(f'Unknown jurisdiction "{j}", skipping')
            for slug in extra:
                tasks.append(legistar.fetch(client, slug, slug, start, end, max_meetings, Actor.log))
            gathered = await asyncio.gather(*tasks, return_exceptions=True)

        items: list[AgendaItem] = []
        for result in gathered:
            if isinstance(result, Exception):
                Actor.log.warning(f'Jurisdiction failed: {result}')
            else:
                items.extend(result)
        unique = {it.item_id: it for it in items}
        items = list(unique.values())

        if not items:
            await Actor.set_status_message('No published agenda items in that window.')
            await Actor.set_value('OUTPUT', {'interests': interests, 'itemsScanned': 0, 'matches': []})
            return

        await Actor.charge('agenda-item-scanned', count=len(items))
        await Actor.set_status_message(f'Scoring {len(items)} agenda items against {len(interests)} interests')

        if api_key:
            scores = await score_with_claude(items, interests, api_key, Actor.log)
            scorer = 'claude'
        else:
            Actor.log.warning('No Anthropic API key configured; falling back to keyword matching.')
            scores, scorer = score_with_keywords(items, interests), 'keywords'

        records = []
        for it in items:
            s = scores.get(it.item_id)
            record = it.to_record()
            record.update({
                'relevance': round(s.relevance, 2) if s else 0.0,
                'matchedInterest': s.matched_interest if s else None,
                'reason': s.reason if s else None,
                'plainSummary': s.plain_summary if s else None,
                'actionType': s.action_type if s else None,
                'scoredBy': scorer,
            })
            records.append(record)
        records.sort(key=lambda r: (-r['relevance'], r['meetingDate']))

        matches = [r for r in records if r['relevance'] >= min_relevance]
        for r in matches:
            await Actor.push_data(r, charged_event_name='relevant-item-found')
        if include_all:
            rest = [r for r in records if r['relevance'] < min_relevance]
            if rest:
                await Actor.push_data(rest)

        await Actor.set_value('OUTPUT', {
            'interests': interests,
            'window': {'from': start.isoformat(), 'to': end.isoformat()},
            'itemsScanned': len(records),
            'matchCount': len(matches),
            'digest': _digest(matches, interests),
            'matches': matches[:25],
        })
        await Actor.set_status_message(f'Done: {len(matches)} of {len(records)} agenda items match your interests')


def _digest(matches: list[dict], interests: list[str]) -> str:
    if not matches:
        return 'Nothing on upcoming agendas matches: ' + '; '.join(interests)
    lines = [f'# CivicSignal digest — {len(matches)} items to watch', '']
    for r in matches[:15]:
        lines.append(
            f"- **{r['jurisdictionName']} · {r['body']} · {r['meetingDate']}** — {r['plainSummary'] or r['title']} "
            f"({r['actionType']}, relevance {r['relevance']}). {r['reason']} [Source]({r['documentUrl'] or r['agendaUrl']})"
        )
    return '\n'.join(lines)

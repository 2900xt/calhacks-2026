"""BeInvolved: watch local-government agendas and surface the items a resident cares about."""

from __future__ import annotations

import asyncio
import os
from dataclasses import dataclass
from datetime import date, timedelta
from html import escape

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

USER_AGENT = 'BeInvolved/1.0 (Apify Actor; civic agenda monitor; +https://github.com/2900xt/calhacks-2026)'


@dataclass
class ScanResult:
    interests: list[str]
    start: date
    end: date
    records: list[dict]
    matches: list[dict]

    def summary(self) -> dict:
        return {
            'interests': self.interests,
            'window': {'from': self.start.isoformat(), 'to': self.end.isoformat()},
            'itemsScanned': len(self.records),
            'matchCount': len(self.matches),
            'digest': digest_markdown(self.matches, self.interests),
            'matches': self.matches[:25],
        }


async def scan(inp: dict) -> ScanResult:
    """Collect agendas for the requested jurisdictions, score them, and charge per event."""
    interests = [i.strip() for i in inp.get('interests') or [] if i and i.strip()]
    if not interests:
        raise ValueError('"interests" must list at least one topic you care about.')

    extra = [s.strip().lower() for s in inp.get('extraLegistarClients') or [] if s.strip()]
    # Default to Berkeley + Oakland only when the caller named no cities at all.
    jurisdictions = list(dict.fromkeys(inp.get('jurisdictions') or ([] if extra else ['berkeley', 'oakland'])))
    max_meetings = int(inp.get('maxMeetingsPerJurisdiction', 4))
    min_relevance = float(inp.get('minRelevance', 0.5))
    api_key = inp.get('anthropicApiKey') or os.environ.get('ANTHROPIC_API_KEY')
    start = date.today() - timedelta(days=int(inp.get('daysBack', 0)))
    end = date.today() + timedelta(days=int(inp.get('daysAhead', 21)))

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
    items = list({it.item_id: it for it in items}.values())
    if not items:
        return ScanResult(interests, start, end, [], [])

    await Actor.charge('agenda-item-scanned', count=len(items))

    if api_key:
        scores, scorer = await score_with_claude(items, interests, api_key, Actor.log), 'claude'
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
    return ScanResult(interests, start, end, records, matches)


async def main() -> None:
    async with Actor:
        if Actor.configuration.meta_origin == 'STANDBY':
            from .server import serve
            await serve()
            return

        inp = await Actor.get_input() or {}
        await Actor.set_status_message('Collecting agendas')
        try:
            result = await scan(inp)
        except ValueError as err:
            await Actor.fail(status_message=str(err))
            return

        if not result.records:
            await Actor.set_status_message('No published agenda items in that window.')
            await Actor.set_value('OUTPUT', result.summary())
            return

        for r in result.matches:
            await Actor.push_data(r, charged_event_name='relevant-item-found')
        if inp.get('includeAllItems'):
            rest = [r for r in result.records if r not in result.matches]
            if rest:
                await Actor.push_data(rest)
        await Actor.set_value('OUTPUT', result.summary())

        alert_email = (inp.get('alertEmail') or '').strip()
        if alert_email and result.matches:
            # Actor-to-Actor: hand the digest to Apify's official mailer instead of running our own SMTP.
            await Actor.start('apify/send-mail', run_input={
                'to': alert_email,
                'subject': f'BeInvolved: {len(result.matches)} upcoming agenda items match your interests',
                'html': digest_html(result.matches),
            })
            Actor.log.info(f'Alert email queued for {len(result.matches)} matches')

        await Actor.set_status_message(
            f'Done: {len(result.matches)} of {len(result.records)} agenda items match your interests'
        )


def digest_markdown(matches: list[dict], interests: list[str]) -> str:
    if not matches:
        return 'Nothing on upcoming agendas matches: ' + '; '.join(interests)
    lines = [f'# BeInvolved digest — {len(matches)} items to watch', '']
    for r in matches[:15]:
        lines.append(
            f"- **{r['jurisdictionName']} · {r['body']} · {r['meetingDate']}** — {r['plainSummary'] or r['title']} "
            f"({r['actionType']}, relevance {r['relevance']}). {r['reason']} [Source]({r['documentUrl'] or r['agendaUrl']})"
        )
    return '\n'.join(lines)


def digest_html(matches: list[dict]) -> str:
    rows = []
    for r in matches[:15]:
        src = escape(r['documentUrl'] or r['agendaUrl'] or '')
        rows.append(
            f"<li style='margin-bottom:14px'><b>{escape(r['plainSummary'] or r['title'])}</b><br>"
            f"<span style='color:#666'>{escape(r['jurisdictionName'])} · {escape(r['body'])} · {escape(r['meetingDate'])}"
            f" · {escape(str(r['actionType']))}</span><br>{escape(r['reason'] or '')} <a href='{src}'>Staff report</a></li>"
        )
    return (
        "<div style='font-family:system-ui,sans-serif;max-width:640px'>"
        f"<h2 style='margin:0 0 4px'>{len(matches)} agenda items to watch</h2>"
        "<p style='color:#666;margin:0 0 16px'>From BeInvolved, your local government agenda monitor.</p>"
        f"<ol style='padding-left:18px'>{''.join(rows)}</ol></div>"
    )

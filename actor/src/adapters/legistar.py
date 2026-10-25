"""Adapter for Granicus Legistar, via its public Web API (webapi.legistar.com).

Hundreds of US cities, counties and transit agencies publish on Legistar, so any
client slug that the Web API serves works here, not just the Bay Area presets.
"""

from __future__ import annotations

import asyncio
import re
from datetime import date

import httpx

from ..models import AgendaItem

API = 'https://webapi.legistar.com/v1'

# Agenda rows that are procedural boilerplate rather than something a resident can act on.
BOILERPLATE = (
    'roll call', 'call to order', 'adjournment', 'adjourn', 'open forum', 'americans with disabilities',
    'definition of terms', 'committee membership', 'the public may observe', 'pledge of allegiance',
    'approval of the draft minutes', 'public comment', 'closed session', 'land acknowledgement',
)


def _is_boilerplate(title: str) -> bool:
    lowered = title.strip().lower()
    return any(lowered.startswith(prefix) for prefix in BOILERPLATE)


async def fetch(
    client: httpx.AsyncClient,
    slug: str,
    name: str,
    start: date,
    end: date,
    max_meetings: int,
    log,
) -> list[AgendaItem]:
    params = {
        '$filter': f"EventDate ge datetime'{start.isoformat()}' and EventDate le datetime'{end.isoformat()}'",
        '$orderby': 'EventDate asc',
        '$top': str(max_meetings * 3),
    }
    resp = await client.get(f'{API}/{slug}/events', params=params)
    resp.raise_for_status()
    events = resp.json()
    if not isinstance(events, list):
        raise ValueError(f'Legistar client "{slug}" returned no event list')

    # Prefer meetings whose agenda has actually been published.
    events = [e for e in events if e.get('EventAgendaStatusName', '').upper() != 'CANCELLED']
    events.sort(key=lambda e: (e.get('EventAgendaFile') is None, e.get('EventDate') or ''))
    events = sorted(events[:max_meetings], key=lambda e: e.get('EventDate') or '')

    async def items_for(event: dict) -> list[AgendaItem]:
        r = await client.get(
            f"{API}/{slug}/events/{event['EventId']}/eventitems",
            params={'AgendaNote': '1', 'MinutesNote': '0', 'Attachments': '1'},
        )
        r.raise_for_status()
        out = []
        body = (event.get('EventBodyName') or 'Meeting').lstrip('*').strip()
        for row in r.json():
            title = re.sub(r'^subject:\s*', '', (row.get('EventItemTitle') or '').strip(), flags=re.I)
            if not title or _is_boilerplate(title):
                continue
            if not row.get('EventItemAgendaNumber') and not row.get('EventItemMatterId'):
                continue
            attachments = [
                {'name': a.get('MatterAttachmentName'), 'url': a.get('MatterAttachmentHyperlink')}
                for a in (row.get('EventItemMatterAttachments') or [])
                if a.get('MatterAttachmentHyperlink')
            ]
            out.append(AgendaItem(
                jurisdiction=slug,
                jurisdiction_name=name,
                platform='legistar',
                body=body,
                meeting_date=(event.get('EventDate') or '')[:10],
                meeting_time=event.get('EventTime'),
                meeting_url=event.get('EventInSiteURL'),
                agenda_url=event.get('EventAgendaFile'),
                section=row.get('EventItemMatterType'),
                item_number=row.get('EventItemAgendaNumber') or row.get('EventItemMatterFile'),
                title=title.split('\n')[0][:300],
                description=title if len(title) > 300 or '\n' in title else (row.get('EventItemAgendaNote') or None),
                document_url=attachments[0]['url'] if attachments else event.get('EventAgendaFile'),
                attachments=attachments[:5],
            ))
        return out

    results = await asyncio.gather(*(items_for(e) for e in events), return_exceptions=True)
    items: list[AgendaItem] = []
    for event, result in zip(events, results):
        if isinstance(result, Exception):
            log.warning(f"{slug}: could not load items for event {event.get('EventId')}: {result}")
            continue
        items.extend(result)
    log.info(f'{name}: {len(events)} meetings, {len(items)} agenda items')
    return items

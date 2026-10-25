"""Adapter for the City of Berkeley's HTML "eAgenda" pages on berkeleyca.gov.

Berkeley does not use Legistar; it publishes each City Council agenda as a Drupal
page where every item is a <p> that starts with "<strong>N.</strong>" under an <h2>
section heading (Consent Calendar, Action Calendar, Information Reports...).
"""

from __future__ import annotations

import asyncio
import re
from datetime import date, datetime
from urllib.parse import urljoin

import httpx
from bs4 import BeautifulSoup, Tag

from ..models import AgendaItem

BASE = 'https://berkeleyca.gov'
LISTING = f'{BASE}/your-government/city-council/city-council-agendas'
EAGENDA_LINK = re.compile(r'^/(city-council-[a-z-]*?eagenda-([a-z]+)-(\d{1,2})-(\d{4}))$')
ITEM_NUMBER = re.compile(r'^\s*(\d+[a-z]?)\.\s*$')
FIELD = re.compile(r'^(From|Recommendation|Financial Implications|Contact|First Reading Vote)\s*:\s*', re.I)


def _meeting_body(slug: str) -> str:
    name = slug.removeprefix('city-council-').split('-eagenda')[0].replace('-', ' ')
    return f'City Council ({name.title()})' if name else 'City Council'


async def fetch(
    client: httpx.AsyncClient,
    start: date,
    end: date,
    max_meetings: int,
    log,
) -> list[AgendaItem]:
    resp = await client.get(LISTING)
    resp.raise_for_status()
    soup = BeautifulSoup(resp.text, 'html.parser')

    meetings: dict[str, date] = {}
    for a in soup.find_all('a', href=True):
        m = EAGENDA_LINK.match(a['href'])
        if not m or 'cancelled' in m.group(1):
            continue
        try:
            when = datetime.strptime(f'{m.group(2)} {m.group(3)} {m.group(4)}', '%B %d %Y').date()
        except ValueError:
            continue
        if start <= when <= end:
            meetings[m.group(1)] = when

    chosen = sorted(meetings.items(), key=lambda kv: kv[1])[:max_meetings]
    results = await asyncio.gather(*(_parse_meeting(client, slug, when) for slug, when in chosen), return_exceptions=True)

    items: list[AgendaItem] = []
    for (slug, _), result in zip(chosen, results):
        if isinstance(result, Exception):
            log.warning(f'berkeley: could not parse {slug}: {result}')
            continue
        items.extend(result)
    log.info(f'Berkeley: {len(chosen)} meetings, {len(items)} agenda items')
    return items


async def _parse_meeting(client: httpx.AsyncClient, slug: str, when: date) -> list[AgendaItem]:
    url = f'{BASE}/{slug}'
    resp = await client.get(url)
    resp.raise_for_status()
    soup = BeautifulSoup(resp.text, 'html.parser')
    root = soup.find('main') or soup.body or soup

    items: list[AgendaItem] = []
    section = None
    for el in root.find_all(['h2', 'p']):
        if el.name == 'h2':
            section = el.get_text(' ', strip=True) or section
            continue
        first = el.find(True)
        if not isinstance(first, Tag) or first.name != 'strong':
            continue
        num = ITEM_NUMBER.match(first.get_text(strip=True))
        if not num:
            continue
        link = el.find('a', href=True)
        title = (link.get_text(' ', strip=True) if link else '').lstrip('-– ').strip()
        lines = [ln.strip() for ln in el.get_text('\n', strip=True).split('\n') if ln.strip()]
        fields: dict[str, str] = {}
        current = None
        for ln in lines:
            m = FIELD.match(ln)
            if m:
                current = m.group(1).title()
                fields[current] = ln[m.end():].strip()
            elif current:
                fields[current] = (fields[current] + ' ' + ln).strip()
        if not title:
            title = next((ln for ln in lines[1:] if not FIELD.match(ln)), '').lstrip('-– ')
        if not title:
            continue
        desc_parts = [f"{k}: {v}" for k, v in fields.items() if k in ('From', 'Recommendation', 'Financial Implications') and v]
        items.append(AgendaItem(
            jurisdiction='berkeley',
            jurisdiction_name='City of Berkeley',
            platform='berkeley-eagenda',
            body=_meeting_body(slug),
            meeting_date=when.isoformat(),
            meeting_time=None,
            meeting_url=url,
            agenda_url=url,
            section=section,
            item_number=num.group(1),
            title=title[:300],
            description=' | '.join(desc_parts) or None,
            document_url=urljoin(BASE, link['href']) if link else url,
        ))
    return items

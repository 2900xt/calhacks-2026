import logging
from datetime import date
from pathlib import Path

import httpx
import pytest

from src.adapters import berkeley, legistar
from src.scoring import guess_action_type, score_with_keywords

FIXTURES = Path(__file__).parent / 'fixtures'
log = logging.getLogger('test')

LISTING_HTML = """
<a href="/city-council-regular-meeting-eagenda-october-27-2026">Oct 27</a>
<a href="/cancelled-city-council-special-meeting-eagenda-october-28-2026">Cancelled</a>
<a href="/city-council-regular-meeting-eagenda-january-13-2026">Old</a>
"""

LEGISTAR_EVENTS = [
    {
        'EventId': 1, 'EventBodyName': '*City Council', 'EventDate': '2026-10-28T00:00:00', 'EventTime': '5:30 PM',
        'EventAgendaStatusName': 'Final', 'EventAgendaFile': 'https://example.org/agenda.pdf',
        'EventInSiteURL': 'https://example.legistar.com/MeetingDetail.aspx?ID=1',
    },
    {'EventId': 2, 'EventBodyName': 'Rules', 'EventDate': '2026-10-29T00:00:00', 'EventAgendaStatusName': 'Cancelled'},
]

LEGISTAR_ITEMS = [
    {'EventItemTitle': 'Roll Call / Call To Order', 'EventItemAgendaNumber': None, 'EventItemMatterId': None},
    {
        'EventItemTitle': 'Subject: \tProtected Bike Lanes On Telegraph Avenue', 'EventItemAgendaNumber': '4.1',
        'EventItemMatterId': 77, 'EventItemMatterType': 'City Resolution', 'EventItemMatterFile': '26-0101',
        'EventItemMatterAttachments': [{'MatterAttachmentName': 'Staff Report', 'MatterAttachmentHyperlink': 'https://example.org/sr.pdf'}],
    },
    {'EventItemTitle': 'Adjournment', 'EventItemAgendaNumber': '9'},
]


def mock_client(routes: dict[str, object]) -> httpx.AsyncClient:
    def handler(request: httpx.Request) -> httpx.Response:
        for prefix, body in routes.items():
            if str(request.url).startswith(prefix):
                return httpx.Response(200, json=body) if not isinstance(body, str) else httpx.Response(200, text=body)
        return httpx.Response(404)
    return httpx.AsyncClient(transport=httpx.MockTransport(handler))


@pytest.mark.asyncio
async def test_berkeley_parses_items_and_sections():
    client = mock_client({
        berkeley.LISTING: LISTING_HTML,
        f'{berkeley.BASE}/city-council-regular-meeting-eagenda-october-27-2026': (FIXTURES / 'berkeley_eagenda.html').read_text(),
    })
    items = await berkeley.fetch(client, date(2026, 10, 24), date(2026, 11, 14), 4, log)

    assert [i.item_number for i in items] == ['1', '2', '3', '30']
    first = items[0]
    assert first.meeting_date == '2026-10-27'
    assert first.section == 'Consent Calendar'
    assert first.title.startswith('Amendments to Berkeley Municipal Code')
    assert first.document_url.startswith('https://berkeleyca.gov/sites/default/files/')
    assert 'Recommendation:' in (first.description or '')
    assert items[-1].section == 'Action Calendar' and 'Ashby BART' in items[-1].title


@pytest.mark.asyncio
async def test_legistar_skips_boilerplate_and_cancelled():
    client = mock_client({
        f'{legistar.API}/oakland/events/1/eventitems': LEGISTAR_ITEMS,
        f'{legistar.API}/oakland/events': LEGISTAR_EVENTS,
    })
    items = await legistar.fetch(client, 'oakland', 'City of Oakland', date(2026, 10, 24), date(2026, 11, 14), 4, log)

    assert len(items) == 1
    item = items[0]
    assert item.title == 'Protected Bike Lanes On Telegraph Avenue'
    assert item.body == 'City Council'
    assert item.document_url == 'https://example.org/sr.pdf'
    assert item.meeting_time == '5:30 PM'


def test_item_ids_are_stable():
    from src.models import AgendaItem
    a = AgendaItem('berkeley', 'City of Berkeley', 'x', 'Council', '2026-10-27', None, None, None, None, '1', 'Title')
    b = AgendaItem('berkeley', 'City of Berkeley', 'y', 'Council', '2026-10-27', None, None, None, None, '1', 'Title')
    assert a.item_id == b.item_id


def test_keyword_fallback_ranks_matching_items():
    from src.models import AgendaItem
    bike = AgendaItem('o', 'Oakland', 'legistar', 'Council', '2026-10-28', None, None, None, 'City Resolution', '1',
                      'Protected bike lanes on Telegraph Avenue')
    other = AgendaItem('o', 'Oakland', 'legistar', 'Council', '2026-10-28', None, None, None, 'Consent Calendar', '2',
                       'Approve minutes')
    scores = score_with_keywords([bike, other], ['Bike lanes and street safety'])
    assert scores[bike.item_id].relevance > scores[other.item_id].relevance
    assert scores[bike.item_id].action_type == 'vote'
    assert scores[other.item_id].action_type == 'consent'


@pytest.mark.parametrize('section,expected', [
    ('Public Hearing', 'public_hearing'),
    ('Consent Calendar', 'consent'),
    ('Informational Report', 'informational'),
    ('Ordinance', 'vote'),
])
def test_guess_action_type(section, expected):
    assert guess_action_type(section, '') == expected

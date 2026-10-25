"""Relevance scoring: match each agenda item against a resident's plain-English interests."""

from __future__ import annotations

import asyncio
import re
from typing import Literal

import anthropic
from pydantic import BaseModel, Field

from .models import AgendaItem

MODEL = 'claude-opus-5-5'
BATCH_SIZE = 25

ActionType = Literal['vote', 'public_hearing', 'consent', 'discussion', 'informational', 'other']


class ItemScore(BaseModel):
    item_id: str
    relevance: float = Field(description='0.0 = unrelated to every interest, 1.0 = squarely about one of them')
    matched_interest: str | None = Field(description='The interest this item matches best, verbatim, or null')
    reason: str = Field(description='One sentence on why this matters (or does not) to the resident')
    plain_summary: str = Field(description='One plain-English sentence describing what the government would actually do')
    action_type: ActionType


class ScoreBatch(BaseModel):
    scores: list[ItemScore]


SYSTEM = """You triage local-government agenda items for a resident.
For each item, judge how directly it affects the resident's stated interests. Be strict:
procedural items, routine minutes and unrelated contracts score below 0.2. Indirect but real
effects (a budget line that funds the thing they care about) score 0.4-0.7. Items squarely
about an interest score 0.8 or higher. Write the summary for a busy neighbor with no
government jargon, and never invent facts that are not in the item text.
Classify action_type: "consent" for consent-calendar items voted on as a block, "vote" for
items the body will act on individually, "public_hearing" for hearings, "discussion" for
work sessions or study items, "informational" for reports with no action."""


async def score_with_claude(
    items: list[AgendaItem],
    interests: list[str],
    api_key: str | None,
    log,
) -> dict[str, ItemScore]:
    client = anthropic.AsyncAnthropic(api_key=api_key) if api_key else anthropic.AsyncAnthropic()
    sem = asyncio.Semaphore(4)
    interest_block = '\n'.join(f'- {i}' for i in interests)

    async def run(batch: list[AgendaItem]) -> list[ItemScore]:
        listing = '\n'.join(
            f'[{it.item_id}] ({it.jurisdiction_name} · {it.body} · {it.meeting_date} · {it.section or "item"}) {it.prompt_text()}'
            for it in batch
        )
        async with sem:
            response = await client.messages.parse(
                model=MODEL,
                max_tokens=16000,
                system=SYSTEM,
                output_config={'effort': 'low'},
                output_format=ScoreBatch,
                # Server-side fallback: if a safety classifier declines, the API retries on a fallback model.
                extra_headers={'anthropic-beta': 'server-side-fallback-2026-07-01'},
                extra_body={'fallbacks': 'default'},
                messages=[{
                    'role': 'user',
                    'content': f'Resident interests:\n{interest_block}\n\nAgenda items (score every one, keep item_id exactly):\n{listing}',
                }],
            )
        if response.stop_reason == 'refusal' or response.parsed_output is None:
            log.warning(f'Scoring batch returned no result (stop_reason={response.stop_reason})')
            return []
        return response.parsed_output.scores

    batches = [items[i:i + BATCH_SIZE] for i in range(0, len(items), BATCH_SIZE)]
    results = await asyncio.gather(*(run(b) for b in batches), return_exceptions=True)
    scores: dict[str, ItemScore] = {}
    for result in results:
        if isinstance(result, Exception):
            log.warning(f'Scoring batch failed: {result}')
            continue
        for s in result:
            scores[s.item_id] = s
    return scores


_WORD = re.compile(r'[a-z]{4,}')
_STOP = {'with', 'that', 'this', 'from', 'about', 'near', 'their', 'into', 'more', 'city', 'local', 'and', 'the'}


def guess_action_type(section: str | None, title: str) -> ActionType:
    """Classify an item from its agenda section or matter type when no model is available."""
    text = f'{section or ""} {title}'.lower()
    if 'public hearing' in text:
        return 'public_hearing'
    if 'consent' in text:
        return 'consent'
    if 'informational' in text or 'information report' in text or 'information calendar' in text:
        return 'informational'
    if 'work session' in text or 'study session' in text or 'discussion' in text:
        return 'discussion'
    if any(k in text for k in ('action calendar', 'resolution', 'ordinance', 'recommendation', 'adopt', 'approve')):
        return 'vote'
    return 'other'


def score_with_keywords(items: list[AgendaItem], interests: list[str]) -> dict[str, ItemScore]:
    """Offline fallback when no Anthropic key is configured: keyword overlap on word stems."""
    terms = {i: {w[:6] for w in _WORD.findall(i.lower()) if w not in _STOP} for i in interests}
    scores = {}
    for it in items:
        text = it.prompt_text(2000).lower()
        best, best_hits = None, []
        for interest, stems in terms.items():
            hits = sorted(st for st in stems if st in text)
            if len(hits) > len(best_hits):
                best, best_hits = interest, hits
        relevance = {0: 0.0, 1: 0.35, 2: 0.6}.get(len(best_hits), 0.85)
        scores[it.item_id] = ItemScore(
            item_id=it.item_id,
            relevance=relevance,
            matched_interest=best,
            reason=(f'Keyword match on {", ".join(repr(h) for h in best_hits)}.' if best_hits else 'No overlap with your interests.'),
            plain_summary=it.title,
            action_type=guess_action_type(it.section, it.title),
        )
    return scores

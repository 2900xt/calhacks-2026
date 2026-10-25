from __future__ import annotations

import hashlib
from dataclasses import asdict, dataclass, field


@dataclass
class AgendaItem:
    """One agenda item, normalized across every platform adapter."""

    jurisdiction: str
    jurisdiction_name: str
    platform: str
    body: str
    meeting_date: str  # ISO date, YYYY-MM-DD
    meeting_time: str | None
    meeting_url: str | None
    agenda_url: str | None
    section: str | None
    item_number: str | None
    title: str
    description: str | None = None
    document_url: str | None = None
    attachments: list[dict] = field(default_factory=list)

    @property
    def item_id(self) -> str:
        key = f'{self.jurisdiction}|{self.body}|{self.meeting_date}|{self.item_number}|{self.title[:120]}'
        return hashlib.sha1(key.encode()).hexdigest()[:12]

    def to_record(self) -> dict:
        record = {'itemId': self.item_id}
        for key, value in asdict(self).items():
            record[_camel(key)] = value
        return record

    def prompt_text(self, max_chars: int = 900) -> str:
        parts = [self.title]
        if self.description and self.description.strip() != self.title.strip():
            parts.append(self.description)
        text = ' — '.join(parts)
        return text[:max_chars]


def _camel(snake: str) -> str:
    head, *rest = snake.split('_')
    return head + ''.join(word.capitalize() for word in rest)

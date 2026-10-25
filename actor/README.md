# CivicSignal: Local Government Agenda Monitor

**Tell CivicSignal what you care about. It reads upcoming city council agendas, finds the items that affect you, and explains each one in a plain sentence, with a link to the staff report, before the vote.**

Local decisions about bike lanes, housing, rent rules and police budgets are published days before each meeting. They're buried in agenda pages and PDFs spread across different platforms. CivicSignal reads them for you.

## What it does

1. **Collects agendas from several platforms** and normalizes every item into one schema:
   - **Legistar Web API** (Oakland, San José, Alameda, Mountain View, Sunnyvale, plus *any* Legistar client slug you add, which covers hundreds of US cities, counties and agencies)
   - **Berkeley eAgenda** pages on berkeleyca.gov (Berkeley doesn't use Legistar)
2. **Scores each item against your interests** with Claude: a relevance from 0 to 1, the interest it matches, a one-sentence plain summary, and the kind of action (vote, consent, public hearing, discussion or informational).
3. **Returns only what matters**, ranked, with links to the source documents. A Markdown digest is saved to the `OUTPUT` record for agents and alerts.

## Input

| Field | What it does |
|---|---|
| `interests` *(required)* | Topics you care about, in plain English |
| `jurisdictions` | Preset councils to watch (Berkeley, Oakland, San José, Alameda, Mountain View, Sunnyvale) |
| `extraLegistarClients` | Any other Legistar slug, e.g. `seattle` |
| `daysAhead` / `daysBack` | Time window to scan (default: the next 21 days) |
| `maxMeetingsPerJurisdiction` | Caps run time and cost (default 4) |
| `minRelevance` | Threshold for a match (default 0.5) |
| `includeAllItems` | Also output the items below the threshold |
| `alertEmail` | Email the matches here via the `apify/send-mail` Actor |
| `anthropicApiKey` | Optional: use your own key for Claude scoring |

Example:

```json
{
  "interests": ["Bike lanes and street safety", "New apartments near UC Berkeley"],
  "jurisdictions": ["berkeley", "oakland"],
  "daysAhead": 21
}
```

## Output

One dataset row per matching agenda item:

```json
{
  "relevance": 0.86,
  "matchedInterest": "Housing affordability and new apartments near UC Berkeley",
  "plainSummary": "The council picks a developer to negotiate building housing on the Ashby BART east parking lot and sets aside predevelopment money.",
  "reason": "Directly shapes how many new homes get built a mile from campus.",
  "actionType": "vote",
  "jurisdictionName": "City of Berkeley",
  "body": "City Council (Regular Meeting)",
  "meetingDate": "2026-10-27",
  "section": "Action Calendar",
  "itemNumber": "30",
  "title": "Ashby BART East Lot Developer Selection for Exclusive Negotiation and Reservation of Predevelopment Funding",
  "documentUrl": "https://berkeleyca.gov/sites/default/files/2026-10-27%20Item%2030%20Ashby%20BART%20East%20Lot%20Developer%20Selection.pdf",
  "platform": "berkeley-eagenda",
  "scoredBy": "claude"
}
```

The `OUTPUT` key-value record holds `digest` (Markdown), `matchCount`, `itemsScanned` and the top matches.

## Use it from an AI agent (MCP)

CivicSignal works as a tool for Claude and other MCP clients through Apify's hosted MCP server:

```
https://mcp.apify.com?tools=<username>/civicsignal
```

An agent can call it whenever someone asks "what's coming up in Berkeley about housing?" and answer with cited items.

CivicSignal also runs in **Standby mode** as its own MCP server, with no cold start:

```
https://<username>--civicsignal.apify.actor/mcp
```

It exposes two tools: `find_agenda_items` (interests, jurisdictions and days ahead in; ranked, cited matches out) and `list_jurisdictions`. The same Standby server answers plain HTTP too: `GET /scan?interests=housing|bike lanes&jurisdictions=berkeley,oakland`.

## Pricing

Pay per event:

- `agenda-item-scanned`: each agenda item read and normalized
- `relevant-item-found`: each item that matches your interests

## Run it on a schedule

Save your input as a Task, set `alertEmail`, and attach a weekly Schedule. Each run hands its digest to Apify's `apify/send-mail` Actor, so new matches arrive in your inbox. The CivicSignal web app sets this up in one click.

## Limitations

- School board agendas on BoardDocs aren't supported yet, because BoardDocs blocks automated access.
- San Francisco's Legistar Web API is currently misconfigured on SF's side, so SF isn't in the presets.
- Relevance scores are Claude's judgment. Always check the linked source document before acting.

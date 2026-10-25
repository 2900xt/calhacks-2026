# CalHacks 2026

Team: [@2900xt](https://github.com/2900xt), [@mallhw](https://github.com/mallhw), [@amalhotra08](https://github.com/amalhotra08)

## Tracks
- **Best use of Apify** — top 5 projects using Apify in a meaningful way ($2,000 / $1,000 / $800 / $400 / $400)
- **Best Actor** — best Apify Actor built for the event ($400)

## Project: CivicSignal

Know what your city council will decide, before the vote. CivicSignal reads upcoming city council agendas across platforms, normalizes every item, and uses Claude to flag the ones that match a resident's plain-English interests.

- [`actor/`](actor/): the **CivicSignal Apify Actor** (Python). Adapters for the Legistar Web API (Oakland, San José, Alameda, Mountain View, Sunnyvale and any other Legistar city) and Berkeley's eAgenda pages, Claude relevance scoring, pay-per-event pricing, and input and dataset schemas.
- [`web/`](web/): Next.js app. It runs the Actor through `apify-client`, shows the matches, drafts public comments, and has a Claude agent that calls the Actor through Apify's hosted MCP server.

### Run locally

```bash
# Actor (writes to actor/storage/)
cd actor && uv venv && uv pip install -r requirements.txt && .venv/bin/python -m src

# Deploy the Actor
apify login && cd actor && apify push

# Web app (needs web/.env.local: see web/.env.example)
cd web && npm install && npm run dev
```

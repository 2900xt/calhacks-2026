# CivicSignal: Devpost draft

> Draft for the Cal Hacks 13.0 submission (due **Oct 25, 9:00am PDT**). Tracks: **Best Use of Apify**, **Best Actor (Apify)**, Anthropic **Claude for Public Benefit**, Atlassian **Best Agent** (name it in the description), People-First Social Impact. Replace every `TODO` before submitting.

## Tagline

Know what your city will decide, before the vote.

## Inspiration

The decisions that shape daily life, like bike lanes, new apartments, rent rules and police budgets, are made at city council meetings. Each one is announced days in advance in an agenda, but those agendas are buried in PDFs and portals that differ from city to city. By the time most residents hear about a decision, the public comment period is over.

## What it does

You tell CivicSignal what you care about in plain English and pick your cities. It reads every upcoming agenda item across Bay Area city councils (Berkeley, Oakland, San José, Alameda, Mountain View, Sunnyvale, or any of the hundreds of cities on Legistar) and returns the items that affect you. For each item you get:

- a one-sentence plain-English summary and why it matters to you
- whether it's a vote, a public hearing or a consent-calendar item
- the meeting date and a link to the staff report

From there you can:

- **draft a public comment** with Claude
- **add the meetings to your calendar**
- **start a weekly watch** that emails new matches
- **ask the CivicSignal agent** questions, which it answers by calling the Actor and reading the staff reports

## How we built it: Apify is the backbone

- **The CivicSignal Actor (published on Apify Store).** It's written in Python with httpx and BeautifulSoup, and has two platform adapters:
  - the Legistar Web API
  - Berkeley's eAgenda HTML pages, since Berkeley doesn't use Legistar

  Both normalize into one schema. Claude (`claude-opus-5-5` at low effort, with structured outputs) scores every item against the user's interests in batches.
- **Datasets and a key-value store.** Each match is a dataset row, and the dataset schema includes a table view. A Markdown digest goes in the `OUTPUT` record so agents can read the result in one call.
- **Pay per event.** The Actor charges `agenda-item-scanned` and `relevant-item-found`, which also makes it payable by agents per call.
- **Standby mode with its own MCP server.** `usesStandbyMode` plus `webServerMcpPath: /mcp` turn the Actor into an always-on MCP server with `find_agenda_items` and `list_jurisdictions` tools, plus a plain `GET /scan` API.
- **Apify's hosted MCP server.** The in-app agent is Claude using the Anthropic MCP connector against `mcp.apify.com?tools=<actor>,apify/web-fetch`. It runs CivicSignal as a tool, then opens staff reports with `apify/web-fetch` to answer follow-up questions.
- **Tasks and Schedules.** "Keep watching for me" saves the input as an Apify Task and attaches a Schedule.
- **Actor-to-Actor.** Scheduled runs email their digest through the official `apify/send-mail` Actor.
- **Web app.** Next.js 15 and Tailwind, talking to Apify through `apify-client`.

## Challenges we ran into

- **Every city is different.** Berkeley publishes agendas as Drupal pages, Oakland and San José use Legistar, and SF's Legistar API currently returns errors. The adapter layer and a shared schema contain that mess.
- **School boards are blocked.** BoardDocs, which most school districts use, blocks automated access. We chose to respect that rather than work around it, and listed it as a limitation.
- **Agendas are full of boilerplate.** Roll calls and ADA notices had to be filtered out before scoring so that relevance means something.

## Accomplishments we're proud of

- Real data from real meetings: one scan reads 200+ live agenda items across four cities.
- One Actor that works three ways: as a batch job, as an always-on API, and as an MCP server for any agent.
- TODO: add a concrete example from the demo, e.g. "It flagged the Ashby BART housing developer selection on Berkeley's Oct 27 agenda."

## What we learned

TODO (team): fill in, e.g. how Standby mode and MCP fit together, and writing for Apify Store quality signals such as schemas, README and pricing.

## What's next

- More platforms: Granicus/PrimeGov, CivicPlus, and school boards where access is allowed.
- Vote outcomes: follow items through to the minutes and tell users how it went.
- x402 payments, so any agent can pay per call without an Apify account.

## Built with

apify, apify-sdk-python, apify-client, apify-mcp, python, httpx, beautifulsoup, aiohttp, claude, anthropic-api, mcp, nextjs, react, typescript, tailwindcss, legistar

## Links

- GitHub: https://github.com/2900xt/calhacks-2026
- Apify Store: TODO (after `apify push` and publishing)
- Demo video: TODO

---

## 3-minute demo script

1. **Hook (0:00–0:20).** "Berkeley's council votes Tuesday on who builds housing at Ashby BART. Did you know? Almost nobody does, because it's item 30 in an agenda page." Show the raw agenda page.
2. **Scan (0:20–1:05).** Enter interests (housing near campus, bike lanes) and pick Berkeley and Oakland. Click Scan and point out the four-step strip as it lights up. Results arrive grouped by date, with plain summaries and relevance. Open one staff report.
3. **Act (1:05–1:35).** "Write a public comment" → type a one-line view → Claude drafts it. Then "Add meetings to calendar."
4. **Agent (1:35–2:15).** Ask "Is anything about bike lanes being voted on soon?" Show the tool chain (Actor call, then dataset fetch, then web-fetch) and the cited answer.
5. **Apify depth (2:15–2:45).** Open the Actor's Store page (schemas, README, pay-per-event pricing), a Console run with its dataset table view, and the Standby `/mcp` endpoint in the "Use it from your own agent" panel. Click "Keep watching" to show the Schedule it created.
6. **Close (2:45–3:00).** "Every city council, one stream, before the vote. CivicSignal."

## Submission checklist

- [ ] `apify push` and a live run with Claude scoring (set `ANTHROPIC_API_KEY` as a secret env var on the Actor)
- [ ] Pay-per-event pricing configured in Console: `agenda-item-scanned`, `relevant-item-found`
- [ ] Actor published to Apify Store (public)
- [ ] Web app deployed (Vercel) with `APIFY_TOKEN`, `APIFY_ACTOR_ID`, `NEXT_PUBLIC_APIFY_ACTOR_ID` and `ANTHROPIC_API_KEY`
- [ ] Replace the sample-data fixture (`web/lib/sample.json`) with a Claude-scored run
- [ ] Record the demo video (sponsors may judge from the video alone)
- [ ] Devpost: project image, GitHub link, tracks selected, Atlassian "Best Agent" named in the description

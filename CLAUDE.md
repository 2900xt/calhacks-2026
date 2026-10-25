# CLAUDE.md

Shared brain for three people each running their own Claude Code on their own account.
Claude sessions cannot message each other across accounts, so this file, `STATUS.md`,
and git are the only channels. Read all three before writing code.

## Project
Cal Hacks 13.0. Tracks: **Best use of Apify** (top 5, $2,000 / $1,000 / $800 / $400 / $400)
and **Best Actor** ($400, separate pot, same build can win both).

Shape of the build, whatever the domain ends up being:
- An Apify **Actor** is the data layer. It scrapes public pages, pushes one row per record
  into a Dataset, has a real `input_schema.json`, a plain-English README, and runs on a schedule.
  It gets published to the Apify Store during the event.
- An **API** calls the Actor through `apify-client`, reads the Dataset, and hands rows to Claude.
- A **web** UI shows the result live. No cached JSON in the demo; Apify judges disqualify that.

Candidate domain (not final): pre-bout scouting for fencers from public FencingTimeLive and
fencingtracker results. Decide and replace this paragraph before the first feature commit.

## Ownership (proposed, swap freely, but write the swap here)
| Path | Owner | Notes |
|---|---|---|
| `actor/` | Matthew (@Mallhw) | Apify Actor, JS + Crawlee |
| `api/` | Taha (@2900xt) | Server, Apify client, Claude calls |
| `web/` | Ansh (@amalhotra08) | Frontend |
| `shared/schema.json` | Matthew | Dataset row shape. Change only via a PR titled `schema: ...` |

Only edit files outside your directory to fix a build break, and say so in `STATUS.md`.

## Workflow
- Read `STATUS.md` before starting a task. Append an entry before you stop.
- `git pull origin main` before every new task.
- One branch per person (`matthew/...`, `taha/...`, `ansh/...`). PR to `main` at least every
  2 hours. Squash-merge. Never push to `main` directly.
- Keep PRs small enough that a teammate can approve them in two minutes.
- If you change an interface (the Dataset row shape, an API route, an env var), say so in
  `STATUS.md` under **Interface changes** and in the PR title.

## Stack
- Node 20+, ESM. Actor uses `apify` + `crawlee` (CheerioCrawler first; PlaywrightCrawler only
  if a page truly needs a browser, it is ~20x the compute).
- Claude via `@anthropic-ai/sdk`. Default model `claude-sonnet-5-5` for speed; switch to
  `claude-opus-5-5` only for the final brief if quality is lacking.
- Secrets in `.env` (gitignored). Copy `.env.example` and fill it in. Never commit a key.

## Apify Actor rules
- `actor/.actor/actor.json`, `input_schema.json`, and `README.md` are part of the deliverable.
  The README is what the Apify judge reads first: what it scrapes, an example output row, a
  run example, known limits.
- Prefer the JSON endpoints a site's own frontend calls (DevTools, Network tab, filter XHR)
  over parsing rendered HTML.
- Public pages only. Nothing behind a login or paywall, no personal data beyond what the
  site publishes about competition results.
- Handle empty results and blocks without crashing; log them as rows with `status`.

## Claude usage rules
- Claude writes the brief from Dataset rows. It must say what it cannot conclude when there
  are few rows. Build the "not enough data" path and show it in the demo.
- No invented facts about an opponent. Every claim in a brief must trace to a row.

## Git
- Never add Claude as a co-author on commits: no `Co-Authored-By: Claude ...` trailer or any other Claude/Anthropic attribution line in commit messages.
- Same for pull requests: no "Generated with Claude Code" footer or other Claude attribution in PR descriptions.

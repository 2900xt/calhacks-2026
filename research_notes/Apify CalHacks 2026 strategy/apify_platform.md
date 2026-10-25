# Apify Platform: Technical Briefing for a 36-Hour Hackathon Build (current to 24 Oct 2026)

Source-freshness legend: **[V]** = fetched/verified in this session (Oct 2026). **[BG]** = background knowledge from before this session (training data, roughly mid-2026 cutoff), canonical URL given but NOT re-fetched; treat as probably-correct-but-check.

## 1. What is Apify, and what are its core primitives?

### Takeaway
Apify bills itself as "the largest marketplace of tools for AI." Its unit is the **Actor**, a serverless containerized program that takes JSON input and returns structured output. Each run gets its own dataset, key-value store and request queue. Actors run either as batch jobs or in **Standby mode** as a persistent HTTP API or MCP server at `https://<user>--<actor>.apify.actor`.

### Cited Findings
- Apify calls itself "the largest marketplace of tools for AI." Actors are "serverless cloud programs" that take JSON input and return structured output [V] — [apify.com/AGENTS.md](https://apify.com/AGENTS.md)
- **Run**: one execution of an Actor, with its own dataset, key-value store and request queue. Terminal statuses are `SUCCEEDED`, `FAILED`, `TIMED-OUT` and `ABORTED` [V] — [AGENTS.md](https://apify.com/AGENTS.md)
- **Dataset**: append-only structured results, exportable as JSON, CSV, Excel or XML. Actor calls return a dataset ID, not the data itself [V] — [AGENTS.md](https://apify.com/AGENTS.md)
- **Key-value store**: unstructured output such as screenshots or HTML [V] — [AGENTS.md](https://apify.com/AGENTS.md)
- **Compute Unit (CU)** = memory (GB) × duration (hours). 1,024 MB for 1 hour = 1 CU [V] — [AGENTS.md](https://apify.com/AGENTS.md)
- **Tasks / schedules / webhooks**: these are per-user limits on every plan: 5,000 tasks, 100 schedules, 100 webhooks, 500 Actors. One schedule can trigger up to 10 Actors and 10 tasks [V] — [docs.apify.com/platform/limits](https://docs.apify.com/platform/limits)
- **Request queue**: the crawl frontier, deduplicated by URL, persistent and resumable. Crawlee uses it under the hood [BG] — [docs.apify.com/platform/storage/request-queue](https://docs.apify.com/platform/storage/request-queue)
- **Builds and versions**: each Actor has versions (e.g. 0.1, 0.2). Each build is a Docker image, tagged `latest` or `beta` [BG] — [docs.apify.com/platform/actors/development/builds-and-runs/builds](https://docs.apify.com/platform/actors/development/builds-and-runs/builds)
  - Build limits [V]: 4,096 MB of memory, 1,800 s timeout — [limits](https://docs.apify.com/platform/limits)
- **Input and output schemas**:
  - `.actor/input_schema.json` generates the Console input UI, and also gives MCP/AI callers a machine-readable tool signature [BG] — [docs: input schema](https://docs.apify.com/platform/actors/development/actor-definition/input-schema)
  - The maximum input schema size is 500 kB [V] — [limits](https://docs.apify.com/platform/limits)
  - Output-schema inference is available only on the hosted MCP server [V] — [docs MCP](https://docs.apify.com/platform/integrations/mcp)
  - The `apify-generate-output-schema` Agent Skill is now marked deprecated [V] — [AGENTS.md](https://apify.com/AGENTS.md)
- **Standby mode** [V] — [docs: Standby](https://docs.apify.com/platform/actors/development/programming-interface/standby)
  - The Actor runs an HTTP server and the platform proxies requests to it. Any HTTP method works.
  - The platform starts and stops runs with load. A run that gets no requests within the idle timeout is stopped.
  - **Templates (`apify create` and Console) enable Standby by default.** To turn it on manually, set `"usesStandbyMode": true` in `.actor/actor.json`.
  - Port: listen on `Actor.config.get('containerPort')` in JS or `Actor.configuration.web_server_port` in Python. The env var `ACTOR_WEB_SERVER_PORT` overrides it.
  - Readiness probe: the platform sends GET `/` with header `x-apify-container-server-readiness-probe`, and you must respond to it.
  - URL is `https://<username>--<actor-name>.apify.actor` or `https://<actor-id>.apify.actor`, and stays stable across runs.
  - MCP endpoint = Standby URL + `webServerMcpPath`, so **an Actor can be an MCP server**.
  - Requests need an Apify API token.
  - Detect Standby at runtime with `APIFY_META_ORIGIN == STANDBY`.
- **Proxies** [V] — [apify.com/pricing](https://apify.com/pricing)
  - Datacenter: 5 IPs included on Free, 30 on Starter.
  - Residential: $8/GB on Free and Starter, $7.50 on Scale, $7 on Business.
  - Google SERP proxy: $2.50 per 1,000 on Free and Starter.
  - "Unblocker": $1.50 per 1,000 requests on Free.
  - On the Free plan, Apify Proxy can only be used from inside the platform, not from external clients.
- **Synchronous API**:
  - `POST https://api.apify.com/v2/actors/{user}~{actor}/run-sync-get-dataset-items`, max 300 s.
  - Async flow: `POST .../runs`, then poll `GET /actor-runs/{runId}`, then `GET /datasets/{id}/items?format=csv|json`.
  - OpenAPI spec at `https://apify.com/openapi.json` [V] — [AGENTS.md](https://apify.com/AGENTS.md)

### Inferences
- Standby + `webServerMcpPath` is the cleanest "wow" primitive. With it, a hackathon Actor can be both a callable REST API and an MCP server with a stable public URL, with no separate hosting.
- Defining a careful input schema and output schema directly affects discoverability: Apify AI, MCP search and x402 agents all rely on schemas.

### Gaps
- I did not find the default Standby idle timeout or max concurrent requests per Standby run. The docs page doesn't state them.
- I did not re-verify default and maximum run timeouts. The limits page omits them.
- I couldn't confirm what the "dynamic Actor memory" feature (blog, ~Feb 2, 2026, per search snippet) does.

## 2. Developer tooling: CLI, templates, SDKs, Crawlee, API clients — how fast is zero-to-deployed?

### Takeaway
The path is `npm i -g apify-cli`, `apify login`, `apify create`, `apify run`, `apify push`, which takes minutes. Since mid-2026 the CLI has been explicitly redesigned for AI coding agents (v1.7/1.8). Agent Skills (`npx skills add apify/agent-skills`) let Claude Code or Codex scaffold, build and deploy Actors. Since Sept 2026 you can also create an Actor straight from a Git repo in the Console.

### Cited Findings
- **CLI workflow**: install with `npm install -g apify-cli`, then `apify login`, then `apify create my-actor`, develop in `src/`, `apify run` locally, `apify push` to deploy [V] — [AGENTS.md](https://apify.com/AGENTS.md)
- **CLI 1.7.0 / 1.8.0** ("built for AI agents that mess up", Jul 17 2026) [V] — [blog](https://blog.apify.com/apify-cli-for-ai-agents/) / [blog 1.7.0](https://blog.apify.com/apify-cli-1-7-0/)
  - Adds proper exit codes, machine-readable status, input-schema hints, OS-keychain credential storage, and one-command MCP setup (`apify mcp install <client>`).
  - `apify actors info <actor-id> --input` prints an Actor's input schema before running it.
- **Agent Skills** (introduced ~Mar 26 2026 per blog search snippet), installed with `npx skills add apify/agent-skills` [V] — [docs.apify.com/agents/skills](https://docs.apify.com/agents/skills), [AGENTS.md](https://apify.com/AGENTS.md)
  - Skills: `apify-actor-development`, `apify-actorization` (convert an existing project into an Actor), `apify-integration-development`, `apify-ultimate-scraper`, and `apify-generate-output-schema` (deprecated).
  - Skills "layer over your existing connection" (MCP or CLI). They need the CLI logged in or `APIFY_TOKEN` set.
- **Apify plugin for coding agents**: the docs recommend it, bundling the MCP server with Agent Skills [V] — [docs MCP](https://docs.apify.com/platform/integrations/mcp)
- **Git-based Actor creation**: "Create an Actor with a Git repo in a few clicks" (Sep 3 2026) [V, title only] — [blog updates tag](https://blog.apify.com/tag/apify-updates/)
- **SDKs**: `apify` is the package for *building* Actors. `apify-client` (JS/TS and Python) is for *calling* Actors from apps. Both clients support the cost cap `maxTotalChargeUsd` / `max_total_charge_usd` [V] — [AGENTS.md](https://apify.com/AGENTS.md)
- **Crawlee** [BG] — [crawlee.dev](https://crawlee.dev), [github.com/apify/crawlee](https://github.com/apify/crawlee), [github.com/apify/crawlee-python](https://github.com/apify/crawlee-python)
  - Apify's open-source crawling library, available for both JS/TS and Python.
  - Crawler classes: `CheerioCrawler`, `PlaywrightCrawler`, `PuppeteerCrawler`, `HttpCrawler`, `AdaptivePlaywrightCrawler` (JS); `BeautifulSoupCrawler`, `ParselCrawler`, `PlaywrightCrawler` (Python).
  - Includes autoscaling, session and proxy rotation, and fingerprinting.
- **Templates** [BG] — [apify.com/templates](https://apify.com/templates)
  - `apify create` offers templates for TS/JS/Python: Crawlee + Cheerio/Playwright/Puppeteer, BeautifulSoup, Scrapy, an empty template, Standby, an MCP server template, and LLM/agent templates (LangChain/LangGraph, CrewAI, LlamaIndex, Smolagents, PydanticAI).
- **mcpc**: Apify's universal command-line MCP client (github.com/apify/mcpc), now with x402 support [V] — [x402 blog](https://blog.apify.com/introducing-x402-agentic-payments/)
- **LLM-friendly docs**: `https://docs.apify.com/llms.txt`. Appending `.md` to any Actor Store URL returns its README, pricing and input schema as markdown [V] — [AGENTS.md](https://apify.com/AGENTS.md)

### Inferences
- Realistic zero-to-deployed time for a template-based Actor is roughly 10–20 minutes, including the build. Builds can take up to 30 minutes in the worst case.
- Using Claude Code with Apify Agent Skills (`apify-actor-development` / `apify-actorization`) to build the Actor is itself a demo point an Apify judge would appreciate.

### Gaps
- I did not verify the exact current template list or SDK version numbers (apify-sdk-js / apify-sdk-python) in this session.

## 3. AI/agent integrations: MCP server, RAG Web Browser, WCC, frameworks, x402/agentic payments

### Takeaway
AI agents are Apify's dominant 2025–2026 push. The pieces are:
- the hosted MCP server at `mcp.apify.com`, which uses OAuth and dynamic Actor discovery, and was migrated to the stateless MCP spec in Aug 2026
- **MCP connectors**, which let Actors call your Notion, Slack or GitHub
- **x402 payments**, so agents pay per call in USDC on Base with no account
- **AGI**, at agi.apify.com, which sells prepaid tokens to agents
- **Apify AI**, a chat assistant in the Console

### Cited Findings
- **MCP server** [V] — [docs MCP](https://docs.apify.com/platform/integrations/mcp)
  - Hosted at `https://mcp.apify.com` over Streamable HTTP, with OAuth (recommended) or `Authorization: Bearer <APIFY_TOKEN>`.
  - Local option: `npx -y @apify/actors-mcp-server@latest` with `APIFY_TOKEN`, requires Node 18+.
  - Default tools: `search-actors`, `fetch-actor-details`, `call-actor`, `search-apify-docs`, `fetch-apify-docs`, `report-problem`, plus the Actors `apify/rag-web-browser` and `apify/web-fetch`.
  - Optional tool groups: runs, storage, tasks, schedules. Select them with `?tools=actors,docs,apify/rag-web-browser`.
  - Rate limit is 30 requests/s per user.
  - The discovery and docs tools work with no account.
- The MCP server launched in June 2025 [V, secondary mention] — [Apify AI blog](https://blog.apify.com/introducing-apify-ai/)
- Sept 2026 coverage reports a new MCP server version with "40 production data tools" [V, secondary snippet, unconfirmed on primary] — search result only
- **MCP workflow** [V] — [AGENTS.md](https://apify.com/AGENTS.md)
  - Steps: `search-actors`, `fetch-actor-details`, `call-actor`, `get-actor-run`, `get-dataset-items`.
  - `call-actor` waits 30 s by default (max 45 s) and returns a run ID and storage IDs, not the data.
  - Cap spend with `callOptions.maxTotalChargeUsd`.
  - Server card at `https://mcp.apify.com/.well-known/mcp/server-card.json`.
- **Stateless MCP spec migration**: "Migrating the Apify MCP Server to the new stateless spec" (Aug 2026) [V, title only] — [blog updates tag](https://blog.apify.com/tag/apify-updates/)
- **MCP connectors** (Jun 9 2026, Jan Čurn, CEO) [V] — [blog](https://blog.apify.com/announcing-mcp-connectors/)
  - A "new kind of input for Actors": the user attaches an authenticated remote MCP server (Notion, GitHub, Slack and so on) to an Actor's input in the Console.
  - The Actor can then call that server's tools at runtime.
  - Credentials are encrypted and injected by Apify's proxy, so the Actor never sees them. You can restrict which tools the Actor may use.
  - Example Actors: Klaviyo Campaign Drafter, Universal MCP Connector, Travel Budget Planner.
- **x402** (Jun 30 2026, Škopek and Kopecký; built with Coinbase) [V] — [blog](https://blog.apify.com/introducing-x402-agentic-payments/)
  - Over 20,000 Actors are payable via x402 in USDC on Base (`eip155:8453`), with no account or API key. Apify says this is about 10x the ~2,000 x402 tools that existed before.
  - Flow:
    1. Call a REST endpoint without a token, optionally with header `X-APIFY-PAYMENT-PROTOCOL: X402`.
    2. The server returns HTTP 402 with a base64 `PAYMENT-REQUIRED` header.
    3. The client signs and retries with a `PAYMENT-SIGNATURE` header.
  - Payment schemes:
    - `upto` (x402 v2, Permit2): authorize a ceiling and pay only actual usage.
    - `exact` (v1): fixed price, with a $1 deposit refunded after 60 minutes idle.
  - Tooling: Coinbase Agentic Wallet `awal` CLI, plus skill `npx skills add apify/awesome-skills --skill apify-x402-agentic-wallet`.
  - Works only with pay-per-event Actors [V] — [AGENTS.md](https://apify.com/AGENTS.md)
  - Examples of what $1 buys: ~250 Google Maps places, ~2,500 X posts.
- **AGI (Agent General Interface)** [V] — [AGENTS.md](https://apify.com/AGENTS.md)
  - `https://agi.apify.com` sells prepaid, spend-capped API tokens via x402 or **MPP** (Machine Payments Protocol). The tokens work on `api.apify.com` and `mcp.apify.com`.
  - Current terms are at `https://agi.apify.com/AGENTS.md`.
- **Skyfire**: the MCP docs mention per-request agentic payments via Skyfire, which also require pay-per-event Actors [V] — [docs MCP](https://docs.apify.com/platform/integrations/mcp)
- **Apify AI** (Jul 21 2026, beta) [V] — [blog](https://blog.apify.com/introducing-apify-ai/)
  - A conversational assistant in the Console: describe a task, and it finds, compares, configures and runs an Actor, then returns the dataset.
  - Lives in the Store search bar (intent-style queries get routed to it) and a dashboard widget. It uses the same tools as the MCP server.
  - Excludes full-permission and rental Actors.
  - Discoverability depends on the Actor's quality score, README, and input/output schemas.
  - Roadmap: tasks, schedules, publishing and integrations.
- **Integrations page** [V] — [docs integrations](https://docs.apify.com/platform/integrations)
  - AI frameworks: LangChain, OpenAI Agents SDK, Vercel AI SDK, Google ADK, MCP.
  - Vector DB: Pinecone.
  - Automation: n8n, Make, Zapier, Gumloop.
  - Agent clients: Claude and Claude Code, ChatGPT/Codex, Cursor, GitHub Copilot, VS Code, OpenCode, Kimi Code, Qwen, DeepSeek, Grok Bot, OpenClaw, Hermes Agent.
  - Data: Snowflake, Airtable, Google Drive, HubSpot.
- **RAG Web Browser** (`apify/rag-web-browser`) and `apify/web-fetch` are default tools on the MCP server [V] — [docs MCP](https://docs.apify.com/platform/integrations/mcp)
  - RAG Web Browser searches Google and returns page content as Markdown for LLMs. It supports Standby (HTTP API) mode [BG] — [apify.com/apify/rag-web-browser](https://apify.com/apify/rag-web-browser)
- **Website Content Crawler (WCC)**: Apify's flagship crawler for LLM/RAG ingestion. It crawls whole sites into cleaned Markdown/text and can push to vector DBs [BG] — [apify.com/apify/website-content-crawler](https://apify.com/apify/website-content-crawler)
  - Blog comparison "Crawl4AI vs. Website Content Crawler" (Oct 16 2026) [V, title] — [blog](https://blog.apify.com/crawl4ai-vs-website-content-crawler/)
- Other recent agent-themed posts [V, titles] — [blog.apify.com](https://blog.apify.com/)
  - "I thought AI agents were abusing my Actors. They were my best-behaved users." (Oct 20 2026)
  - "How to use MCP with Apify Actors" (Oct 22 2026)
  - "Track viral posts… with a Grok Bot" (Oct 20 2026)

### Inferences
- What an Apify judge will most likely reward, in rough order:
  1. A new PPE-priced Actor in Standby mode exposing an MCP endpoint.
  2. That Actor consumed by an agent (Claude, OpenAI Agents SDK, LangChain) via mcp.apify.com.
  3. Ideally an agent paying via x402 or AGI.
  4. Bonus: MCP connectors (the Actor writes into the user's Notion or Slack).
  5. Bonus: being discoverable by Apify AI, which needs good schemas.
- x402 needs USDC on Base in a hot wallet, so keep the amounts tiny. It's a strong demo but adds setup risk. AGI prepaid tokens may be the lower-friction "agent pays" route.

### Gaps
- LlamaIndex, CrewAI, Agno, Haystack, Qdrant, Milvus and Chroma were not on the integrations index page I fetched. Earlier versions of the docs had pages for several of them [BG], so check the docs sidebar.
- I found no "Apify agent framework" beyond the templates and Agent Skills.

## 4. Apify Store: size, popular Actors, monetization, creator programs

### Takeaway
The Store has tens of thousands of Actors. Apify's own pages say "50,000+" in mid/late 2026, but also "30,000+", so the figures are inconsistent. Monetization is converging on **pay-per-event (PPE)**: rental was retired on 30 Sep 2026. Apify reports paying developers about $1.4M per month. The $1M Challenge (Nov 2025 – Jan 2026) drew 704 developers and 3,329 Actors.

### Cited Findings
- Store size claims conflict [V]:
  - "50,000+ Actors" on the MCP-connectors post header and the Apify AI post CTA, while the same connectors post footer says "30,000+" — [MCP connectors blog](https://blog.apify.com/announcing-mcp-connectors/), [Apify AI blog](https://blog.apify.com/introducing-apify-ai/)
  - 26,929 Actors as of Apr 2026, per a search snippet (secondary)
  - Over 20,000 Actors are x402-payable (Jun 2026) — [x402 blog](https://blog.apify.com/introducing-x402-agentic-payments/)
- Apify says it paid developers **$1.4M "last month"** (as of the Jun 2026 post), and that "many developers earn over $3k" [V] — [MCP connectors blog](https://blog.apify.com/announcing-mcp-connectors/)
- **Store categories** were redesigned Oct 7 2026: "browse by the job, filter by what you get back" [V, title] — [blog updates tag](https://blog.apify.com/tag/apify-updates/)
- Store search API (no account needed): `GET https://api.apify.com/v2/store?search=...&category=...&limit=10` [V] — [AGENTS.md](https://apify.com/AGENTS.md)
- **Rental is retired**. Rental Actors must migrate to PPE by **30 Sep 2026**. New rental listings and price changes stopped on 31 Mar 2026. Unmigrated Actors fall back to pay-per-usage, which earns the creator nothing [V] — [blog: migrating to PPE](https://blog.apify.com/migrating-to-pay-per-event-pricing/), [Why Apify is standardizing Actor pricing](https://blog.apify.com/standardizing-actor-pricing)
- **PPE**: the creator defines named events that the code charges for (e.g. `Actor.charge('result')`). There are also synthetic events such as an Actor-start event (example given: $0.05 per 1,000 starts) [V snippet] — [docs: pay per event](https://docs.apify.com/platform/actors/publishing/monetize/pay-per-event)
  - PPE is also the recommended model for Standby Actors [V] — [Standby docs](https://docs.apify.com/platform/actors/development/programming-interface/standby)
  - x402 and Skyfire both require PPE.
- **$1M Challenge** [V] — [apify.com/challenge](https://apify.com/challenge), [weekly spotlight](https://apify.com/challenge/spotlight)
  - Ran Nov 2025 – Jan 2026: 704 developers, 3,329 Actors published, 1,086 qualified.
  - Grand prizes: SIÁN OÜ ($30k), johnvc ($20k), HappiTap ($10k).
  - The jury weighed monthly active users, quality, technical excellence and usefulness.
  - Weekly spotlight prizes were $2k each. There were also newcomer, veteran and regional awards.
  - A winners celebration was held Feb 4 (Discord).
- Creator success story: "How I built 98 production Actors in 6 months on Apify Store" [V, title] — [blog](https://blog.apify.com/building-98-actors-on-apify-store/)
- Blog post "Get more people to use your Actor with task examples" (Oct 22 2026) [V, title] — [blog](https://blog.apify.com/actor-task-examples/)
- **Most popular Actors** [BG]: Google Maps Scraper (compass/crawler-google-places), Instagram Scraper, TikTok Scraper, Website Content Crawler, Google Search Results Scraper, Amazon scrapers, Twitter/X scrapers — [apify.com/store](https://apify.com/store). Not re-verified.

### Inferences
- If you build a Store Actor, use PPE pricing. It is the only model compatible with x402, Skyfire, Apify AI ranking and Standby, and it is plainly the direction Apify is pushing.
- Judges are likely to value "real users / MAU-style" thinking, as the $1M Challenge criteria did. Publishing to the Store with a good README and schemas signals this.

### Gaps
- I found no authoritative Oct 2026 Store count. Creator revenue share was not re-verified ([BG]: historically 80% of revenue minus platform costs).
- I found no successor challenge announced for 2026.

## 5. Pricing & free tier — what a hackathon team gets and will hit

### Takeaway
The Free plan needs no credit card and gives **$5/month** of usage at $0.20/CU. That is about 25 CU, for example 25 hours at 1 GB. Access is **blocked**, not billed, when the credit runs out. Students get 30% off Starter and Scale. A **$1/month Creator plan includes a one-time $500 of usage for the first 6 months**, the best hack for a team building its own Actors. Its Store usage is limited to "universal" Actors.

### Cited Findings
- **Plans** [V, page undated, fetched Oct 2026] — [apify.com/pricing](https://apify.com/pricing)
  - Free: $0, $5 credit, 16 GB max RAM, 5 concurrent runs.
  - Starter: $19 ($17 annual), 64 GB, 32 runs, $0.20/CU.
  - Scale: $199, $0.16/CU.
  - Business: $999, $0.13/CU.
- Starter price changed from $29 to $19 in Sept 2026 per a pricing tracker. A Jul 2026 third-party guide still shows $29 [V, secondary] — [usagepricing.com](https://www.usagepricing.com/blueprint/activity/apify-2026-10-15-creator-plan-spend-cap-cut), [scrapegraphai](https://scrapegraphai.com/blog/apify-pricing). The live pricing page shows $19.
- **Creator plan**: $1/month with a one-time $500 of platform usage for the first 6 months, limited to universal Actors in the Store [V] — [pricing](https://apify.com/pricing)
  - A tracker reports that its spend cap was cut from $100 to $85/month on ~15 Oct 2026 and that it became a one-time subscription [V, secondary] — [usagepricing.com](https://www.usagepricing.com/blueprint/activity/apify-2026-10-15-creator-plan-spend-cap-cut)
- **Discounts**: students get 30% off Starter and Scale; startups 30% off Scale; nonprofits and universities on request [V] — [pricing](https://apify.com/pricing)
- On the Free plan, usage is **blocked until next cycle** once exhausted. Unused prepaid usage expires at cycle end [V] — [pricing](https://apify.com/pricing); [AGENTS.md](https://apify.com/AGENTS.md)
- **Concurrent runs (conflict)**: the limits page says Free = 25 concurrent runs; the pricing page says 5 [V] — [limits](https://docs.apify.com/platform/limits) vs [pricing](https://apify.com/pricing). Assume 5.
- **Memory**: Free runs range from 128 MB min to 16,384 MB max, and the combined memory of running jobs is capped at 16 GB [V] — [limits](https://docs.apify.com/platform/limits)
  - Starter allows 32 GB per run and 64 GB combined.
  - Memory per CPU core is 4 GB, so CPU scales with memory.
  - Disk is 2× memory.

### Inferences
- With $5 of credit, a single Playwright crawl at 4 GB for an hour uses 4 CU ($0.80). Residential proxy at $8/GB, or a few big third-party Store Actors on PPE, can drain $5 quickly.
- The best move is to sign up one team member for the Creator plan ($1 for $500), or ask Apify sponsors at CalHacks for coupon credits.
- Set `maxTotalChargeUsd` on every call.

### Gaps
- I found no public hackathon-specific coupon codes. Sponsors usually hand them out on site.
- I did not verify data-retention periods for free-plan storage ([BG]: unnamed storages are kept about 7 days on Free).

## 6. Recent developments 2025–2026 (what Apify is pushing)

### Takeaway
2026 is the "Apify for AI agents" year: Agent Skills, the MCP connectors / MCP server updates, x402 and AGI, Apify AI, the agent-friendly CLI, the stateless MCP migration, Git-repo Actors, new Store categories, PPE standardization, and an AWS Marketplace listing. I found no new funding; the last round was ~$3M in Apr 2024 and the company is otherwise bootstrapped and profitable.

### Cited Findings (chronological; dates from blog listings)
- **Jun 2025**: MCP server launched [V, secondary mention] — [Apify AI blog](https://blog.apify.com/introducing-apify-ai/)
- **Nov 2025 – Jan 2026**: $1M Challenge — [apify.com/challenge](https://apify.com/challenge)
- **Jan 26 2026**: AWS Marketplace listing [V, search snippet] — [blog updates tag](https://blog.apify.com/tag/apify-updates/)
- **Feb 2 2026**: "dynamic Actor memory" introduced [V, search snippet only; details not found]
- **Mar 26 2026**: Apify Agent Skills [V, snippet] — [docs.apify.com/agents/skills](https://docs.apify.com/agents/skills)
- **Mar 31 2026**: rental freeze; **Sep 30 2026**: rental end, moving to PPE — [blog](https://blog.apify.com/migrating-to-pay-per-event-pricing/)
- **Jun 9 2026**: MCP connectors — [blog](https://blog.apify.com/announcing-mcp-connectors/)
- **Jun 30 2026**: x402 support with Coinbase. Note: the blog tag page listed it as Jul 7; the post itself says Jun 30 — [blog](https://blog.apify.com/introducing-x402-agentic-payments/)
- **Jul 17 2026**: CLI 1.7/1.8 for AI agents — [blog](https://blog.apify.com/apify-cli-for-ai-agents/)
- **Jul 21 2026**: Apify AI (beta) — [blog](https://blog.apify.com/introducing-apify-ai/)
- **Jul 21 2026**: "Wishlist Raffle: an event demo that runs entirely on Apify". This post is a good template for "build a full app on Apify" [V, title] — [blog tag](https://blog.apify.com/tag/apify-updates/)
- **Aug 2026**: MCP server migrated to the stateless spec — [blog tag](https://blog.apify.com/tag/apify-updates/)
- **Sep 3 2026**: create Actor from Git repo — [blog tag](https://blog.apify.com/tag/apify-updates/)
- **Sep 2026**: a new MCP server version with 40 data tools, per a secondary snippet (unverified)
- **Oct 7 2026**: new Store categories — [blog tag](https://blog.apify.com/tag/apify-updates/)
- **~Oct 15 2026**: Creator plan cap change [secondary] — [usagepricing.com](https://www.usagepricing.com/blueprint/activity/apify-2026-10-15-creator-plan-spend-cap-cut)
- **Funding**: ~$3M in Apr 2024 from J&T Ventures and Reflex Capital. The company is otherwise self-funded; it reported 2023 revenue of $7.5M and profit of $1M [V, secondary] — [vestbee](https://vestbee.com/blog/articles/czech-apify-secures-around-3-m). No 2025–26 round found.

### Inferences
- The surest signals of what judges want to see are agents as first-class customers: MCP, x402/AGI, Skills, and an agent-friendly CLI. Also PPE monetization and Standby APIs.
- A project where an AI agent autonomously discovers, pays for and composes Apify Actors, or a new PPE + Standby + MCP Actor that agents consume, matches Apify's 2026 roadmap closely.

### Gaps
- I could not resolve the "dynamic Actor memory" details or the Sept 2026 "40 tools" MCP release from primary sources.
- I didn't check Apify's YouTube or Discord directly.

## 7. Known pitfalls / gotchas

### Takeaway
The main risks within 36 hours are:
- free-credit exhaustion (proxies, browser memory, third-party PPE Actors)
- anti-bot blocks on big sites (use existing Store Actors rather than writing your own)
- `call-actor` and sync-API timeouts (45 s in MCP, 300 s for the REST sync endpoint)
- Standby readiness-probe and statelessness requirements
- builds of up to 30 minutes

### Cited Findings
- Sync timeouts [V] — [AGENTS.md](https://apify.com/AGENTS.md)
  - `run-sync-get-dataset-items` is limited to 300 s. For long jobs, use the async run → poll → dataset flow.
  - MCP `call-actor` waits at most 45 s, then you poll `get-actor-run`.
- Standby gotchas [V] — [Standby docs](https://docs.apify.com/platform/actors/development/programming-interface/standby)
  - You must answer the readiness probe, or the run is never marked ready.
  - The first response must arrive within 5 minutes, and run selection times out after 2 minutes internally.
  - Runs can end on migration or idle, so persist state to storage, not memory.
  - Apart from the probe there are no health checks, so exit on unrecoverable errors.
- On the Free plan, Apify Proxy can't be used from outside the platform, and residential proxy costs $8/GB [V] — [pricing](https://apify.com/pricing)
- Full-permission Actors are excluded from MCP search/execution and from Apify AI. Rental Actors are excluded from Apify AI [V] — [docs MCP](https://docs.apify.com/platform/integrations/mcp), [Apify AI blog](https://blog.apify.com/introducing-apify-ai/)
- x402 risks [V] — [x402 blog](https://blog.apify.com/introducing-x402-agentic-payments/)
  - The agent wallet is a hot wallet: "a compromised or hallucinating agent could drain it", so hold only small amounts.
  - With `exact`, refunds arrive only after 60 minutes idle.
  - USDC on Base only.
- Errors 401, 402 and 403 mean auth, payment or permission problems. Store search with `sortBy=popularity` overrides relevance [V] — [AGENTS.md](https://apify.com/AGENTS.md)
- User reviews say "finding reliable actors is tricky due to sparse or mixed reviews", which means trial and error [V, secondary review aggregator] — [G2 discussion](https://www.g2.com/products/apify/discuss)
- Build limits are 4 GB memory and 1,800 s. The max log size is 10M chars [V] — [limits](https://docs.apify.com/platform/limits)

### Inferences
- Prototype against Store Actors via `apify-client` or MCP first. Build your own Actor only for the novel piece, and deploy it early, since a first build can be slow.
- Use Cheerio/BeautifulSoup crawlers (cheap, about 256–1024 MB) instead of Playwright wherever possible to stretch the free credits.

### Gaps
- I did not find documented default and maximum run timeouts or Standby concurrency limits in this session.

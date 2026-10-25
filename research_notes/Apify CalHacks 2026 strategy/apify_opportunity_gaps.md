# Apify Ecosystem Market Gaps & Opportunity Areas (as of Oct 2026)

Method note: Besides web search and fetch, I queried the public Apify Store API (`https://api.apify.com/v2/store?search=<q>&sortBy=popularity`) on 2026-10-24 for about 100 topic keywords. I recorded the top results with `totalUsers` and `totalUsers30Days` (monthly active users, "MAU"). The API's `total` field is a fuzzy full-text match count that is inflated by unrelated Actors (for example, "court" returns 16,482 results led by Instagram scrapers). So I use the **top-result user counts** as the coverage and demand signal, not `total`. Store-API numbers below cite the query URL pattern `https://api.apify.com/v2/store?search=...`.

## 1. Which data sources are under-covered or poorly covered on the Apify Store?

### Takeaway
With about 97K Actors, almost every named public-data source already has *some* Actor. Coverage is still shallow: most civic, health and government Actors have 1 to 20 total users, cover a single platform or city, and are unproven. The gap isn't that "no Actor exists". It's that no Actor works reliably across a fragmented long tail, normalizes the results, and turns them into something you can act on. The clearest open gaps are BoardDocs, non-Legistar municipal agenda platforms, power outages, school boards, hospital-MRF *discovery*, and cross-jurisdiction permits and licensing.

### Cited Findings
- The Store held **96,993 Actors** on 2026-10-24 (Store API `limit=1` total) — [Apify Store API](https://api.apify.com/v2/store?limit=1). The Store's own banner showed "Browse 97,963 Actors" — [Apify Store AI Agents category](https://apify.com/store/categories/agents). The challenge page cited 95,033 — [Apify $1M Challenge](https://apify.com/challenge).
- **Municipal agendas:** Legistar is covered by several tiny Actors. `talcoe/legistar-agendas` reads webapi.legistar.com and charges from $5/1K results. `quarterly_jingo/municipal-ordinance-scraper`, `m_ctim/city-council-watch` ("Under maintenance") and `tristana/zoning-planning-tracker` each have about 1 to 2 users — [talcoe/legistar-agendas](https://apify.com/talcoe/legistar-agendas), [city-council-watch](https://apify.com/m_ctim/city-council-watch), [zoning-planning-tracker](https://apify.com/tristana/zoning-planning-tracker). A "city council agenda" Store search tops out at `jungle_synthesizer/municipal-council-minutes-agenda-scraper` with **16 users and 0 MAU**. Granicus has 6 matches, the best with 16 users. **BoardDocs: 0 results** — [Store API](https://api.apify.com/v2/store?search=boardDocs).
- The open-source `civic-scraper` Python library already supports Civic Clerk, CivicPlus, Granicus, Legistar and PrimeGov, but not BoardDocs. It is not an Apify Actor, so it could be wrapped as one — [civic-scraper docs](https://civic-scraper.readthedocs.io/en/latest/usage.html).
- **School boards:** the top "school board" results are unrelated (a Florida Bar scraper, teacher jobs) plus `hgservices/granicus-meetings-scraper` with 1 user. Many US school boards use BoardDocs, so this is effectively uncovered — [Store API](https://api.apify.com/v2/store?search=school%20board).
- **Power outages:** 3 total results. The only real one covers the Netherlands (`codeclouds/nl-netstoringen-monitor`, 2 users). There is no US utility outage map aggregator — [Store API](https://api.apify.com/v2/store?search=power%20outage).
- **Hospital price transparency:** about 15 results, all tiny. Examples are `maximedupre/hospital-price-transparency-scraper` (2 users), `quanmatrix/...drift-intelligence` (2) and `businessquik/hospital-mrf-normalizer` (2) — [Store API](https://api.apify.com/v2/store?search=hospital%20price). Search results also showed `automation-lab/...` (2 total users, 1 MAU), `samwise.agency/hospital-price-transparency` (from $10/1K) and `george.the.developer/hospital-mrf-normalizer`. The maximedupre FAQ states that it "does not claim universal MRF URL discovery" — [maximedupre](https://apify.com/maximedupre/hospital-price-transparency-scraper), [automation-lab](https://apify.com/automation-lab/hospital-price-transparency-scraper), [samwise.agency](https://apify.com/samwise.agency/hospital-price-transparency).
- **Building permits:** led by `pink_comic/building-permits-construction-leads` (144 users, 18 MAU), `intelscrape/building-permit-scraper` (112 users, 2 MAU) and `handstands.io/us-building-permit-scraper` (41 users, 10 MAU) — [Store API](https://api.apify.com/v2/store?search=building%20permits). A search for "accela", the dominant permitting SaaS, returns no Accela-specific Actor in the top results — [Store API](https://api.apify.com/v2/store?search=accela).
- **Procurement / RFPs:** SAM.gov is reasonably covered (`jungle_synthesizer/samgov-scraper` 175 users, `fortuitous_pirate/sam-gov-scraper` 130 users and 23 MAU). Generic tenders: `lofomachines/public-tenders-scraper` (81 users). Government contract monitor: `omarchydev/government-contract-monitor` (34 users). State, county and city bid portals (BidNet, Bonfire, OpenGov, Periscope) don't show up — [Store API](https://api.apify.com/v2/store?search=rfp).
- **Grants:** `fiery_dream/scholarship-intel` (41 users), `signalcrawl/federal-grant-fit-finder` (7) and `hridayrungta/grants-gov-scraper` (5). NIH: `publicmoney/nih-reporter-grants-scraper` (6) and `constant_quadruped/research-grant-aggregator` (13) — [Store API](https://api.apify.com/v2/store?search=grants.gov), [Store API](https://api.apify.com/v2/store?search=research%20grants%20nih).
- **Clinical trials / FDA:** many API-wrapper Actors, all with low use. `parseforge/clinicaltrials-scraper` has 48 users. The openFDA wrappers have 1 to 4 users each — [Store API](https://api.apify.com/v2/store?search=clinical%20trials), [Store API](https://api.apify.com/v2/store?search=openFDA). One listing, `nexgendata/clinical-trials-tracker`, charges $100 per 1,000 records — [search result](https://apify.com/nexgendata/clinical-trials-tracker/issues/open).
- **Courts:** several CourtListener and RECAP wrappers exist (`scrapemint/court-records-scraper`, `maydit/us-court-cases-scraper`, `glitchbound/courts-scraper`, `nexgendata/court-records-search`). County-level probate is covered by `parseforge/harris-county-court-records-scraper` (29 users) and `jungle_synthesizer/probate-foreclosure-leads-scraper` (131) — [scrapemint](https://apify.com/scrapemint/court-records-scraper/api), [Store API](https://api.apify.com/v2/store?search=probate).
- **SEC EDGAR:** `constant_quadruped/sec-edgar-filings-scraper` (112 users, 19 MAU), `constructive_calm/sec-edgar-scraper` (62) and `johnvc/earnings-call-transcript-api` (30 users, 16 MAU) — [Store API](https://api.apify.com/v2/store?search=sec%20edgar).
- **Legislatures, civic finance and regulators:** state-legislature Actors have about 2 users each (`nabeelbaghoor/state-legislature-bills-legislators-api`, `talcoe/openstates-legislators`). FEC campaign finance Actors have 1 to 2 users each. Lobbying: `jungle_synthesizer/eu-transparency-register-scraper` (3). Federal Register monitors: 2 users each. Nonprofit 990s: `ryanclinton/nonprofit-explorer` (36). CPSC/NHTSA recall trackers: 1 to 12 users. EPA TRI and air quality: 1 to 3 users — [Store API](https://api.apify.com/v2/store?search=state%20legislature), [Store API](https://api.apify.com/v2/store?search=campaign%20finance), [Store API](https://api.apify.com/v2/store?search=product%20recall%20cpsc), [Store API](https://api.apify.com/v2/store?search=epa).
- **Food inspections:** 1 to 2 users each (Chicago, CA, US) — [Store API](https://api.apify.com/v2/store?search=food%20inspection).
- **Academia:** PubMed has `easyapi/pubmed-search-scraper` (105 users, 10 MAU). arXiv has `easyapi/arxiv-search-scraper` (53 users, 2 MAU). Conference CFP monitors have 1 to 3 users (`trovevault/academic-conference-cfp-monitor`, `datapilot/wikicfp-...`) — [Store API](https://api.apify.com/v2/store?search=pubmed), [Store API](https://api.apify.com/v2/store?search=conference%20cfp).
- **Healthcare and drug prices:** GoodRx scrapers have 5 to 16 users, `parseforge/pharmacychecker-scraper` has 2, and SERFF insurance filings (`fortuitous_pirate/serff-insurance-scraper`) have 18 — [Store API](https://api.apify.com/v2/store?search=drug%20price), [Store API](https://api.apify.com/v2/store?search=insurance%20rates).
- **Policy and compliance text:** privacy-policy auditors and ToS watchdogs have 2 to 4 users each (`chrisfang100/privacy-policy-gdpr-compliance-auditor`, `woundless_vehicle/tos-watchdog`) — [Store API](https://api.apify.com/v2/store?search=privacy%20policy), [Store API](https://api.apify.com/v2/store?search=terms%20of%20service).
- **Accessibility:** `katzino/actor-web-a11y-audit` has 85 users and 2 MAU. Lighthouse checkers have 7 to 219 users — [Store API](https://api.apify.com/v2/store?search=wcag), [Store API](https://api.apify.com/v2/store?search=lighthouse).
- **Why government portals are hard (as of Oct 9, 2026):** cloud and datacenter IPs get empty responses, and some proxy vendors refuse .gov targets. SAM.gov API keys take about 10 business days to approve, and there are undocumented 429 limits at roughly 20 req/min. ASP.NET ViewState tokens break naive POSTs. Licensing boards use JS and CAPTCHAs. PACER charges per page. Each of the 50 states runs its own registry, and status labels aren't normalized ("Active" vs "In Existence"). Permit and property records are spread across thousands of systems — [Scrapfly: scraping government public records](https://scrapfly.io/blog/posts/scraping-government-public-records-data).

### Inferences
- The Store is "covered but dead" in civic, health and government data. There are dozens of single-source Actors with fewer than 5 users and often 0 MAU. A hackathon project won't stand out by adding one more single-site scraper. It can stand out with a **multi-platform or multi-jurisdiction normalizer plus an AI layer** (for example "every agenda platform, one schema, plus an LLM relevance filter") that is clearly better than the long tail.
- The hard engineering problems Scrapfly lists (ViewState, fragmentation, schema normalization) are where LLM-based extraction adds real value. An LLM can generalize across thousands of slightly different county portals where hand-written per-site parsers break.
- Low Store usage for civic data probably reflects low commercial demand rather than low social value. That matters for long-term Store revenue, but much less for hackathon judging, which rewards impact and demo quality.

### Gaps
- I couldn't load the actual idea list on apify.com/ideas. The page is JS-rendered, and both WebFetch and `/ideas.md` returned no ideas or a 404. Upvote counts for specific requested ideas are therefore **not available**.
- I didn't find specific r/webscraping or Apify Discord request threads. Searches returned vendor blogs instead. I have no reliable Reddit or Discord demand evidence.
- I didn't check Accela, BidNet, Bonfire, OpenGov or Periscope coverage individually beyond the broad searches above.

## 2. Which Store Actors are most used, and where is it saturated vs open?

### Takeaway
Usage is extremely concentrated in Google Maps, Instagram, TikTok, Google SERP, LinkedIn and "web content for LLMs" (RAG Web Browser, Website Content Crawler). Social and lead-gen are saturated, with dominant maintainers like compass, clockworks and apify. Smaller categories such as Travel and SEO have better users-per-Actor ratios. Anything civic, scientific or public-interest is wide open in terms of quality and usage.

### Cited Findings
- Top Actors by users (Store API snapshot 2026-09-09): Google Maps Scraper 596,324; Instagram Scraper 388,434; TikTok Scraper 275,028; Instagram Profile Scraper 213,560; Google Search Results Scraper 178,811; **RAG Web Browser 169,454**; **Website Content Crawler 155,190**; LinkedIn Jobs Scraper 152,310; Instagram Reel 141,834; Instagram Post 126,230; Web Scraper 124,374; YouTube Scraper 113,608. Social platforms take 11 of the top 25 and Google Maps 4. The compass, clockworks and streamers maintainers "consistently out-rank apify-official Actors" — [use-apify.com most popular Actors](https://use-apify.com/docs/best-apify-actors/most-popular-actors).
- Live figures on 2026-10-24: `compass/crawler-google-places` had 664,829 users and 44,951 MAU. `apify/rag-web-browser` had 201,448 users and **33,486 MAU**. `apify/website-content-crawler` had 171,623 users and 13,671 MAU — [Store API](https://api.apify.com/v2/store?category=AI&sortBy=popularity).
- Low ratings track platform churn: Instagram Hashtag Scraper 3.39★, Mass LinkedIn Profile Scraper 3.61★, Tweet Scraper V2 3.90★, Amazon Product Scraper 3.88★. "Commerce Actors trail social and maps in raw users" — [use-apify.com](https://use-apify.com/docs/best-apify-actors/most-popular-actors).
- Category users-per-Actor "Opportunity Score" from an independent digest dated May 10, 2026 (about 10K Actors analyzed): Social Media 1,090 (1.97M users / 1,811 Actors); Travel 730 (154,708 / 212); SEO Tools 686 (209,275 / 305); Lead Gen 685 (1.14M / 1,666); Videos 673; AI/MCP 512 (279,578 / 546); Developer Tools 417; Jobs 292 (178,825 / 613). 92.1% of Actors are paid — [The Scraping Report, Week 19 2026](https://liaichi.substack.com/p/the-scraping-report-761). This is a third-party Substack, so treat it as directional.
- Saturated verticals confirmed by live search: jobs (Indeed scrapers with 28K to 36K users; `fantastic-jobs/career-site-job-listing-api` with 8,826 users covers Greenhouse, Ashby and Workday), Zillow (`maxcopell/zillow-detail-scraper` 9,821 users), Facebook Marketplace (`apify/facebook-marketplace-scraper` 11,701), app store reviews (2.8K to 2.9K users), Reddit (`fatihtahta/reddit-scraper-search-fast` 66,654) — [Store API](https://api.apify.com/v2/store?search=job%20board), [Store API](https://api.apify.com/v2/store?search=zillow), [Store API](https://api.apify.com/v2/store?search=facebook%20marketplace).
- "AI visibility" / GEO is an emerging, mid-competition vertical: `apify/chatgpt-search-scraper` (631 users, 303 MAU), `khadinakbar/ai-search-brand-monitor` (271 users), `khadinakbar/llm-visibility-tracker` (123) — [Store API](https://api.apify.com/v2/store?search=chatgpt%20brand).

### Inferences
- Avoid Google Maps, Instagram, TikTok, LinkedIn, Amazon, Zillow, Indeed and general Reddit. They have entrenched incumbents with hundreds of thousands of users, plus platform ToS and legal risk (see the Reddit lawsuits below).
- RAG Web Browser's 33K MAU shows that the biggest *growth* demand is "web data as a tool for LLM agents." A new Actor framed as an agent tool (MCP-ready, PPE-priced, clean JSON) fits where usage is going.

### Gaps
- No official Apify category-level usage stats were found. The category scores come from a third-party digest.

## 3. What AI-agent-era Actor patterns are emerging?

### Takeaway
Apify is now positioned as the "tool layer for AI agents": a hosted MCP server, an Agent Skills plugin for coding agents, and x402/Skyfire agentic payments. Usage, however, goes to **tools that agents call** (RAG Web Browser, AI Web Scraper) rather than **autonomous agent Actors** (Apify's own AI Web Agent has about 6 MAU). Browser-agent wrappers (browser-use, Stagehand) are nearly absent from the Store. That makes a reliable "agent-native" Actor in a high-value vertical, or a polished browser-agent Actor, a real gap.

### Cited Findings
- Apify MCP server (mcp.apify.com) lets AI agents discover and run Store Actors and access storage over Streamable HTTP with OAuth. SSE transport was removed April 1, 2026. For Claude Code, Cursor, Copilot and Codex, Apify recommends its plugin bundling MCP plus Agent Skills. Full-permission and rental Actors are excluded — [Apify MCP docs](https://docs.apify.com/integrations/mcp).
- **x402 agentic payments** (announced around June 30, 2026, experimental): agents pay for Actors in USDC on Base with no Apify account. They receive an HTTP 402 with the price, and a wallet signs the payment. More than 20,000 Actors are reportedly available via x402, up from about 2,000. Only Pay-Per-Event Actors are supported, and Standby Actors are not — [Apify blog: x402](https://blog.apify.com/introducing-x402-agentic-payments/), [Apify x402 docs](https://docs.apify.com/integrations/x402), [StartupHub](https://www.startuphub.ai/news/apify-boosts-ai-agents-with-10x-tools). Skyfire is an earlier agent-payments integration — [Apify blog: Skyfire](https://blog.apify.com/agentic-payments-skyfire/).
- Apify's official idea guidance lists "MCP servers and AI tools" (make local MCP servers remote via Apify) and "AI agents" (LLM-driven Actors for multistep tasks), and points to GitHub projects like browser-use and Katana as wrap candidates — [Apify Academy: find Actor ideas](https://docs.apify.com/academy/build-and-publish/actor-ideas/find-actor-ideas). The Ideas page header asks for "API-fied websites, SaaS API wrappers, MCP servers, and open-source libraries" — [apify.com/ideas](https://apify.com/ideas).
- Store category sizes on 2026-10-24: AGENTS 4,265; MCP_SERVERS 3,067; AI 12,595; OPEN_SOURCE 1,106 — [Store API](https://api.apify.com/v2/store?category=AGENTS). Top "AGENTS" entries are mostly mislabeled scrapers (Google Ads, YouTube transcript, Reddit). Real agents have tiny usage: `apify/ai-web-agent` (1,884 users, **6 MAU**), `daniil.poletaev/backlink-building-agent` (500 users, 3 MAU), `apify/local-lead-generation-agent` (1,602 users, 13 MAU). By contrast, `apify/ai-web-scraper` (natural-language extraction) has 9,997 users and 663 MAU — [Store API](https://api.apify.com/v2/store?category=AGENTS&sortBy=popularity).
- Browser agents: "browser-use" returns 12 results, with the main one `lexis-solutions/browser-use-apify` at 393 users and 4 MAU. "stagehand" returns 1 Actor, `dtrungtin/stagehand-crawler`, with 2 users — [Store API](https://api.apify.com/v2/store?search=browser-use), [Store API](https://api.apify.com/v2/store?search=stagehand). Crawlee for Python has a `StagehandOptions` class, so the framework is reachable from Apify's SDK — [Crawlee docs](https://crawlee.dev/python/api/class/StagehandOptions). Browser-Use has about 78K GitHub stars vs about 21K for Stagehand (per a third-party comparison) — [Scrapfly blog](https://scrapfly.io/blog/posts/how-to-create-an-ai-browser-agent-for-free).
- Website monitoring and diffing is already crowded: `ichigowa/website-change-detector` (optional AI summary), `umischael/smart-monitor` ($19/mo rental), `second_coming/website-change-monitor` ($0.01/check), `muhammad-bilal/web-drift-detector` (LLM severity), and `shawn_madadha/materiality-watch`, which uses Claude to filter diffs against plain-English criteria — [ichigowa](https://apify.com/ichigowa/website-change-detector), [materiality-watch](https://apify.com/shawn_madadha/materiality-watch), [web-drift-detector](https://apify.com/muhammad-bilal/web-drift-detector).
- Web-to-knowledge pipelines: `cspnair/rag-knowledge-graph-builder` has 132 users and 1 MAU. Synthetic data generators have 4 to 103 users. "Agent benchmark" returns only unrelated real-estate-agent scrapers, so there are no agent evaluation or test-environment Actors — [Store API](https://api.apify.com/v2/store?search=knowledge%20graph), [Store API](https://api.apify.com/v2/store?search=agent%20benchmark).
- $1M Challenge (Nov 2025 to Jan 2026) weekly winners included AI-plus-scraping hybrids (Google Maps AI Reviews Analyzer, AI Model Comparison, FlowExtract AI Scraper) and a social-good FEC campaign finance scraper. The grand-prize jury weighed "monthly active users, Actor quality, technical excellence, and real-world usefulness" — [Apify $1M Challenge](https://apify.com/challenge). Search results summarizing the page reported 704 developers, 3,329 Actors published and 1,086 qualifying — [search summary of apify.com/challenge](https://apify.com/challenge). I couldn't re-verify these counts on my fetch of the page.

### Inferences
- Pure "LLM inside an Actor does anything" agents don't get repeat usage (6 MAU), probably because they're unreliable and generic. The winning pattern is a **narrow, reliable, agent-callable tool** with a clear schema and PPE pricing, which also makes it x402-payable and MCP-discoverable for free.
- Change monitoring alone isn't novel anymore. It needs a domain (for example "civic agenda change → relevance-scored alert") to be differentiated.
- Agent evaluation and environments is a white space on the Store, for example an Actor that snapshots real sites into replayable test fixtures, or that scores browser agents on tasks. It's a riskier hackathon pitch because it's harder to demo to non-technical judges.

### Gaps
- No official Apify data on MCP-originated runs or x402 transaction volume.
- I didn't verify whether Apify has an official Stagehand or Browser Use template Actor in its templates gallery, as opposed to Store Actors.

## 4. High-impact real-world problems that hinge on hard-to-get web data

### Takeaway
The strongest impact-plus-data-difficulty combinations are: (a) local government decisions (agendas, zoning, school boards) hidden across 5+ SaaS platforms, (b) healthcare price transparency files that are legally mandated but hard to find and parse, (c) emergency and public-safety signals (utility outages, recalls, alerts) with no unified feed, (d) funding discovery (grants, RFPs, scholarships) fragmented across federal, state and foundation sites, and (e) compliance and accessibility auditing. All of these have weak Store coverage.

### Cited Findings
- Government data is fragmented across 50 states and thousands of county and city systems, with no normalization and active blocking of cloud IPs — [Scrapfly](https://scrapfly.io/blog/posts/scraping-government-public-records-data).
- Hospital MRFs are CMS-mandated, but existing Actors need a user-supplied URL or offer only partial discovery ("does not claim universal MRF URL discovery") — [maximedupre](https://apify.com/maximedupre/hospital-price-transparency-scraper), [george.the.developer/hospital-mrf-normalizer](https://apify.com/george.the.developer/hospital-mrf-normalizer).
- Local agenda platforms: civic-scraper supports 5 platforms (Civic Clerk, CivicPlus, Granicus, Legistar, PrimeGov), and BoardDocs isn't among them — [civic-scraper](https://civic-scraper.readthedocs.io/en/latest/usage.html). Store Actors are almost all Legistar-only — [Store API](https://api.apify.com/v2/store?search=city%20council%20agenda).
- Social-good civic data is recognized by Apify judges. The FEC Campaign Finance scraper won a weekly "Social Good" spotlight — [Apify $1M Challenge](https://apify.com/challenge).
- Reddit is legally risky as a data source. It sued Anthropic (2025) and Perplexity/Oxylabs over scraping, and its API now has approval-first terms — [Olostep](https://www.olostep.com/blog/how-to-scrape-reddit-data), [Proxyway](https://proxyway.com/news/reddit-sues-perplexity-oxylabs-two-more-web-data-providers).

### Inferences
- For a Berkeley/Bay Area hackathon, local civic data (Berkeley, Oakland, SF and BART agendas, Berkeley Unified board meetings, PG&E outage maps) gives a demo that is visceral and local.
- Projects using public government data avoid most ToS and legal objections that judges may raise about social-media scraping.

### Gaps
- I didn't fetch which platforms specific Bay Area cities use (for example whether Berkeley uses Legistar or Granicus, or whether BUSD uses BoardDocs). This needs a quick check before committing.
- I didn't verify PG&E outage map data accessibility or the current CMS MRF compliance rate.

## 5. Ranked opportunity list (who uses it, why existing tools fall short, 36-hour feasibility, demo-ability)

### Takeaway
Top picks: (1) **CivicSignal**, a multi-platform local-government agenda Actor with LLM relevance alerts; (2) **Hospital price-transparency finder plus comparator** with automated MRF discovery; (3) a **Funding/RFP radar** that unifies grants and bids with eligibility matching; (4) an **outage and public-safety alert aggregator**; (5) a **reliable browser-agent Actor for gov portals and forms** (browser-use/Stagehand). Each should be built as an MCP-ready, Pay-Per-Event Actor so it's automatically x402-payable.

### Cited Findings (evidence per opportunity; all Store numbers from the Store API on 2026-10-24)

**#1 CivicSignal: universal municipal and school-board agenda monitor plus AI relevance filter**
- Users: residents, journalists, advocacy groups, lobbyists, real-estate developers, PTAs.
- Why existing tools fall short: Store Actors are Legistar-only with 1 to 16 users, and some are "Under maintenance." Granicus has a single 1-user Actor. BoardDocs and school boards have effectively nothing — [Store API](https://api.apify.com/v2/store?search=boardDocs), [Store API](https://api.apify.com/v2/store?search=school%20board), [city-council-watch](https://apify.com/m_ctim/city-council-watch).
- Feasibility: high. Wrap the open-source `civic-scraper` (5 platforms) as an Actor, add BoardDocs, then use an LLM to parse agenda PDFs and score items against a user's plain-English interests (the Materiality Watch pattern applied to civic data) — [civic-scraper](https://civic-scraper.readthedocs.io/en/latest/usage.html), [materiality-watch](https://apify.com/shawn_madadha/materiality-watch).
- Demo: "Tell me when Berkeley or Oakland votes on anything about bike lanes or housing near campus" produces a live alert and a citation to the PDF page.

**#2 Hospital price transparency: discovery, normalization and comparison**
- Users: patients, journalists, employers and benefits brokers, researchers.
- Why existing tools fall short: about 5 Actors, each with about 2 users. They need a direct MRF URL or offer only partial discovery — [maximedupre](https://apify.com/maximedupre/hospital-price-transparency-scraper), [Store API](https://api.apify.com/v2/store?search=hospital%20price).
- Feasibility: medium. MRFs can be multi-GB, so limit the demo to about 5 Bay Area hospitals and about 20 shoppable CPT codes. An LLM or browser agent finds the "price transparency" link on each hospital site (cms-hpt.txt), then streams and parses the file.
- Demo: "MRI of the knee, cash price, near Berkeley" shows a price spread across hospitals (often 5 to 10x).

**#3 Funding radar: grants, RFPs and scholarships with eligibility matching**
- Users: nonprofits, startups (SBIR), researchers, students.
- Why existing tools fall short: SAM.gov is covered (130 to 175 users), but grants Actors have 1 to 41 users, NIH 6 to 13, scholarships 41 to 76. State and local bid portals are absent. Nothing matches opportunities to an applicant profile — [Store API](https://api.apify.com/v2/store?search=grants.gov), [Store API](https://api.apify.com/v2/store?search=scholarship). SAM.gov API keys take about 10 business days, so a hackathon should use the public Grants.gov search instead or the existing SAM.gov Actor via the Apify API — [Scrapfly](https://scrapfly.io/blog/posts/scraping-government-public-records-data).
- Feasibility: high. Compose existing Actors (call SAM.gov and grants Actors), add a few new state-portal scrapers, and use LLM eligibility scoring.
- Demo: paste a nonprofit's mission statement and get a ranked list of open grants with deadlines and fit reasons.

**#4 Outage, recall and public-safety alert aggregator**
- Users: residents, emergency managers, people dependent on medical devices, insurers.
- Why existing tools fall short: only a Dutch outage monitor exists. CPSC/NHTSA recall Actors have 1 to 12 users, and nothing unifies them — [Store API](https://api.apify.com/v2/store?search=power%20outage), [Store API](https://api.apify.com/v2/store?search=nhtsa).
- Feasibility: medium. Utility outage maps are JS-heavy and vary by utility.
- Demo: a map of live outages plus recalls matched to a user's products or vehicle.

**#5 Reliable browser-agent Actor for public portals (browser-use/Stagehand on Apify)**
- Users: developers and agent builders that need "fill this gov search form and extract results" as a tool.
- Why existing tools fall short: browser-use has one Actor with 4 MAU, Stagehand one Actor with 2 users, and Apify's AI Web Agent 6 MAU. ASP.NET and ViewState portals defeat simple scrapers — [Store API](https://api.apify.com/v2/store?search=browser-use), [Store API](https://api.apify.com/v2/store?category=AGENTS&sortBy=popularity), [Scrapfly](https://scrapfly.io/blog/posts/scraping-government-public-records-data).
- Feasibility: medium. Generic agents are unreliable, so the pitch should be narrow ("contractor license lookup across N states" or "county permit search") and include cached action plans.
- Demo: the agent visibly navigates a county permit portal live.

**Honorable mentions (weaker gaps or more crowded)**
- Policy and ToS diff watchdog with AI materiality: crowded with generic change monitors, but privacy/ToS-specific Actors have only 2 to 4 users — [Store API](https://api.apify.com/v2/store?search=terms%20of%20service).
- Accessibility (WCAG) auditor with AI fix suggestions: `katzino/actor-web-a11y-audit` has 85 users and 2 MAU — [Store API](https://api.apify.com/v2/store?search=wcag).
- Academic/CFP and research monitor: arXiv and PubMed have low-MAU Actors, and CFP monitors have 1 to 3 users — [Store API](https://api.apify.com/v2/store?search=conference%20cfp).
- Agent eval and test-fixture Actor (snapshot real sites as replayable environments): no Store presence — [Store API](https://api.apify.com/v2/store?search=agent%20benchmark).
- AI-search brand visibility (GEO): real demand (`apify/chatgpt-search-scraper` has 303 MAU), but already contested — [Store API](https://api.apify.com/v2/store?search=chatgpt%20brand).

### Inferences
- Ranking logic: (1) wins on low competition, a clear open-source base, a local Berkeley demo and strong civic impact. (2) has the highest "wow" (price spreads) but the most data-size risk. (3) is the most commercially viable, with a paying nonprofit and startup audience. (4) and (5) have higher engineering risk.
- Building the project as a *composite* (new Actor plus calls to existing Store Actors, exposed via MCP so Claude or another agent can use it) shows deep Apify platform use, which judges at an Apify-sponsored track would likely value.
- PPE pricing is needed to qualify for x402 agent payments, which is a cheap "agent economy" talking point — [Apify x402 docs](https://docs.apify.com/integrations/x402).

### Gaps
- No Apify Ideas board upvote data (the page didn't render) and no Reddit or Discord demand threads were found. Demand evidence is inferred from Store usage, not from explicit requests.
- I found no confirmation of an Apify prize track at Cal Hacks 2026 or its judging criteria. The only Cal Hacks pages found were 11.0 and 12.0 (2025) Fetch.ai pages — [Fetch.ai Cal Hacks 12.0](https://innovationlab.fetch.ai/events/cal-hacks-12-0).
- Feasibility estimates are my engineering judgment, not sourced.

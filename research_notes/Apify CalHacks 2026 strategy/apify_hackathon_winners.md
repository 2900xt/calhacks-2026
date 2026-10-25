# Apify Sponsor Prizes at Hackathons and the Cal Hacks 13.0 (2026) Context

Research date: 2026-10-24. Cal Hacks 13.0 is running right now. The Devpost submission deadline is **Oct 25, 2026 @ 9:00am PDT**. Method: Devpost pages fetched directly (Devpost hackathon search API `?search=apify`, and the project search `software/search?query=apify`: 416 projects, 47 marked "winner"; each winner's page was checked to see which prize it actually won), plus Apify docs, blog and challenge pages, and the Fetch.ai, MLH and calhacks.io pages.

## Q1. Past hackathons with Apify prizes: who won, and how did they use Apify?

### Takeaway
Before Cal Hacks 13.0, Apify's "Best use of Apify" prizes appeared mostly at one-day, agent-themed SF and online hackathons in 2025–2026 (AI Agents Hackathon at GTC, AWS MCP Agents, MCP and A2A, MCP - AI Agents, Future of Agents, Burning Heroes x EF), plus GenAI Zürich 2026. Verified winners were almost always **AI agent or voice-agent products in which Apify supplies live, structured web data that the agent acts on**, usually stacked with a second sponsor prize (Vapi, Tavus, MiniMax, Operant). Most winners called pre-built Store Actors, some through the Apify MCP server, rather than writing custom Actors. Only one winner (Furnicular) says it published its own Actor. Cal Hacks 11.0 and 12.0 had no Apify prize.

### Cited Findings

**Confirmed "Best use of Apify" winners (Devpost "Winner" badge naming the Apify prize):**
- **Furnicular** (AI Agents Hackathon at GTC, ~Mar 22, 2025). Won Best Use of Apify and Best Use of Tavus. Scraped company docs with "render + apify", turned them into usable content with Gemini, and fed that into Tavus video agents, with Stytch identifying the user's role. Listed as an accomplishment: "Published Agent on APIfy: cjmckenz/furnicular". This is the only winner found that built and published its own Actor. — [Devpost](https://devpost.com/software/furnicular); [hackathon](https://ai-agents-hackathon-gtc.devpost.com/)
- **ReveredInsan / "Harmony"** (same GTC AI Agents Hackathon). Won Best Use of Apify. Record a Loom of a workflow and the AI rebuilds it as an automation for any web app. Built with apify, Gemini, Stytch, Tavus and Windsurf. The writeup doesn't explain how it uses Apify. — [Devpost](https://devpost.com/software/reveredinsan)
- **Iris: Voice-Based Research Assistant** (MCP and A2A Hackathon – AWS Edition, ~May 2, 2025). Won Best use of Apify and Best use of Vapi. You phone it with a headline, Apify crawls and researches diverse viewpoints, an LLM summarizes them, and Vapi calls you back. Built with Vapi, Apify and MCP. — [Devpost](https://devpost.com/software/iris-voice-based-research-assistant)
- **ComplianceThunder** (AWS MCP Agents Hackathon, ~May 30, 2025; solo builder). Won Best Use of Apify and Best Use of Operant AI. An agent crawls a company's website to infer which compliance frameworks apply, finds gaps in uploaded policies, and generates the missing ones. Built with Apify, Anthropic, AWS Bedrock and Operant. — [Devpost](https://devpost.com/software/compliancethunder)
- **SalesHQ** (AWS MCP Agents Hackathon, ~May 30, 2025). Won Best Use of Apify. Multi-agent sales team (Prospector, Researcher, SDR and Scheduler bots) built on AgentKit, with Google A2A between agents and Slack-style threads for human approval. The ResearcherBot pulls fresh facts with the Apify Website Crawler. The team wrote "Apify MCP saves brain cycles". — [Devpost](https://devpost.com/software/saleshq)
- **Manta** (MCP - AI Agents Hackathon, Sep 19, 2025). Won Best use of Apify. An AI canvas for video generation, built with apify, minimax and typescript. The writeup is minimal. — [Devpost](https://devpost.com/software/manta-vah6jf)
- **Travabelle** (MCP - AI Agents Hackathon, Sep 19, 2025). Won Best use of Apify and Best Use of MiniMax Agents. Personalized self-guided city walking tours. Apify gathers up-to-date city data, Anthropic and MiniMax personalize the tours, and it was built with Lovable and Supabase. — [Devpost](https://devpost.com/software/travabelle)
- **Wanderful** (MCP - AI Agents Hackathon, Sep 19, 2025). Won Best use of Apify. AI travel planner on Mastra, Next.js and AG-UI. Apify is "integrated with Kayak and Expedia" to fetch real flights, hotels and activities, Bright Data adds enrichment, and HoneyHive handles evals. Bright Data and Apify appear in the same winning project. — [Devpost](https://devpost.com/software/wanderful-impvfd)
- **Iris (voice shopping)** (The Future of Agents Hackathon, ~Oct 17, 2025). Won Best use of Apify. Voice e-commerce assistant: the user says "find budget wireless earphones", Apify scrapes structured Amazon product data (title, price, rating, link, description), Snowflake stores conversations and results, and Stack AI orchestrates. — [Devpost](https://devpost.com/software/iris-7bgi2o)
- **SOAK** (The DEIJ Hackathon, ~Nov 15, 2025). Won "Premium Apify Credits - Best Use of Apify" and a $100 Diversity track prize. An AI community OS for accelerator cohorts, built with Toolhouse, Lovable, Perplexity and Apify. A small prize at a small event. — [Devpost](https://devpost.com/software/soak)
- **HomeMatch** (GenAI Zürich Hackathon 2026, ~Mar 18, 2026). Won "Apify Challenge Winner". A Chrome extension scores Flatfox real-estate listings against a preference profile built through a Claude conversation. The Apify Google Places Crawler serves as a tool **Claude calls mid-scoring** for amenity data. The team's lesson: "LLM tool-use (Claude calling Apify mid-scoring) creates a fundamentally better UX than pre-fetching all data. The AI decides what context it needs." Built on a 3-layer hybrid pipeline (deterministic + precomputed + LLM), with latency cut from 15–20s to under 2s. — [Devpost](https://devpost.com/software/homematch-e35mgk)
- **Nurse Nora** (unnamed Apify hackathon, about Oct 2025). "Best use of Apify," first place. A voice tool giving patients real-time medical information based on their symptoms, using "a simple connector that gave us access to many Actors that gave us real-time data." The builder, Petros Hong, later joined Apify to build its SF developer community. — [Apify blog, Sep 16, 2026](https://blog.apify.com/petros-hong-hackathon-to-community/)

**Prize structures seen at earlier events:**
- MCP - AI Agents Hackathon (one day, SF, Sep 2025, $47.7K pool). Best use of Apify: 1st $1,000 cash + $1,000 Apify credits, 2nd $1,000 credits, 3rd $500 credits. Required "at least 3 sponsor tools", with 3-minute demos. Sponsors included Anthropic, Bright Data, Redis, TigerData, Stytch, MiniMax, LlamaIndex and others. — [Devpost](https://mcp-ai-agents-hackathon.devpost.com/)
- Burning Heroes x EF (Oct 4, 2025). "Best use of Apify," $1,000 cash, 1 winner. I couldn't identify the winner from the gallery. — [Devpost](https://burning-heroes.devpost.com/)
- "All things agent hackathon by Apify" (AWS Builder Loft, SF). Prizes ran from 1st $1,000 to 10th (credits). Projects were expected to combine AI with real-time web data via "Apify (Actors and datasets)". It doesn't say whether teams had to publish an Actor. — [Luma](https://luma.com/6eqa8nbh)
- The Apify $1M Challenge community hackathon (SF, Dec 6, 2025, European Startup Embassy) asked participants to build **and publish** a new Actor, with a jury picking three Actors for special prizes. I found no winner names. — [Apify Notion page, via search snippet](https://apify.notion.site/apify-1m-challenge-hackathon) (the page body did not render when fetched)

**Projects that won something else but list Apify (not Apify-prize winners):**
- volumemaster2 (&HACKS XII, Sep 2026): won Silver and Finance prizes. A Kalshi → TCGCSV → Apify pipeline scrapes Pokémon product sales volume to flag manipulable prediction markets, and runs once a day to stay on the free plan. — [Devpost](https://devpost.com/software/volumemaster2)
- Sham (Hack the North 2026): won the GPTZero prize. ConnectX (HackWesTX VII): 3rd place. Sudbury Connect (Cursor Hackathon Sudbury): Best UI/UX. All list Apify in their stack. — [Sham](https://devpost.com/software/cool-ppl-from-amplify); [ConnectX](https://devpost.com/software/connectx-r81mg7); [Sudbury Connect](https://devpost.com/software/sudbury-connect)

**Cal Hacks history:**
- The Cal Hacks 12.0 (Oct 24–26, 2025) and 11.0 Devpost pages contain no mention of Apify. TreeHacks 2025/2026, LA Hacks 2026, HackPrinceton Fall 2025 and PennApps XXVI don't either (checked by grepping each Devpost overview page). Cal Hacks 13.0 is Apify's first Cal Hacks sponsorship that I could find. — [Cal Hacks 12.0 Devpost](https://cal-hacks-12-0.devpost.com/); [Fetch.ai Cal Hacks 12.0](https://fetch.ai/events/cal-hacks-12-0)

### Inferences
- The pattern that wins: an **agent (often voice) that reasons over live web data Apify fetches on demand**, with a clear end user (patient, shopper, traveler, sales rep, compliance officer, home buyer). Apify sits in the core loop as the agent's "eyes on the web", not as an offline dataset dump.
- Stacking is normal. About half of the confirmed Apify winners also won a second sponsor prize (Tavus, Vapi, Operant, MiniMax).
- Store Actors named in winning writeups: Website Content Crawler / "Website Crawler", Amazon product scrapers, Google Places/Maps Crawler, travel scrapers (Kayak/Expedia), and the Apify MCP server or "connector" that gives access to many Actors.
- The bar at past (mostly one-day) events was modest: thin writeups like Manta's still won. Cal Hacks is larger (2,000+ hackers, 36 hours), so expect stiffer competition. The winners above are the floor, not the ceiling.

### Gaps
- No public Apify-written rationale for why any specific project won.
- No Apify prize winners found for TreeHacks, HackMIT, PennApps, LA Hacks, HackPrinceton, ETHGlobal or lablab.ai in 2024–2026. Either Apify didn't sponsor there, or the prizes aren't on Devpost.
- The hackathon behind Nurse Nora isn't named. Burning Heroes and Dec-2025 SF hackathon winners weren't found.
- BuildHer Hackathon 2026 (She Code Africa × Apify, "Ship and Earn Africa", participants build Actors): reporting on the winner is inconsistent (WorkDey vs. LoanSafe as first place, per search snippets). Not verified. — [TechCabal](https://techcabal.com/ar/2026/09/23/she-code-africa-and-apify-partner-to-equip-african-women-developers-to-build-and-monetise-technology-for-local-problems/)

## Q2. What do Apify judges and DevRel say they look for, and what makes a good Actor?

### Takeaway
Apify's own language centers on **"meaningful" use of Apify**, project quality, and real-world usefulness. For Actors specifically, its official quality signals are reliability, ease of use (clear title, description, input-field descriptions, README), congruency between README and schemas, limited permissions, and pay-per-event pricing transparency.

### Cited Findings
- Cal Hacks 13.0 Best Actor text: "We have a Best Actor award for building an actor for this event. Project must be using Apify in a meaningful way. We will judge the quality of the project as well as other criteria." — [Cal Hacks 13.0 Devpost](https://cal-hacks-13-0.devpost.com/)
- $1M Challenge jury criteria: "monthly active users, Actor quality, technical excellence, and real-world usefulness". Weekly spotlights rewarded "exceptional code, concept, or user experience". The challenge ran Nov 2025–Jan 2026, with 704 developers and 3,329 Actors published, 1,086 of them qualifying. Grand prizes went to SIÁN OÜ ($30K), johnvc ($20K) and HappiTap ($10K). — [Apify $1M Challenge](https://apify.com/challenge); [search summary of same page](https://apify.com/challenge?fpr=pozur)
- Spotlight winners were practical, niche, structured-data Actors: Website Tech Stack Scanner, Video Thumbnail Extractor, Google Maps AI Reviews Analyzer, AI Model Comparison, BuiltWith Domain Scraper, FEC Campaign Finance Contributions Scraper, Messe Stuttgart Exhibitor List Scraper, AI Scraper, Shopify Store Scraper, and Google Flights API. Apify praised Google Flights API because "It turns flight searches into structured data you can actually work with", and Shopify Store Scraper for "complete store intelligence in a single run". — [Apify challenge](https://apify.com/challenge); [Spotlight](https://apify.com/challenge/spotlight)
- Apify blog: a non-developer won a $2,000 regional prize "with a niche Actor and no code" built with AI tools. — [Apify blog: Gui Stetelle](https://blog.apify.com/apify-builder-spotlight-gui-stetelle/)
- The official Actor quality score (0–100) has 8 factors:
  - **Reliability**: run success rate, passing automated QA tests, an input schema to validate input.
  - **Popularity**.
  - **Feedback and community**.
  - **Ease of use**: "clear, concise titles and descriptions", self-explanatory input field descriptions, a well-structured README.
  - **Pricing transparency**: pay-per-event recommended.
  - **Trustworthiness**: limited permissions, least privilege.
  - **History of success**.
  - **Congruency**: input schema, dataset schema, key-value-store schema and README use consistent terminology and accurately describe behavior.
  — [Apify docs: quality score](https://docs.apify.com/platform/actors/publishing/quality-score)
- Publishing guidance: the README should be clear, detailed, concise and jargon-free for non-developers. Test periodically or set up automated tests. Plan about 2 hrs/week of maintenance. Public code quality matters. Copying another Actor's elements is penalized. — [Apify docs: publishing](https://docs.apify.com/platform/actors/publishing)
- Apify MCP server (`https://mcp.apify.com`): tools include `search-actors`, `fetch-actor-details`, `call-actor` (returns run and storage IDs) and `get-dataset-items`, plus `apify/rag-web-browser` and `apify/web-fetch` by default. It supports dynamic discovery of any Store Actor. **Full-permission Actors are excluded from MCP search and execution.** Higher quality-score Actors rank higher. The hosted server adds inferred output schemas. Per-request agent payments work only with pay-per-event Actors. Tools can be pinned via `?tools=apify/google-search-scraper`. — [Apify docs: MCP](https://docs.apify.com/platform/integrations/mcp)

### Inferences
- To score well with Apify judges, a custom Actor for Best Actor should have:
  - a typed input schema with good field descriptions and prefilled example input,
  - a dataset (output) schema,
  - a plain-language README with example output that is congruent with the schemas,
  - limited permissions, so it remains callable from the Apify MCP server and by agents,
  - pay-per-event pricing, if published.
  These are exactly the signals Apify's own ranking uses.
- "Meaningful" most likely means Apify is load-bearing: remove it and the product breaks. Strong signs are custom Actors, chaining several Actors, Actors called as agent tools at runtime, and scheduled or webhook-driven runs. This is inferred from the wording and the winner patterns, not stated by Apify.

### Gaps
- No published scoring rubric from Apify DevRel for in-person hackathon "Best use of Apify" judging.
- No Apify judge names found for Cal Hacks 13.0. Petros Hong (Apify SF community) is a plausible attendee, but that is unconfirmed.

## Q3. What does "Best Actor" require? Must it be on Apify Store? Any examples?

### Takeaway
The only stated Cal Hacks requirements are that the Actor is built for the event, the project uses Apify meaningfully, and quality is judged "as well as other criteria." **Publishing to Apify Store is not explicitly required**, but Apify's own Actor-building hackathons asked participants to "build and publish", and the one past winner that built an Actor publicized it on Apify.

### Cited Findings
- Best Actor: $400 cash, 1 winner. Full text quoted in Q2. — [Cal Hacks 13.0 Devpost](https://cal-hacks-13-0.devpost.com/)
- Apify's Dec 2025 SF hackathon format was "build and publish a new Actor", with a jury selecting three Actors. — [Apify Notion, via search snippet](https://apify.notion.site/apify-1m-challenge-hackathon)
- Furnicular (a GTC winner) listed "Published Agent on APIfy: cjmckenz/furnicular" as an accomplishment. — [Devpost](https://devpost.com/software/furnicular)
- Public Actors appear in Apify Store under the Store Publishing Terms. Private Actors can be run only by their owner and the users they invite. — [Apify T&Cs (search summary)](https://docs.apify.com/legal/general-terms-and-conditions)
- An unofficial third-party guide claims Store listings go through an approval step lasting 2–5 business days. This is **unverified**, and it conflicts with my understanding that publishing is instant. Don't rely on it. — [Glama-hosted doc](https://glama.ai/mcp/servers/@roizenlabs/sportintel-mcp/blob/f8a45ddbbee2feb94796eb7a42efcac559a0b05b/docs/marketing/APIFY_STORE_SUBMISSION.md)

### Inferences
- Safest play: build the Actor, publish it publicly on Apify Store before the deadline, and include on Devpost:
  - the Store URL, the Actor ID and a GitHub link,
  - a screenshot of the Actor's input UI and the dataset it produces,
  - a mention of its README, input and output schemas, and that it is callable via Apify MCP.
- The Best Actor ($400) and Best use of Apify (up to $2,000) prizes likely share judges. One project with a custom published Actor at its core plausibly competes for both. Whether one project can win both isn't stated.

### Gaps
- Whether a private or unpublished Actor qualifies. No public example of a "Best Actor" winner at any prior hackathon.

## Q4. Cal Hacks 13.0 (2026): dates, venue, size, judging, tracks, rules

### Takeaway
Cal Hacks 13.0 runs **Oct 23–25, 2026 at the Palace of Fine Arts in San Francisco** (not on the UC Berkeley campus). It has 2,000+ hackers, a 36-hour hack, and about $160K in prizes on Devpost. Submissions go on Devpost (image plus GitHub repo, due Oct 25 at 9am PDT). Judging is a 3-minute pitch plus 2 minutes of Q&A, scored on Application, Intentionality, Functionality, Creativity and Technical Complexity, and sponsors may judge asynchronously from the Devpost video. Many agent and web-data sponsor tracks can stack with Apify.

### Cited Findings
**Logistics and rules:**
- Devpost: deadline "Oct 25, 2026 @ 9:00am PDT" (hard deadline, teammates included). Hackers must be at the venue by Oct 25 at 8 AM, must have been accepted and checked in, and must "Include an image of your project and GitHub repository for any code to be considered." All work happens during the hackathon. "You will have three minutes to pitch and two minutes for judges to ask questions." A pre-recorded or live demo is required. As of today, 951 participants are registered on Devpost, with $159,822 in cash prizes. — [Cal Hacks 13.0 Devpost](https://cal-hacks-13-0.devpost.com/)
- Devpost judging criteria (summarized from the page):
  - **Application**: a feasible real-world use, who it helps, why they'd adopt it.
  - **Intentionality**: an intuitive experience guided by first principles.
  - **Functionality**: a smooth live demo, plus "a clear, meaningful video demo on devpost for sponsors evaluating asynchronously".
  - **Creativity**.
  - **Technical Complexity**: "engineering depth that goes beyond basic implementation".
  — [Devpost](https://cal-hacks-13-0.devpost.com/)
- Team size conflict: Devpost says "Team required: 2 to 4 members". calhacks.io says teams of up to 4 and "Solo participants are welcome", and there's a "Best Solo Hack" prize. — [Devpost](https://cal-hacks-13-0.devpost.com/); [calhacks.io](https://www.calhacks.io/)
- calhacks.io: Palace of Fine Arts, SF; 2,000+ hackers; 36 hours; "$100,000 in prizes" (conflicts with Devpost's $159,822). Undergrads, grads and new grads less than a year out are eligible. All implementation must happen during the event, though ideation beforehand is allowed. Apify is listed as a sponsor. — [calhacks.io](https://www.calhacks.io/)
- Dates: Oct 23–25, 2026, Palace of Fine Arts. Fetch.ai lists the address as 3301 Lyon St and calhacks.io as 3601 Lyon St, which is a discrepancy. — [Fetch.ai Cal Hacks 13.0](https://innovationlab.fetch.ai/events/calhacks-13-0); [MLH listing](https://www.mlh.com/events/cal-hacks-13-0)
- Presenting sponsors: Anthropic, Annapurna Labs (AWS), SpacetimeDB and Hyphenate. — [Devpost](https://cal-hacks-13-0.devpost.com/)

**Apify prizes:**
- Best Use of Apify: 5 winners, 1st $2,000, 2nd $1,000, 3rd $800, 4th $400, 5th $400. Devpost shows "$4,600 in cash" but the description says "$5,000 in cash prizes", which presumably includes the $400 Best Actor prize. Best Actor: $400, 1 winner. — [Devpost](https://cal-hacks-13-0.devpost.com/)

**Sponsor tracks that could stack with Apify (all from the Devpost prize list):**
- **Anthropic: Claude for Public Benefit.** $4,998 in cash value ($5,000 Claude credits + 1 yr Claude Max 20x + office hours), 1 winner. Natural pairing: Claude agent + Apify MCP.
- **Bright Data: Best Agent/App Using Public Web Data.** 3 winners, $1,500/$1,000/$500 in credits plus $500/$350/$250 Amazon cards. This is a direct web-data competitor to Apify, but a past Apify winner (Wanderful) used both. Bright Data also published a Cal Hacks 13 hackpack. — [Bright Data hackpack](https://github.com/ScrapeAlchemist/public-data-hackpack)
- **Atlassian: Best Agent / Best Security Solution for Agents.** 4 winners, AirPods Max each. You must state the track in the description.
- **Fetch.ai: Best Use of Fetch.ai.** Devpost lists 1st $1,500, 2nd $1,000, 3rd $500. Fetch.ai's own page lists $1,250, $750 and $500 plus internship interviews, and two $250 special recognitions, so the two sources conflict. — [Fetch.ai](https://innovationlab.fetch.ai/events/calhacks-13-0)
- **Convex: Best use of Convex.** $5,000, and "Use real Convex features like live queries and components to win."
- **Factory: Best Use of the Factory Droid SDK.** $2,000 plus credits.
- **Hyphenate: The Hyphenated Enterprise: Autonomous Systems for Finance.** $16,000 across 5 winners ($8K, $5K, $3K for the top 3).
- **Visa: Reimagining Shopping.** $5,000.
- **Coinbase: Best Use of x402.** Up to $4,000.
- **Creao AI.** Three tracks: Best AI-First Disruptor ($2,500), Best One-Person Company ($1,500), Best Team Empowerment ($1,000).
- **Elastic: Agent Builder on Serverless.** Meta Quest 3S / Bose prizes.
- **Mana.** $5,000.
- **Spacetime.** $2,048 / $1,024 / $512.
- **CRS API.** $2,000 / $1,000.
- **Capital One: Nessie.** $300 gift card per person.
- **Cartesia (voice).** Listed as $1,516; the prize is Meta glasses, still TBD.
- **Microsoft: Built for the Real World.** Surface laptops.
- **Meta: Bringing People Closer Together with AI.** Invitation to a Round 2 hackathon.
- **Smaller sponsor prizes:** Moss, Armadin (security), Figma, Notability, Bitdeer AI, and SpaceXSI (must be built with Cursor).
- **MLH:** Gemini API, Solana, Tiger Data, Vultr, Snowflake API, GoDaddy domain, and the Commit Fellowship.
- **Cal Hacks general prizes:** First Overall ($3,600 cash value / laptops), Second and Third Overall, Best Beginner, Most Creative, Most Technically Complex, Best Hardware, People-First and Planet-First Social Impact, Best Solo, Hacker's Choice.
- Source for all of the above unless noted: [Cal Hacks 13.0 Devpost](https://cal-hacks-13-0.devpost.com/)

### Inferences
- The best stack candidates for an Apify-centric agent:
  - **Anthropic Claude for Public Benefit**: Claude + Apify MCP, with a public-benefit framing.
  - **Atlassian Best Agent**.
  - **Bright Data Public Web Data**: same theme; use both only if each is genuinely load-bearing.
  - **Fetch.ai**: wrap the agent as an Agentverse agent.
  - **Convex**: live backend for scraped data.
  - **Visa Reimagining Shopping**: e-commerce data from Apify Actors.
  - **Hyphenate finance**: the largest pool; Apify for market or alt-data.
  - **Cartesia or Vapi-style voice**: past Apify winners were often voice agents. Cartesia is the voice sponsor here.
- Coinbase x402 plus Apify pay-per-event Actors could make an "agent pays per Actor call" angle. Apify's MCP docs mention per-request agent payments for pay-per-event Actors, but I did not verify that this uses x402, so treat it as speculative.
- Sponsor judges may score asynchronously from the Devpost video. The Apify integration (Actor runs, datasets, the custom Actor's Store page) should be visible in the video and named explicitly in the Devpost text.

### Gaps
- Exact expo or judging schedule, and whether sponsor judging is a separate table. Not on the public pages; probably on the Hive platform or Slack.
- Which Apify staff are judging.

## Q5. What patterns lose?

### Takeaway
No source publishes a list of losing patterns. Inferring from the "meaningful way" wording, the official quality criteria, and the contrast between Apify-prize winners and the 400+ Devpost projects that merely tag Apify: projects where Apify is incidental (one pre-built scraper run once for a static dataset, or "apify" as a tag only) do not win the Apify prize.

### Cited Findings
- Of 416 Devpost projects matching "apify", 47 were winners of any prize. Only ~11 of those won an Apify prize. The rest won unrelated tracks with Apify as a peripheral data source; volumemaster2, for example, runs Apify once a day to stay on the free plan. — [Devpost search](https://devpost.com/software/search?query=apify); [volumemaster2](https://devpost.com/software/volumemaster2)
- Cal Hacks requires that the project use "Apify in a meaningful way". — [Devpost](https://cal-hacks-13-0.devpost.com/)
- The general Cal Hacks criteria demand "engineering depth that goes beyond basic implementation". — [Devpost](https://cal-hacks-13-0.devpost.com/)
- Full-permission Actors can't be used through the Apify MCP server, which undercuts an agent-integration story. — [Apify MCP docs](https://docs.apify.com/platform/integrations/mcp)

### Inferences
Likely losing patterns:
1. Calling a single popular Store scraper once to seed a database, so Apify is invisible in the demo.
2. A generic "chat with scraped website" RAG app with no specific user.
3. A custom Actor with no input schema, no README, or a mismatched schema and README.
4. Not explaining in Devpost or the video which Actors are used and why.
5. Copying an existing Store Actor, which Apify explicitly penalizes.

Likely winning differentiators:
- Agent-time tool calls to Actors (HomeMatch's lesson).
- Several Actors orchestrated together.
- A custom, published, niche Actor that fills a real Store gap. The $1M Challenge winners were niche and practical.
- Scheduled or monitoring runs with webhooks.
- A clear real-world user.

### Gaps
- No Apify judge feedback on rejected projects is publicly available.

# BeInvolved

**Your city decides things every week. Have a say.** · [beinvolved.us](https://beinvolved.us)

Team: [@2900xt](https://github.com/2900xt), [@mallhw](https://github.com/mallhw), [@amalhotra08](https://github.com/amalhotra08)

## What it is

BeInvolved gets people involved in their local government. Pick where you live on the map, and it zooms from the nation to your state, district and city. At each level you see who represents you and what's on the table. Then it finds the upcoming city council decisions that affect you and helps you take part: show up to the meeting, send a public comment, and get alerts when your topics come up again.

- **Map:** all 50 states with their senators and House delegation, plus 19 cities in 11 states with live meeting calendars
- **Decisions:** a custom Apify Actor reads city agendas, and Claude explains each item in plain English and ranks it by what you care about
- **Action:** add meetings to your calendar, draft a public comment and email it to the city clerk, or sign up for weekly alerts
- **Accountability:** members of Congress show their [Integrity Index](https://integrityindex.us) financial-integrity score

## Tracks

- Best Use of Apify
- Best Actor (Apify)
- Anthropic: Claude for Public Benefit
- Best People-First Hack
- MLH: Best Domain Name from GoDaddy Registry

## Code

- [`actor/`](actor/): the BeInvolved Apify Actor (Python). Legistar and Berkeley adapters, Claude scoring, pay-per-event pricing, Standby MCP server.
- [`web/`](web/): Next.js app with the map, results, comment drafting, alerts and the Claude agent.

```bash
cd actor && apify push              # deploy the Actor
cd web && npm install && npm run dev  # web app (env vars in web/.env.example)
```

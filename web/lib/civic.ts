import { ApifyClient } from "apify-client";
import { JURISDICTIONS } from "./civic-shared";
import { CITIES } from "./places";

const PRESET_IDS = new Set(JURISDICTIONS.map((j) => j.id));

export type AgendaMatch = {
  itemId: string;
  relevance: number;
  matchedInterest: string | null;
  plainSummary: string | null;
  reason: string | null;
  actionType: string | null;
  jurisdiction: string;
  jurisdictionName: string;
  platform: string;
  body: string;
  meetingDate: string;
  meetingTime: string | null;
  section: string | null;
  itemNumber: string | null;
  title: string;
  description: string | null;
  documentUrl: string | null;
  agendaUrl: string | null;
  meetingUrl: string | null;
  scoredBy: string;
};

export type ScanInput = {
  interests: string[];
  jurisdictions: string[];
  daysAhead?: number;
};

export function actorId(): string {
  const id = process.env.APIFY_ACTOR_ID;
  if (!id) throw new Error("Set APIFY_ACTOR_ID (e.g. yourname/beinvolved) in web/.env.local");
  return id;
}

export function apify(): ApifyClient {
  const token = process.env.APIFY_TOKEN;
  if (!token) throw new Error("Set APIFY_TOKEN in web/.env.local");
  return new ApifyClient({ token });
}

/** Runs the BeInvolved Actor on Apify and returns its matches plus the digest it saved. */
export async function runScan(input: ScanInput) {
  const client = apify();
  // Preset cities go in `jurisdictions`; any other Legistar city is passed through as a client slug.
  const jurisdictions = input.jurisdictions.filter((j) => PRESET_IDS.has(j));
  const extraLegistarClients = input.jurisdictions.filter((j) => !PRESET_IDS.has(j));
  const run = await client.actor(actorId()).call(
    { ...input, jurisdictions, extraLegistarClients, minRelevance: "0.5", maxMeetingsPerJurisdiction: 4 },
    { waitSecs: 240, maxTotalChargeUsd: 2 },
  );
  const { items } = await client.dataset(run.defaultDatasetId).listItems({ clean: true });
  const output = await client.keyValueStore(run.defaultKeyValueStoreId).getRecord("OUTPUT");
  const out = (output?.value ?? {}) as { digest?: string; itemsScanned?: number; matchCount?: number };
  return {
    runId: run.id,
    runUrl: `https://console.apify.com/actors/runs/${run.id}`,
    status: run.status,
    items: (items as unknown as AgendaMatch[]).map((i) => {
      const city = CITIES.find((c) => c.id === i.jurisdiction);
      return city && !PRESET_IDS.has(city.id) ? { ...i, jurisdictionName: `City of ${city.name}` } : i;
    }),
    digest: out.digest ?? "",
    itemsScanned: out.itemsScanned ?? 0,
  };
}

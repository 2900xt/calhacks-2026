import { NextResponse } from "next/server";
import { runScan } from "@/lib/civic";
import sample from "@/lib/sample.json";

export const maxDuration = 300;

export async function POST(req: Request) {
  const body = await req.json();
  const interests: string[] = (body.interests ?? []).filter((s: string) => s?.trim());
  const jurisdictions: string[] = body.jurisdictions ?? [];
  if (!interests.length || !jurisdictions.length) {
    return NextResponse.json({ error: "Pick at least one interest and one city." }, { status: 400 });
  }

  // Without Apify credentials, serve a recorded run so the UI is still explorable.
  if (!process.env.APIFY_TOKEN || !process.env.APIFY_ACTOR_ID) {
    return NextResponse.json({ ...sample, runUrl: null, demo: true });
  }

  try {
    const result = await runScan({ interests, jurisdictions, daysAhead: body.daysAhead ?? 21 });
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

import { NextResponse } from "next/server";

export type CivicEvent = { date: string; time: string | null; name: string; location: string | null; url: string | null };

const UA = "BeInvolved/1.0 (+https://beinvolved.us)";
const LEGISTAR = new Set(["oakland", "sanjose", "alameda", "mountainview", "sunnyvaleca"]);

/** The next few public meetings anyone can attend: council, committees and commissions. */
export async function GET(req: Request) {
  const city = new URL(req.url).searchParams.get("city") ?? "";
  const today = new Date().toISOString().slice(0, 10);
  try {
    const events = LEGISTAR.has(city) ? await legistar(city, today) : city === "berkeley" ? await berkeley(today) : [];
    return NextResponse.json({ events: events.slice(0, 3) }, { headers: { "Cache-Control": "s-maxage=3600" } });
  } catch (err) {
    return NextResponse.json({ events: [], error: (err as Error).message }, { status: 502 });
  }
}

async function legistar(slug: string, today: string): Promise<CivicEvent[]> {
  const q = new URLSearchParams({
    $filter: `EventDate ge datetime'${today}'`,
    $orderby: "EventDate asc",
    $top: "15",
  });
  const res = await fetch(`https://webapi.legistar.com/v1/${slug}/events?${q}`, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`Legistar ${res.status}`);
  const rows: Record<string, string | null>[] = await res.json();
  return rows
    .filter((e) => !/cancel/i.test(`${e.EventAgendaStatusName} ${e.EventLocation} ${e.EventBodyName}`))
    .sort((a, b) => `${a.EventDate}`.localeCompare(`${b.EventDate}`) || clock(a.EventTime) - clock(b.EventTime))
    .map((e) => ({
      date: (e.EventDate ?? "").slice(0, 10),
      time: e.EventTime,
      name: (e.EventBodyName ?? "Public meeting").replace(/^\*\s*/, "").trim(),
      location: cleanLocation(e.EventLocation),
      url: e.EventInSiteURL,
    }));
}

async function berkeley(today: string): Promise<CivicEvent[]> {
  const base = "https://berkeleyca.gov";
  const res = await fetch(`${base}/your-government/city-council/city-council-agendas`, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`berkeleyca.gov ${res.status}`);
  const html = await res.text();
  const seen = new Map<string, CivicEvent>();
  for (const m of html.matchAll(/href="\/(city-council-([a-z-]*?)-?eagenda-([a-z]+)-(\d{1,2})-(\d{4}))"/g)) {
    const [, slug, kind, month, day, year] = m;
    if (slug.includes("cancelled")) continue;
    const date = new Date(`${month} ${day}, ${year} 12:00`);
    if (isNaN(date.getTime())) continue;
    const iso = date.toISOString().slice(0, 10);
    if (iso < today) continue;
    const label = kind ? kind.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) : "";
    seen.set(slug, {
      date: iso,
      time: null,
      name: `City Council${label ? ` (${label})` : ""}`,
      location: null,
      url: `${base}/${slug}`,
    });
  }
  return [...seen.values()].sort((a, b) => a.date.localeCompare(b.date));
}

function clock(t: string | null | undefined) {
  const m = t?.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (!m) return 0;
  return ((Number(m[1]) % 12) + (m[3].toUpperCase() === "PM" ? 12 : 0)) * 60 + Number(m[2]);
}

function cleanLocation(loc: string | null | undefined) {
  if (!loc) return null;
  const first = loc.split(/\r?\n/)[0].replace(/https?:\/\/\S+/g, "").replace(/\s+-\s*$/, "").trim();
  return first.length > 70 ? first.slice(0, 67) + "…" : first || null;
}

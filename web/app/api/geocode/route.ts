import { NextResponse } from "next/server";

/** Turns "94704", "Ashby Ave, Berkeley" or "Seattle" into coordinates (OpenStreetMap Nominatim, US only). */
export async function GET(req: Request) {
  const q = new URL(req.url).searchParams.get("q")?.trim();
  if (!q) return NextResponse.json({ error: "Type a city, address or ZIP code." }, { status: 400 });
  const url = `https://nominatim.openstreetmap.org/search?${new URLSearchParams({ q, countrycodes: "us", format: "json", limit: "1" })}`;
  const res = await fetch(url, { headers: { "User-Agent": "BeInvolved/1.0 (+https://beinvolved.us)" } });
  const [hit] = (await res.json()) as { lat: string; lon: string; display_name: string }[];
  if (!hit) return NextResponse.json({ error: "We couldn't find that place. Try a city or ZIP code." }, { status: 404 });
  return NextResponse.json(
    { lat: Number(hit.lat), lon: Number(hit.lon), label: hit.display_name.split(",").slice(0, 2).join(",") },
    { headers: { "Cache-Control": "s-maxage=86400" } },
  );
}

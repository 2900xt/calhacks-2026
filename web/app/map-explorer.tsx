"use client";

import { geoAlbersUsa, geoPath, type GeoPermissibleObjects } from "d3-geo";
import { select } from "d3-selection";
import "d3-transition";
import { zoomIdentity } from "d3-zoom";
import { useEffect, useMemo, useRef, useState } from "react";
import { feature } from "topojson-client";
import type { GeometryCollection, Topology } from "topojson-specification";
import us from "us-atlas/counties-albers-10m.json";
import { CALIFORNIA, CITIES, COUNTY_ISSUES, NATION, type City, type Level, type Official } from "@/lib/places";

const W = 975;
const H = 610;

// us-atlas's *-albers files are pre-projected with exactly this projection.
const projection = geoAlbersUsa().scale(1300).translate([487.5, 305]);
const path = geoPath();

type Feature = GeoJSON.Feature<GeoJSON.Geometry, { name: string }> & { id: string };

const LEVELS: Level[] = ["nation", "state", "district", "city"];

export function MapExplorer({ onExplore }: { onExplore: (cityId: string) => void }) {
  const topo = us as unknown as Topology<{
    states: GeometryCollection<{ name: string }>;
    counties: GeometryCollection<{ name: string }>;
  }>;
  const states = useMemo(() => (feature(topo, topo.objects.states) as unknown as { features: Feature[] }).features, [topo]);
  const caCounties = useMemo(
    () =>
      (feature(topo, topo.objects.counties) as unknown as { features: Feature[] }).features.filter((f) =>
        String(f.id).startsWith(CALIFORNIA.fips),
      ),
    [topo],
  );
  const california = states.find((s) => s.id === CALIFORNIA.fips)!;

  const [level, setLevel] = useState<Level>("nation");
  const [city, setCity] = useState<City | null>(null);
  const [hover, setHover] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [k, setK] = useState(1);
  const svgRef = useRef<SVGSVGElement>(null);
  const gRef = useRef<SVGGElement>(null);

  const county = useMemo(() => (city ? caCounties.find((c) => c.id === city.countyFips) ?? null : null), [city, caCounties]);
  const cityXY = useMemo(() => (city ? (projection(city.lonlat) as [number, number]) : null), [city]);

  // Animate the camera to the box for the current level.
  useEffect(() => {
    let box: [[number, number], [number, number]] = [
      [0, 0],
      [W, H],
    ];
    if (level === "state") box = path.bounds(california as GeoPermissibleObjects);
    if (level === "district" && county) box = path.bounds(county as GeoPermissibleObjects);
    if (level === "city" && cityXY) box = [
      [cityXY[0] - 5, cityXY[1] - 3.2],
      [cityXY[0] + 5, cityXY[1] + 3.2],
    ];
    const [[x0, y0], [x1, y1]] = box;
    const scale = level === "nation" ? 1 : Math.min(400, 0.85 / Math.max((x1 - x0) / W, (y1 - y0) / H));
    const t = zoomIdentity
      .translate(W * 0.6, H * 0.55) // leave room for the question in the top-left
      .scale(scale)
      .translate(-(x0 + x1) / 2, -(y0 + y1) / 2);
    setK(scale);
    const g = select(gRef.current);
    g.transition()
      .duration(1100)
      .attr("transform", level === "nation" ? "translate(0,0) scale(1)" : t.toString());
  }, [level, city, california, county, cityXY]);

  function pickCity(id: string) {
    const c = CITIES.find((x) => x.id === id);
    if (!c) return;
    setNotice(null);
    setCity(c);
    setLevel("city");
  }

  function clickState(f: Feature) {
    if (f.id === CALIFORNIA.fips) {
      setNotice(null);
      setLevel("state");
    } else {
      setNotice(`BeInvolved is live in the Bay Area first. ${f.properties.name} is coming soon.`);
    }
  }

  const available = (l: Level) => l === "nation" || l === "state" || !!city;
  const r = 9 / k; // same on-screen size at every zoom level

  return (
    <section className="relative overflow-hidden rounded-xl border border-line bg-[#f4f1ea]">
      <div className="grid lg:grid-cols-[1fr_340px]">
        <div className="relative">
          <div className="pointer-events-none absolute left-5 top-5 z-10 max-w-sm">
            <p className="font-serif text-2xl leading-tight sm:text-3xl">Where in the U.S. do you live?</p>
            <p className="mt-1 text-sm text-muted">Pick your city, or click your state on the map.</p>
            <select
              value={city?.id ?? ""}
              onChange={(e) => pickCity(e.target.value)}
              className="pointer-events-auto mt-3 rounded-lg border border-line bg-white px-3 py-2 text-sm outline-none focus:border-accent"
            >
              <option value="" disabled>
                Choose your city…
              </option>
              {CITIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}, CA
                </option>
              ))}
            </select>
          </div>

          <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} className="block h-[420px] w-full sm:h-[520px]" role="img" aria-label="Map of the United States">
            <g ref={gRef}>
              {states.map((s) => {
                const isCA = s.id === CALIFORNIA.fips;
                return (
                  <path
                    key={s.id}
                    d={path(s as GeoPermissibleObjects) ?? ""}
                    onClick={() => clickState(s)}
                    onMouseEnter={() => setHover(s.properties.name)}
                    onMouseLeave={() => setHover(null)}
                    className={`cursor-pointer transition-colors ${
                      isCA
                        ? level === "nation"
                          ? "fill-accent/70 hover:fill-accent"
                          : "fill-[#e9e4d8]"
                        : "fill-[#e2ddd2] hover:fill-[#d3cdbf]"
                    }`}
                    stroke="#fbf8f2"
                    strokeWidth={1}
                    vectorEffect="non-scaling-stroke"
                  />
                );
              })}
              {level !== "nation" &&
                caCounties.map((c) => {
                  const mine = county?.id === c.id;
                  return (
                    <path
                      key={c.id}
                      d={path(c as GeoPermissibleObjects) ?? ""}
                      onMouseEnter={() => setHover(`${c.properties.name} County`)}
                      onMouseLeave={() => setHover(null)}
                      className={mine && level !== "state" ? "fill-accent/25" : "fill-transparent"}
                      stroke={mine && level !== "state" ? "#007354" : "#cfc8b8"}
                      strokeWidth={mine && level !== "state" ? 2 : 0.6}
                      vectorEffect="non-scaling-stroke"
                    />
                  );
                })}
              {level !== "nation" &&
                CITIES.map((c) => {
                  const [x, y] = projection(c.lonlat) as [number, number];
                  const on = city?.id === c.id;
                  return (
                    <g key={c.id} onClick={() => pickCity(c.id)} className="cursor-pointer">
                      {on && <circle cx={x} cy={y} r={r * 2.4} className="fill-accent/20 animate-pulse" />}
                      <circle
                        cx={x}
                        cy={y}
                        r={on ? r : r * 0.7}
                        className={on ? "fill-accent" : "fill-foreground/70 hover:fill-accent"}
                        stroke="white"
                        strokeWidth={1.5}
                        vectorEffect="non-scaling-stroke"
                      />
                      {(level === "city" || level === "district" || on) && (
                        <text
                          x={x + r * 1.4}
                          y={y + r * 0.45}
                          fontSize={r * 1.9}
                          className={`font-sans ${on ? "fill-foreground font-semibold" : "fill-muted"}`}
                        >
                          {c.name}
                        </text>
                      )}
                    </g>
                  );
                })}
            </g>
          </svg>

          {hover && (
            <span className="pointer-events-none absolute bottom-16 left-5 rounded bg-white/90 px-2 py-1 text-xs shadow">{hover}</span>
          )}
          {notice && (
            <p className="absolute bottom-16 right-5 max-w-xs rounded-lg bg-white px-3 py-2 text-xs text-muted shadow">{notice}</p>
          )}

          <nav className="absolute bottom-4 left-5 right-5 flex flex-wrap gap-1.5" aria-label="Zoom level">
            {LEVELS.map((l) => (
              <button
                key={l}
                disabled={!available(l)}
                onClick={() => {
                  setNotice(null);
                  setLevel(l);
                }}
                className={`rounded-full border px-3 py-1 text-xs transition disabled:opacity-40 ${
                  level === l ? "border-foreground bg-foreground text-background" : "border-line bg-white hover:border-accent"
                }`}
              >
                {levelLabel(l, city)}
              </button>
            ))}
          </nav>
        </div>

        <aside className="border-t border-line bg-white p-5 lg:border-l lg:border-t-0">
          <LevelPanel level={level} city={city} onExplore={onExplore} />
        </aside>
      </div>
    </section>
  );
}

function LevelPanel({ level, city, onExplore }: { level: Level; city: City | null; onExplore: (id: string) => void }) {
  if (level === "nation")
    return (
      <Panel kicker="National" title={NATION.name} officials={NATION.officials} issues={NATION.issues} callout={NATION.callout}>
        <p className="text-xs text-muted">Click California, or pick your city, to zoom in.</p>
      </Panel>
    );
  if (level === "state" || !city)
    return (
      <Panel kicker="State" title={CALIFORNIA.name} officials={CALIFORNIA.officials} issues={CALIFORNIA.issues} callout={CALIFORNIA.callout}>
        <p className="text-xs text-muted">Click a city dot to see who represents it.</p>
      </Panel>
    );
  if (level === "district")
    return (
      <Panel
        kicker={`District ${city.district} · ${city.county}`}
        title={`${city.county}`}
        officials={[city.rep, ...CALIFORNIA.officials.slice(1)]}
        issues={COUNTY_ISSUES[city.countyFips] ?? []}
      >
        <p className="text-xs text-muted">Your House member votes on federal laws; your senators represent all of California.</p>
      </Panel>
    );
  return (
    <Panel kicker={`City · ${city.county}`} title={city.name} officials={[...city.local, city.rep]} issues={city.issues}>
      <button
        onClick={() => onExplore(city.id)}
        className="mt-1 w-full rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90"
      >
        See what {city.name} is deciding →
      </button>
    </Panel>
  );
}

function Panel({
  kicker,
  title,
  officials,
  issues,
  callout,
  children,
}: {
  kicker: string;
  title: string;
  officials: Official[];
  issues: string[];
  callout?: string;
  children?: React.ReactNode;
}) {
  return (
    <div key={title} className="animate-[fadein_.4s_ease]">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-accent">{kicker}</p>
      <h3 className="mt-1 font-serif text-3xl leading-tight">{title}</h3>
      <p className="mt-5 text-[11px] font-semibold uppercase tracking-wider text-muted">Who represents you</p>
      <ul className="mt-2 divide-y divide-line">
        {officials.map((o) => (
          <li key={o.role + o.name} className="flex items-baseline justify-between gap-3 py-2 text-sm">
            <span className="text-muted">{o.role}</span>
            <span className="text-right font-medium">
              {o.name}
              {o.party && <span className="ml-1 text-xs text-muted">({o.party})</span>}
            </span>
          </li>
        ))}
      </ul>
      {issues.length > 0 && (
        <>
          <p className="mt-5 text-[11px] font-semibold uppercase tracking-wider text-muted">On the table</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {issues.map((i) => (
              <span key={i} className="rounded-md bg-accent-soft px-2 py-1 text-xs text-accent">
                {i}
              </span>
            ))}
          </div>
        </>
      )}
      {callout && <p className="mt-5 rounded-lg bg-soft p-3 text-xs leading-relaxed">{callout}</p>}
      <div className="mt-5">{children}</div>
    </div>
  );
}

function levelLabel(l: Level, city: City | null) {
  if (l === "nation") return "🇺🇸 National";
  if (l === "state") return "California";
  if (l === "district") return city ? `${city.district} · ${city.county.replace(" County", "")}` : "District";
  return city ? city.name : "City";
}

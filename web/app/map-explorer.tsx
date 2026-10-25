"use client";

import { geoAlbersUsa, geoPath, type GeoPermissibleObjects } from "d3-geo";
import { select } from "d3-selection";
import "d3-transition";
import { zoomIdentity } from "d3-zoom";
import { useEffect, useMemo, useRef, useState } from "react";
import type { CivicEvent } from "./api/events/route";
import { feature } from "topojson-client";
import type { GeometryCollection, Topology } from "topojson-specification";
import us from "us-atlas/counties-albers-10m.json";
import { grade, house, integrity, senators } from "@/lib/congress";
import { CALIFORNIA, CITIES, COUNTY_ISSUES, NATION, type City, type Level, type Official } from "@/lib/places";

const W = 975;
const H = 610;

// us-atlas's *-albers files are pre-projected with exactly this projection.
const projection = geoAlbersUsa().scale(1300).translate([487.5, 305]);
const path = geoPath();

type Feature = GeoJSON.Feature<GeoJSON.Geometry, { name: string }> & { id: string };

const LEVELS: Level[] = ["nation", "state", "district", "city"];

export function MapExplorer({
  onExplore,
  entered,
  onEnter,
}: {
  onExplore: (cityId: string) => void;
  entered: boolean;
  onEnter: () => void;
}) {
  const topo = us as unknown as Topology<{
    states: GeometryCollection<{ name: string }>;
    counties: GeometryCollection<{ name: string }>;
  }>;
  const states = useMemo(() => (feature(topo, topo.objects.states) as unknown as { features: Feature[] }).features, [topo]);
  const allCounties = useMemo(() => (feature(topo, topo.objects.counties) as unknown as { features: Feature[] }).features, [topo]);
  const statesWithCities = useMemo(() => new Set(CITIES.map((c) => c.state)), []);

  const [level, setLevel] = useState<Level>("nation");
  const [stateFips, setStateFips] = useState<string>(CALIFORNIA.fips);
  const usState = states.find((s) => s.id === stateFips)!;
  const stateCounties = useMemo(() => allCounties.filter((f) => String(f.id).startsWith(stateFips)), [allCounties, stateFips]);
  const stateCities = CITIES.filter((c) => c.state === usState.properties.name);
  const [city, setCity] = useState<City | null>(null);
  const [hover, setHover] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [k, setK] = useState(1);
  const svgRef = useRef<SVGSVGElement>(null);
  const gRef = useRef<SVGGElement>(null);

  const county = useMemo(() => (city?.countyFips ? allCounties.find((c) => c.id === city.countyFips) ?? null : null), [city, allCounties]);
  const cityXY = useMemo(() => (city ? (projection(city.lonlat) as [number, number]) : null), [city]);

  // Animate the camera to the box for the current level.
  useEffect(() => {
    let box: [[number, number], [number, number]] = [
      [0, 0],
      [W, H],
    ];
    if (level === "state") box = path.bounds(usState as GeoPermissibleObjects);
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
  }, [level, city, usState, county, cityXY]);

  function pickCity(id: string) {
    const c = CITIES.find((x) => x.id === id);
    if (!c) return;
    setNotice(null);
    const fips = states.find((s) => s.properties.name === c.state)?.id;
    if (fips) setStateFips(fips);
    setCity(c);
    setLevel("city");
  }

  function clickState(f: Feature) {
    setNotice(null);
    setStateFips(f.id);
    if (city && city.state !== f.properties.name) setCity(null);
    setLevel("state");
  }

  const [query, setQuery] = useState("");
  const [locating, setLocating] = useState(false);
  const [found, setFound] = useState<string | null>(null);
  const [flying, setFlying] = useState(false);

  // Snap any place in the U.S. to the nearest city BeInvolved covers, then zoom there and open the site.
  function locate(lat: number, lon: number, label: string) {
    const miles = (c: City) => {
      const [lo, la] = c.lonlat;
      const rad = Math.PI / 180;
      const a =
        Math.sin(((la - lat) * rad) / 2) ** 2 +
        Math.cos(lat * rad) * Math.cos(la * rad) * Math.sin(((lo - lon) * rad) / 2) ** 2;
      return 7918 * Math.asin(Math.sqrt(a));
    };
    const nearest = [...CITIES].sort((a, b) => miles(a) - miles(b))[0];
    const d = Math.round(miles(nearest));
    setFound(d > 15 ? `Closest city on BeInvolved to ${label}: ${nearest.name} (${d} mi away)` : null);
    setFlying(true);
    pickCity(nearest.id);
    setTimeout(onEnter, 1300);
  }

  async function search() {
    if (!query.trim()) return;
    setLocating(true);
    setNotice(null);
    try {
      const res = await fetch(`/api/geocode?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      locate(data.lat, data.lon, data.label);
    } catch (e) {
      setNotice((e as Error).message);
    } finally {
      setLocating(false);
    }
  }

  function useMyLocation() {
    if (!navigator.geolocation) return setNotice("Your browser can't share location. Type your city instead.");
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setLocating(false);
        locate(p.coords.latitude, p.coords.longitude, "you");
      },
      () => {
        setLocating(false);
        setNotice("Location was blocked. Type your city or ZIP instead.");
      },
    );
  }

  const available = (l: Level) => l === "nation" || l === "state" || (l === "district" ? !!city?.countyFips : !!city);
  const r = 9 / k; // same on-screen size at every zoom level

  return (
    <section
      className={`overflow-hidden bg-[#f4f1ea] ${
        entered ? "relative rounded-xl border border-line" : "fixed inset-0 z-50"
      }`}
    >
      {!entered && (
        <div className={`pointer-events-none absolute inset-0 z-20 flex flex-col items-center justify-center px-4 transition-opacity duration-500 ${flying ? "opacity-0" : ""}`}>
          <div className="pointer-events-auto w-full max-w-xl rounded-2xl border border-line bg-white/95 p-6 text-center shadow-xl backdrop-blur sm:p-8">
            <p className="font-serif text-4xl leading-tight sm:text-5xl">Where do you live?</p>
            <p className="mt-2 text-muted">See who represents you and what your city is about to decide.</p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                search();
              }}
              className="mt-6 flex gap-2"
            >
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="City, address or ZIP code"
                className="min-w-0 flex-1 rounded-xl border border-line px-4 py-3 text-base outline-none focus:border-accent"
              />
              <button
                disabled={locating}
                className="rounded-xl bg-accent px-5 py-3 font-semibold text-white hover:opacity-90 disabled:opacity-60"
              >
                {locating ? "Finding…" : "Go"}
              </button>
            </form>
            <button type="button" onClick={useMyLocation} className="mt-3 text-sm text-accent hover:underline">
              Use my current location
            </button>
            {notice && <p className="mt-3 text-sm text-warn">{notice}</p>}
          </div>
          <button
            type="button"
            onClick={onEnter}
            className="pointer-events-auto mt-5 text-sm text-muted hover:text-foreground"
          >
            Skip and explore the map →
          </button>
        </div>
      )}
      <div className={`grid ${entered ? "lg:grid-cols-[1fr_340px]" : ""}`}>
        <div className="relative">
          <div className={`pointer-events-none absolute left-5 top-5 z-10 max-w-sm ${entered ? "" : "hidden"}`}>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">Your city</p>
            {found && <p className="mt-1 max-w-xs text-xs text-muted">{found}</p>}
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
                  {c.name}, {abbr(c.state)}
                </option>
              ))}
            </select>
          </div>

          <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} className={`block w-full transition-[height] duration-700 ${entered ? "h-[420px] sm:h-[520px]" : "h-[100svh]"}`} role="img" aria-label="Map of the United States">
            <g ref={gRef}>
              {states.map((s) => {
                const covered = statesWithCities.has(s.properties.name);
                const selected = s.id === stateFips && level !== "nation";
                return (
                  <path
                    key={s.id}
                    d={path(s as GeoPermissibleObjects) ?? ""}
                    onClick={() => clickState(s)}
                    onMouseEnter={() => setHover(s.properties.name)}
                    onMouseLeave={() => setHover(null)}
                    className={`cursor-pointer transition-colors ${
                      selected
                        ? "fill-[#ece7dc]"
                        : covered && level === "nation"
                          ? "fill-accent/60 hover:fill-accent"
                          : "fill-[#e2ddd2] hover:fill-[#d3cdbf]"
                    }`}
                    stroke="#fbf8f2"
                    strokeWidth={1}
                    vectorEffect="non-scaling-stroke"
                  />
                );
              })}
              {level !== "nation" &&
                stateCounties.map((c) => {
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
              {(level === "nation" ? CITIES : stateCities).map((c) => {
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
          {notice && entered && (
            <p className="absolute bottom-16 right-5 max-w-xs rounded-lg bg-white px-3 py-2 text-xs text-muted shadow">{notice}</p>
          )}

          <nav className={`absolute bottom-4 left-5 right-5 flex flex-wrap gap-1.5 ${entered ? "" : "hidden"}`} aria-label="Zoom level">
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
                {levelLabel(l, city, usState.properties.name)}
              </button>
            ))}
          </nav>
        </div>

        <aside className={`border-t border-line bg-white p-5 lg:border-l lg:border-t-0 ${entered ? "animate-[fadein_.5s_ease]" : "hidden"}`}>
          <LevelPanel level={level} city={city} stateName={usState.properties.name} stateCities={stateCities} onPick={pickCity} onExplore={onExplore} />
        </aside>
      </div>
    </section>
  );
}

function LevelPanel({
  level,
  city,
  stateName,
  stateCities,
  onPick,
  onExplore,
}: {
  level: Level;
  city: City | null;
  stateName: string;
  stateCities: City[];
  onPick: (id: string) => void;
  onExplore: (id: string) => void;
}) {
  const sens: Official[] = senators(stateName).map((m) => ({ role: "U.S. Senator", name: m.name, party: m.party }));
  if (level === "nation")
    return (
      <Panel kicker="National" title={NATION.name} officials={NATION.officials} issues={NATION.issues} callout={NATION.callout}>
        <p className="text-xs text-muted">
          Click any state to see its senators and House delegation. Green states have cities with live meeting
          calendars.
        </p>
      </Panel>
    );
  if (level === "state" || !city) {
    const ca = stateName === CALIFORNIA.name;
    const reps = house(stateName);
    return (
      <Panel
        kicker="State"
        title={stateName}
        officials={ca ? CALIFORNIA.officials : sens}
        issues={ca ? CALIFORNIA.issues : []}
        callout={ca ? CALIFORNIA.callout : undefined}
      >
        {reps.length > 0 && (
          <p className="mb-4 text-xs text-muted">
            Integrity Index scores {reps.length} of {stateName}&apos;s current U.S. House members. Their average:{" "}
            <b className="text-foreground">{Math.round(reps.reduce((n, m) => n + m.score, 0) / reps.length)}</b>/100.
          </p>
        )}
        {stateCities.length > 0 ? (
          <>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">Cities with live calendars</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {stateCities.map((c) => (
                <button key={c.id} onClick={() => onPick(c.id)} className="rounded-full border border-line px-2.5 py-1 text-xs hover:border-accent">
                  {c.name} →
                </button>
              ))}
            </div>
          </>
        ) : (
          <p className="text-xs text-muted">No {stateName} cities on BeInvolved yet. Your senators and House members still vote on your behalf.</p>
        )}
      </Panel>
    );
  }
  if (level === "district" && city.countyFips && city.rep)
    return (
      <Panel
        kicker={`District ${city.district} · ${city.county}`}
        title={`${city.county}`}
        officials={[city.rep, ...sens]}
        issues={COUNTY_ISSUES[city.countyFips] ?? []}
      >
        <Events cityId={city.id} cityName={city.name} />
        <p className="text-xs text-muted">Your House member votes on federal laws; your senators represent all of {stateName}.</p>
      </Panel>
    );
  return (
    <Panel
      kicker={`City · ${city.county ?? stateName}`}
      title={city.name}
      officials={[...(city.local ?? []), ...(city.rep ? [city.rep] : []), ...(city.rep ? [] : sens)]}
      issues={city.issues ?? []}
    >
      <Events cityId={city.id} cityName={city.name} />
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
              <IntegrityBadge name={o.name} />
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

function Events({ cityId, cityName }: { cityId: string; cityName: string }) {
  const [events, setEvents] = useState<CivicEvent[] | null>(null);
  useEffect(() => {
    let live = true;
    setEvents(null);
    fetch(`/api/events?city=${cityId}`)
      .then((r) => r.json())
      .then((d) => live && setEvents(d.events ?? []))
      .catch(() => live && setEvents([]));
    return () => {
      live = false;
    };
  }, [cityId]);

  return (
    <div className="mb-5">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">Upcoming meetings you can attend</p>
      {events === null && <p className="mt-2 text-xs text-muted">Checking {cityName}&apos;s meeting calendar…</p>}
      {events?.length === 0 && <p className="mt-2 text-xs text-muted">No upcoming meetings posted yet.</p>}
      <ul className="mt-2 space-y-2">
        {events?.map((e) => (
          <li key={`${e.date}${e.name}`} className="flex gap-3 rounded-lg border border-line p-2.5">
            <div className="w-11 shrink-0 text-center leading-tight">
              <p className="text-[10px] font-semibold uppercase text-accent">
                {new Date(e.date + "T12:00:00").toLocaleDateString(undefined, { month: "short" })}
              </p>
              <p className="font-serif text-xl">{Number(e.date.slice(8, 10))}</p>
            </div>
            <div className="min-w-0 text-xs">
              <p className="font-medium text-foreground">
                {e.url ? (
                  <a href={e.url} target="_blank" rel="noreferrer" className="hover:text-accent hover:underline">
                    {e.name} ↗
                  </a>
                ) : (
                  e.name
                )}
              </p>
              <p className="mt-0.5 text-muted">
                {new Date(e.date + "T12:00:00").toLocaleDateString(undefined, { weekday: "long" })}
                {e.time ? ` · ${e.time}` : ""}
              </p>
              {e.location && <p className="truncate text-muted">{e.location}</p>}
            </div>
          </li>
        ))}
      </ul>
      <p className="mt-2 text-[11px] text-muted">Open to the public. Most also take comments in person or on Zoom.</p>
    </div>
  );
}

function IntegrityBadge({ name }: { name: string }) {
  const ii = integrity(name);
  if (!ii) return null;
  return (
    <a
      href={ii.url}
      target="_blank"
      rel="noreferrer"
      title="Financial integrity score from Integrity Index (integrityindex.us)"
      className="mt-0.5 block text-[11px] font-normal text-muted hover:text-accent"
    >
      Integrity Index {Math.round(ii.score)}/100 · {grade(ii.score)} ↗
    </a>
  );
}

function abbr(state: string) {
  const m: Record<string, string> = {
    California: "CA", Washington: "WA", Arizona: "AZ", Colorado: "CO", Texas: "TX", Missouri: "MO",
    Wisconsin: "WI", Ohio: "OH", Pennsylvania: "PA", Maryland: "MD", Massachusetts: "MA",
  };
  return m[state] ?? state;
}

function levelLabel(l: Level, city: City | null, stateName: string) {
  if (l === "nation") return "National";
  if (l === "state") return stateName;
  if (l === "district") return city?.county ? `${city.district} · ${city.county.replace(" County", "")}` : "District";
  return city ? city.name : "City";
}

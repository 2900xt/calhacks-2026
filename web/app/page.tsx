"use client";

import { useEffect, useMemo, useState } from "react";
import type { AgendaMatch } from "@/lib/civic";
import { JURISDICTIONS } from "@/lib/civic-shared";
import { downloadIcs } from "@/lib/ics";

type ScanResult = {
  runUrl: string | null;
  items: AgendaMatch[];
  itemsScanned: number;
  demo?: boolean;
};

type AgentResult = {
  answer: string;
  toolCalls: { name: string; input: unknown }[];
};

const STARTER_INTERESTS = [
  "Bike lanes, traffic safety and street design",
  "Housing affordability and new apartments near UC Berkeley",
  "Police and public safety budget",
];

const ACTION_LABELS: Record<string, string> = {
  vote: "Vote",
  public_hearing: "Public hearing",
  consent: "Consent calendar",
  discussion: "Discussion",
  informational: "Info only",
  other: "Agenda item",
};

const PIPELINE = [
  { title: "Actor collects", body: "Legistar Web API + Berkeley eAgenda, normalized into one schema" },
  { title: "Dataset stores", body: "Every item lands in an Apify dataset with its staff report link" },
  { title: "Claude scores", body: "Relevance to your interests, plus a plain-English summary" },
  { title: "Agents & alerts", body: "Apify MCP for agents, Schedules + send-mail for weekly digests" },
];

export default function Home() {
  const [interests, setInterests] = useState<string[]>(STARTER_INTERESTS);
  const [draftInterest, setDraftInterest] = useState("");
  const [cities, setCities] = useState<string[]>(["berkeley", "oakland"]);
  const [scan, setScan] = useState<ScanResult | null>(null);
  const [scanning, setScanning] = useState(false);
  const [stage, setStage] = useState(-1);
  const [filter, setFilter] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!scanning) return;
    setStage(0);
    const t = setInterval(() => setStage((s) => Math.min(s + 1, 2)), 6000);
    return () => clearInterval(t);
  }, [scanning]);

  const visible = useMemo(
    () => (scan?.items ?? []).filter((i) => !filter || i.matchedInterest === filter),
    [scan, filter],
  );

  const grouped = useMemo(() => {
    const byDate = new Map<string, AgendaMatch[]>();
    for (const item of visible) byDate.set(item.meetingDate, [...(byDate.get(item.meetingDate) ?? []), item]);
    return [...byDate.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [visible]);

  const interestCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const i of scan?.items ?? []) if (i.matchedInterest) counts.set(i.matchedInterest, (counts.get(i.matchedInterest) ?? 0) + 1);
    return [...counts.entries()].sort((a, b) => b[1] - a[1]);
  }, [scan]);

  function addInterest() {
    const value = draftInterest.trim();
    if (value && !interests.includes(value)) setInterests([...interests, value]);
    setDraftInterest("");
  }

  async function runScan() {
    setScanning(true);
    setError(null);
    setFilter(null);
    try {
      const res = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ interests, jurisdictions: cities }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setScan(data);
      setStage(3);
    } catch (e) {
      setError((e as Error).message);
      setStage(-1);
    } finally {
      setScanning(false);
    }
  }

  return (
    <div className="min-h-screen">
      <nav className="border-b border-line bg-surface/70 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 sm:px-6">
          <Logo />
          <span className="font-semibold tracking-tight">CivicSignal</span>
          <span className="ml-auto hidden rounded-full border border-line px-3 py-1 text-xs text-muted sm:inline">
            Built on <b className="text-foreground">Apify</b> · scored by <b className="text-foreground">Claude</b>
          </span>
          <a
            href="https://github.com/2900xt/calhacks-2026"
            target="_blank"
            rel="noreferrer"
            className="ml-auto text-sm text-muted hover:text-foreground sm:ml-0"
          >
            GitHub ↗
          </a>
        </div>
      </nav>

      <main className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
        <header className="grid gap-8 py-12 md:grid-cols-[1.3fr_1fr] md:items-end">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full bg-accent-soft px-3 py-1 text-xs font-medium text-accent">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent" /> Watching Bay Area city councils
            </p>
            <h1 className="mt-4 text-4xl font-semibold leading-[1.1] tracking-tight sm:text-5xl">
              Know what your city will decide, <span className="text-accent">before the vote.</span>
            </h1>
            <p className="mt-4 max-w-xl text-lg text-muted">
              City councils publish hundreds of agenda items a month across scattered PDFs and portals. CivicSignal
              reads them all and tells you which ones touch your life.
            </p>
          </div>
          <dl className="grid grid-cols-3 gap-3">
            <Stat value="6" label="cities preset" />
            <Stat value="2" label="agenda platforms" />
            <Stat value={scan ? String(scan.itemsScanned) : "200+"} label="items per scan" />
          </dl>
        </header>

        <section className="grid gap-6 rounded-3xl border border-line bg-surface p-5 shadow-sm sm:p-7 md:grid-cols-[1.4fr_1fr]">
          <div>
            <Label n={1}>What do you care about?</Label>
            <ul className="mt-3 flex flex-wrap gap-2">
              {interests.map((i) => (
                <li key={i} className="flex items-center gap-2 rounded-full bg-accent-soft px-3 py-1.5 text-sm">
                  {i}
                  <button
                    aria-label={`Remove ${i}`}
                    className="text-muted hover:text-foreground"
                    onClick={() => setInterests(interests.filter((x) => x !== i))}
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
            <div className="mt-3 flex gap-2">
              <input
                value={draftInterest}
                onChange={(e) => setDraftInterest(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addInterest()}
                placeholder="Add one: rent control, tree canopy, homeless services…"
                className="min-w-0 flex-1 rounded-xl border border-line bg-background px-3 py-2.5 text-sm outline-none focus:border-accent"
              />
              <button onClick={addInterest} className="rounded-xl border border-line px-4 text-sm hover:border-accent">
                Add
              </button>
            </div>
          </div>
          <div>
            <Label n={2}>Which cities?</Label>
            <div className="mt-3 flex flex-wrap gap-2">
              {JURISDICTIONS.map((j) => {
                const on = cities.includes(j.id);
                return (
                  <button
                    key={j.id}
                    onClick={() => setCities(on ? cities.filter((c) => c !== j.id) : [...cities, j.id])}
                    className={`rounded-full border px-3 py-1.5 text-sm transition ${
                      on ? "border-accent bg-accent text-surface" : "border-line hover:border-accent"
                    }`}
                  >
                    {j.name}
                  </button>
                );
              })}
            </div>
            <p className="mt-2 text-xs text-muted">Any other Legistar city works too, via the Actor input.</p>
            <button
              onClick={runScan}
              disabled={scanning || !interests.length || !cities.length}
              className="mt-5 w-full rounded-xl bg-foreground px-4 py-3 text-sm font-medium text-background transition hover:opacity-90 disabled:opacity-50"
            >
              {scanning ? "Running the CivicSignal Actor…" : "Scan upcoming agendas →"}
            </button>
          </div>
        </section>

        <ol className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {PIPELINE.map((p, i) => {
            const state = stage < 0 ? "idle" : i < stage || stage === 3 ? "done" : i === stage ? "active" : "idle";
            return (
              <li
                key={p.title}
                className={`rounded-2xl border p-4 transition ${
                  state === "active"
                    ? "border-accent bg-accent-soft"
                    : state === "done"
                      ? "border-line bg-surface"
                      : "border-dashed border-line"
                }`}
              >
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <span
                    className={`grid h-6 w-6 place-items-center rounded-full text-xs ${
                      state === "done" ? "bg-accent text-surface" : "bg-line text-muted"
                    } ${state === "active" ? "animate-pulse" : ""}`}
                  >
                    {state === "done" ? "✓" : i + 1}
                  </span>
                  {p.title}
                </div>
                <p className="mt-2 text-xs leading-relaxed text-muted">{p.body}</p>
              </li>
            );
          })}
        </ol>

        {error && <p className="mt-6 rounded-xl bg-warn-soft px-4 py-3 text-sm text-warn">{error}</p>}

        {scanning && !scan && (
          <div className="mt-10 space-y-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-28 animate-pulse rounded-2xl border border-line bg-surface" />
            ))}
          </div>
        )}

        {scan && (
          <section className="mt-12">
            {scan.demo && (
              <p className="mb-4 rounded-xl bg-warn-soft px-4 py-3 text-sm text-warn">
                Showing a recorded run because this server has no Apify credentials yet. Add APIFY_TOKEN and
                APIFY_ACTOR_ID to run it live.
              </p>
            )}
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="text-2xl font-semibold tracking-tight">{scan.items.length} items worth your attention</h2>
                <p className="text-sm text-muted">
                  out of {scan.itemsScanned} agenda items the Actor read
                  {scan.runUrl && (
                    <>
                      {" · "}
                      <a href={scan.runUrl} target="_blank" rel="noreferrer" className="text-accent underline">
                        open the Apify run ↗
                      </a>
                    </>
                  )}
                </p>
              </div>
              {scan.items.length > 0 && (
                <button
                  onClick={() => downloadIcs(scan.items)}
                  className="rounded-xl border border-line bg-surface px-3 py-2 text-sm hover:border-accent"
                >
                  📅 Add meetings to calendar
                </button>
              )}
            </div>

            {interestCounts.length > 1 && (
              <div className="mt-4 flex flex-wrap gap-2">
                <FilterChip on={!filter} onClick={() => setFilter(null)}>
                  All ({scan.items.length})
                </FilterChip>
                {interestCounts.map(([name, n]) => (
                  <FilterChip key={name} on={filter === name} onClick={() => setFilter(name)}>
                    {name} ({n})
                  </FilterChip>
                ))}
              </div>
            )}

            <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_320px]">
              <div>
                {grouped.length === 0 && <p className="text-muted">Nothing on upcoming agendas matches.</p>}
                {grouped.map(([day, items]) => (
                  <div key={day} className="mb-8">
                    <h3 className="sticky top-0 z-10 bg-background/90 py-2 text-sm font-semibold text-muted backdrop-blur">
                      {new Date(day + "T12:00:00").toLocaleDateString(undefined, {
                        weekday: "long",
                        month: "long",
                        day: "numeric",
                      })}
                      <span className="ml-2 font-normal">· {daysUntil(day)}</span>
                    </h3>
                    <div className="mt-2 space-y-3">
                      {items.map((item) => (
                        <ItemCard key={item.itemId} item={item} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start">
                <WatchPanel interests={interests} cities={cities} disabled={!!scan.demo} />
                <ConnectPanel />
              </aside>
            </div>
          </section>
        )}

        <AgentPanel interests={interests} cities={cities} />

        <footer className="mt-14 flex flex-wrap gap-x-6 gap-y-2 border-t border-line pt-6 text-xs text-muted">
          <span>Agenda data: Legistar Web API and berkeleyca.gov, collected by the CivicSignal Apify Actor.</span>
          <span>Relevance is Claude&apos;s judgment. Check the linked source before acting.</span>
        </footer>
      </main>
    </div>
  );
}

function ItemCard({ item }: { item: AgendaMatch }) {
  const [open, setOpen] = useState(false);
  const [stance, setStance] = useState("");
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const pct = Math.round(item.relevance * 100);

  async function draftComment() {
    setBusy(true);
    try {
      const res = await fetch("/api/comment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ item, stance }),
      });
      const data = await res.json();
      setDraft(res.ok ? data.draft : data.error);
    } finally {
      setBusy(false);
    }
  }

  return (
    <article className="group rounded-2xl border border-line bg-surface p-5 transition hover:border-accent/50 hover:shadow-sm">
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="rounded-full bg-background px-2 py-0.5 font-medium">{item.jurisdictionName}</span>
        <span className="rounded-full border border-line px-2 py-0.5">
          {ACTION_LABELS[item.actionType ?? "other"] ?? item.actionType}
        </span>
        <span className="ml-auto flex items-center gap-2 text-muted">
          <span className="h-1.5 w-16 overflow-hidden rounded-full bg-line">
            <span className="block h-full rounded-full bg-accent" style={{ width: `${pct}%` }} />
          </span>
          {pct}%
        </span>
      </div>
      <p className="mt-3 text-[15px] font-medium leading-snug">{item.plainSummary ?? item.title}</p>
      {item.reason && <p className="mt-1.5 text-sm text-muted">{item.reason}</p>}
      {item.matchedInterest && (
        <p className="mt-3 inline-block rounded-md bg-accent-soft px-2 py-0.5 text-xs text-accent">
          {item.matchedInterest}
        </p>
      )}
      <p className="mt-3 text-xs text-muted">
        {item.body}
        {item.section ? ` · ${item.section}` : ""}
        {item.itemNumber ? ` · item ${item.itemNumber}` : ""}
      </p>
      <div className="mt-3 flex flex-wrap gap-4 text-sm">
        {item.documentUrl && (
          <a href={item.documentUrl} target="_blank" rel="noreferrer" className="font-medium text-accent hover:underline">
            Staff report ↗
          </a>
        )}
        {item.agendaUrl && item.agendaUrl !== item.documentUrl && (
          <a href={item.agendaUrl} target="_blank" rel="noreferrer" className="text-accent hover:underline">
            Full agenda ↗
          </a>
        )}
        <button onClick={() => setOpen(!open)} className="text-accent hover:underline">
          {open ? "Close" : "✍ Write a public comment"}
        </button>
      </div>
      {open && (
        <div className="mt-4 space-y-2 rounded-xl bg-background p-3">
          <textarea
            value={stance}
            onChange={(e) => setStance(e.target.value)}
            placeholder="What do you think? e.g. I support this because I bike down Adeline every day."
            className="h-20 w-full rounded-lg border border-line bg-surface p-2 text-sm outline-none focus:border-accent"
          />
          <button
            onClick={draftComment}
            disabled={busy || !stance.trim()}
            className="rounded-lg bg-foreground px-3 py-1.5 text-sm text-background disabled:opacity-50"
          >
            {busy ? "Drafting with Claude…" : "Draft my comment"}
          </button>
          {draft && (
            <div>
              <pre className="whitespace-pre-wrap rounded-lg bg-surface p-3 font-sans text-sm">{draft}</pre>
              <button
                onClick={() => navigator.clipboard.writeText(draft)}
                className="mt-2 text-xs text-accent hover:underline"
              >
                Copy to clipboard
              </button>
            </div>
          )}
        </div>
      )}
    </article>
  );
}

function WatchPanel({ interests, cities, disabled }: { interests: string[]; cities: string[]; disabled: boolean }) {
  const [email, setEmail] = useState("");
  const [cadence, setCadence] = useState("weekly");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ label: string; scheduleUrl: string; taskUrl: string } | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function watch() {
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/watch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ interests, jurisdictions: cities, email, cadence }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResult(data);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-2xl border border-line bg-surface p-5">
      <h3 className="font-semibold">Keep watching for me</h3>
      <p className="mt-1 text-sm text-muted">
        Saves these interests as an Apify Task on a Schedule. New matches arrive by email through the{" "}
        <code className="text-xs">apify/send-mail</code> Actor.
      </p>
      {result ? (
        <div className="mt-4 rounded-xl bg-accent-soft p-3 text-sm">
          <p className="font-medium text-accent">Watching {result.label}.</p>
          <div className="mt-2 flex gap-3">
            <a href={result.scheduleUrl} target="_blank" rel="noreferrer" className="text-accent underline">
              Schedule ↗
            </a>
            <a href={result.taskUrl} target="_blank" rel="noreferrer" className="text-accent underline">
              Task ↗
            </a>
          </div>
        </div>
      ) : (
        <div className="mt-4 space-y-2">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full rounded-xl border border-line bg-background px-3 py-2 text-sm outline-none focus:border-accent"
          />
          <div className="flex gap-2">
            {["weekly", "daily"].map((c) => (
              <button
                key={c}
                onClick={() => setCadence(c)}
                className={`flex-1 rounded-lg border px-3 py-1.5 text-sm capitalize ${
                  cadence === c ? "border-accent bg-accent-soft text-accent" : "border-line"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
          <button
            onClick={watch}
            disabled={busy || disabled || !email}
            className="w-full rounded-xl bg-accent px-3 py-2 text-sm font-medium text-surface disabled:opacity-50"
          >
            {busy ? "Creating schedule…" : "Start watching"}
          </button>
          {disabled && <p className="text-xs text-muted">Available once Apify credentials are set.</p>}
          {err && <p className="text-xs text-warn">{err}</p>}
        </div>
      )}
    </div>
  );
}

function AgentPanel({ interests, cities }: { interests: string[]; cities: string[] }) {
  const [question, setQuestion] = useState("What's coming up about housing in the next few weeks?");
  const [asking, setAsking] = useState(false);
  const [agent, setAgent] = useState<AgentResult | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const suggestions = [
    "What's coming up about housing in the next few weeks?",
    "Is anything about bike lanes being voted on soon?",
    "Summarize the police budget items and how to comment on them.",
  ];

  async function ask(q = question) {
    setAsking(true);
    setErr(null);
    setAgent(null);
    try {
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q, interests, jurisdictions: cities }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setAgent(data);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setAsking(false);
    }
  }

  return (
    <section className="mt-14 overflow-hidden rounded-3xl border border-line bg-surface">
      <div className="border-b border-line bg-accent-soft/60 px-5 py-4 sm:px-7">
        <h2 className="text-lg font-semibold">Ask the CivicSignal agent</h2>
        <p className="text-sm text-muted">
          Claude connects to <code className="text-xs">mcp.apify.com</code>, runs the CivicSignal Actor as a tool, and
          opens staff reports with <code className="text-xs">apify/web-fetch</code> to answer.
        </p>
      </div>
      <div className="p-5 sm:p-7">
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !asking && ask()}
            className="min-w-0 flex-1 rounded-xl border border-line bg-background px-3 py-2.5 text-sm outline-none focus:border-accent"
          />
          <button
            onClick={() => ask()}
            disabled={asking}
            className="rounded-xl bg-foreground px-5 py-2.5 text-sm font-medium text-background disabled:opacity-50"
          >
            {asking ? "Working…" : "Ask"}
          </button>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {suggestions.map((s) => (
            <button
              key={s}
              onClick={() => {
                setQuestion(s);
                ask(s);
              }}
              disabled={asking}
              className="rounded-full border border-line px-3 py-1 text-xs text-muted hover:border-accent hover:text-foreground"
            >
              {s}
            </button>
          ))}
        </div>
        {asking && (
          <p className="mt-5 flex items-center gap-2 text-sm text-muted">
            <span className="h-2 w-2 animate-ping rounded-full bg-accent" /> Calling Apify tools over MCP…
          </p>
        )}
        {err && <p className="mt-4 rounded-xl bg-warn-soft px-4 py-3 text-sm text-warn">{err}</p>}
        {agent && (
          <div className="mt-5">
            {agent.toolCalls.length > 0 && (
              <ol className="mb-4 flex flex-wrap items-center gap-2 text-xs">
                {agent.toolCalls.map((t, i) => (
                  <li key={i} className="flex items-center gap-2">
                    {i > 0 && <span className="text-muted">→</span>}
                    <span className="rounded-md border border-line bg-background px-2 py-1 font-mono">{t.name}</span>
                  </li>
                ))}
              </ol>
            )}
            <div className="whitespace-pre-wrap text-sm leading-relaxed">{agent.answer}</div>
          </div>
        )}
      </div>
    </section>
  );
}

function ConnectPanel() {
  const actor = process.env.NEXT_PUBLIC_APIFY_ACTOR_ID ?? "<username>/civicsignal";
  const [user, name] = actor.split("/");
  const endpoints = [
    { label: "Apify MCP server", url: `https://mcp.apify.com?tools=${actor}` },
    { label: "CivicSignal's own MCP (Standby)", url: `https://${user}--${name}.apify.actor/mcp` },
  ];
  const [copied, setCopied] = useState<string | null>(null);

  return (
    <div className="rounded-2xl border border-line bg-surface p-5">
      <h3 className="font-semibold">Use it from your own agent</h3>
      <p className="mt-1 text-sm text-muted">
        CivicSignal is an MCP tool. Add either endpoint to Claude, Cursor or any MCP client.
      </p>
      <ul className="mt-3 space-y-2">
        {endpoints.map((e) => (
          <li key={e.url}>
            <p className="text-xs text-muted">{e.label}</p>
            <button
              onClick={() => {
                navigator.clipboard.writeText(e.url);
                setCopied(e.url);
              }}
              className="mt-1 w-full truncate rounded-lg border border-line bg-background px-2 py-1.5 text-left font-mono text-xs hover:border-accent"
              title="Copy"
            >
              {copied === e.url ? "Copied ✓" : e.url}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-4">
      <dt className="sr-only">{label}</dt>
      <dd className="text-2xl font-semibold tracking-tight">{value}</dd>
      <dd className="text-xs text-muted">{label}</dd>
    </div>
  );
}

function Label({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <h2 className="flex items-center gap-2 text-sm font-semibold">
      <span className="grid h-5 w-5 place-items-center rounded-full bg-foreground text-[11px] text-background">{n}</span>
      {children}
    </h2>
  );
}

function FilterChip({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full border px-3 py-1 text-xs transition ${
        on ? "border-foreground bg-foreground text-background" : "border-line text-muted hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

function Logo() {
  return (
    <svg width="26" height="26" viewBox="0 0 32 32" aria-hidden>
      <rect width="32" height="32" rx="8" className="fill-accent" />
      <path d="M8 22V13l8-5 8 5v9" fill="none" stroke="white" strokeWidth="2" strokeLinejoin="round" />
      <path d="M12 22v-5M16 22v-7M20 22v-5" stroke="white" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function daysUntil(day: string) {
  const diff = Math.round((new Date(day + "T12:00:00").getTime() - Date.now()) / 86_400_000);
  if (diff <= 0) return "today";
  if (diff === 1) return "tomorrow";
  return `in ${diff} days`;
}

"use client";

import { useMemo, useState } from "react";
import type { AgendaMatch } from "@/lib/civic";
import { JURISDICTIONS } from "@/lib/civic-shared";

type ScanResult = {
  runUrl: string;
  items: AgendaMatch[];
  itemsScanned: number;
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
  other: "Item",
};

export default function Home() {
  const [interests, setInterests] = useState<string[]>(STARTER_INTERESTS);
  const [draftInterest, setDraftInterest] = useState("");
  const [cities, setCities] = useState<string[]>(["berkeley", "oakland"]);
  const [scan, setScan] = useState<ScanResult | null>(null);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [question, setQuestion] = useState("What's coming up about housing in the next few weeks?");
  const [asking, setAsking] = useState(false);
  const [agent, setAgent] = useState<AgentResult | null>(null);

  const grouped = useMemo(() => {
    const byDate = new Map<string, AgendaMatch[]>();
    for (const item of scan?.items ?? []) {
      const key = item.meetingDate;
      byDate.set(key, [...(byDate.get(key) ?? []), item]);
    }
    return [...byDate.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [scan]);

  function addInterest() {
    const value = draftInterest.trim();
    if (value && !interests.includes(value)) setInterests([...interests, value]);
    setDraftInterest("");
  }

  async function runScan() {
    setScanning(true);
    setError(null);
    try {
      const res = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ interests, jurisdictions: cities }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setScan(data);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setScanning(false);
    }
  }

  async function ask() {
    setAsking(true);
    setError(null);
    setAgent(null);
    try {
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, interests, jurisdictions: cities }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setAgent(data);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setAsking(false);
    }
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <header className="mb-10">
        <p className="text-sm font-medium tracking-wide text-accent">CIVICSIGNAL</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
          Know what your city council will decide, before the vote.
        </h1>
        <p className="mt-3 max-w-2xl text-muted">
          CivicSignal reads every upcoming agenda across Bay Area city councils, finds the items that touch what you
          care about, and tells you in plain English, with the staff report one click away.
        </p>
      </header>

      <section className="grid gap-6 rounded-2xl border border-line bg-surface p-5 sm:p-6 md:grid-cols-[1.4fr_1fr]">
        <div>
          <h2 className="text-sm font-semibold text-muted">What do you care about?</h2>
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
              placeholder="e.g. Rent control, tree canopy, school start times"
              className="min-w-0 flex-1 rounded-lg border border-line bg-background px-3 py-2 text-sm outline-none focus:border-accent"
            />
            <button onClick={addInterest} className="rounded-lg border border-line px-3 py-2 text-sm hover:border-accent">
              Add
            </button>
          </div>
        </div>
        <div>
          <h2 className="text-sm font-semibold text-muted">Where?</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {JURISDICTIONS.map((j) => {
              const on = cities.includes(j.id);
              return (
                <button
                  key={j.id}
                  onClick={() => setCities(on ? cities.filter((c) => c !== j.id) : [...cities, j.id])}
                  className={`rounded-full border px-3 py-1.5 text-sm ${
                    on ? "border-accent bg-accent text-surface" : "border-line hover:border-accent"
                  }`}
                >
                  {j.name}
                </button>
              );
            })}
          </div>
          <button
            onClick={runScan}
            disabled={scanning || !interests.length || !cities.length}
            className="mt-5 w-full rounded-lg bg-foreground px-4 py-2.5 text-sm font-medium text-background disabled:opacity-50"
          >
            {scanning ? "Reading agendas on Apify…" : "Scan upcoming agendas"}
          </button>
        </div>
      </section>

      {error && <p className="mt-4 rounded-lg bg-warn-soft px-4 py-3 text-sm text-warn">{error}</p>}

      {scan && (
        <section className="mt-10">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-xl font-semibold">
              {scan.items.length} items to watch
              <span className="ml-2 text-base font-normal text-muted">of {scan.itemsScanned} agenda items read</span>
            </h2>
            <a href={scan.runUrl} target="_blank" rel="noreferrer" className="text-sm text-accent underline">
              View the Apify run ↗
            </a>
          </div>
          {grouped.length === 0 && <p className="mt-4 text-muted">Nothing on upcoming agendas matches your interests.</p>}
          {grouped.map(([day, items]) => (
            <div key={day} className="mt-6">
              <h3 className="text-sm font-semibold text-muted">
                {new Date(day + "T12:00:00").toLocaleDateString(undefined, {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                })}
              </h3>
              <div className="mt-2 space-y-3">
                {items.map((item) => (
                  <ItemCard key={item.itemId} item={item} />
                ))}
              </div>
            </div>
          ))}
        </section>
      )}

      <section className="mt-12 rounded-2xl border border-line bg-surface p-5 sm:p-6">
        <h2 className="text-lg font-semibold">Ask the CivicSignal agent</h2>
        <p className="mt-1 text-sm text-muted">
          Claude calls the CivicSignal Actor through Apify&apos;s MCP server, then reads the source documents to answer.
        </p>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !asking && ask()}
            className="min-w-0 flex-1 rounded-lg border border-line bg-background px-3 py-2 text-sm outline-none focus:border-accent"
          />
          <button
            onClick={ask}
            disabled={asking}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-surface disabled:opacity-50"
          >
            {asking ? "Agent is working…" : "Ask"}
          </button>
        </div>
        {agent && (
          <div className="mt-5">
            {agent.toolCalls.length > 0 && (
              <div className="mb-3 flex flex-wrap gap-2">
                {agent.toolCalls.map((t, i) => (
                  <span key={i} className="rounded-md bg-accent-soft px-2 py-1 font-mono text-xs">
                    apify · {t.name}
                  </span>
                ))}
              </div>
            )}
            <div className="whitespace-pre-wrap text-sm leading-relaxed">{agent.answer}</div>
          </div>
        )}
      </section>

      <footer className="mt-12 text-xs text-muted">
        Agenda data from the Legistar Web API and berkeleyca.gov, collected by the CivicSignal Apify Actor. Always check
        the linked source before acting.
      </footer>
    </main>
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
    <article className="rounded-xl border border-line bg-surface p-4">
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className={`rounded-full px-2 py-0.5 font-medium ${pct >= 75 ? "bg-accent text-surface" : "bg-accent-soft"}`}>
          {pct}% match
        </span>
        {item.matchedInterest && <span className="text-muted">{item.matchedInterest}</span>}
        <span className="ml-auto rounded-full border border-line px-2 py-0.5">
          {ACTION_LABELS[item.actionType ?? "other"] ?? item.actionType}
        </span>
      </div>
      <p className="mt-2 font-medium">{item.plainSummary ?? item.title}</p>
      {item.reason && <p className="mt-1 text-sm text-muted">{item.reason}</p>}
      <p className="mt-2 text-xs text-muted">
        {item.jurisdictionName} · {item.body}
        {item.section ? ` · ${item.section}` : ""}
        {item.itemNumber ? ` #${item.itemNumber}` : ""}
      </p>
      <div className="mt-3 flex flex-wrap gap-3 text-sm">
        {item.documentUrl && (
          <a href={item.documentUrl} target="_blank" rel="noreferrer" className="text-accent underline">
            Staff report
          </a>
        )}
        {item.agendaUrl && item.agendaUrl !== item.documentUrl && (
          <a href={item.agendaUrl} target="_blank" rel="noreferrer" className="text-accent underline">
            Full agenda
          </a>
        )}
        <button onClick={() => setOpen(!open)} className="text-accent underline">
          {open ? "Close" : "Write a public comment"}
        </button>
      </div>
      {open && (
        <div className="mt-3 space-y-2">
          <textarea
            value={stance}
            onChange={(e) => setStance(e.target.value)}
            placeholder="What do you think? e.g. I support this because I bike down Adeline every day."
            className="h-20 w-full rounded-lg border border-line bg-background p-2 text-sm outline-none focus:border-accent"
          />
          <button
            onClick={draftComment}
            disabled={busy || !stance.trim()}
            className="rounded-lg bg-foreground px-3 py-1.5 text-sm text-background disabled:opacity-50"
          >
            {busy ? "Drafting…" : "Draft it"}
          </button>
          {draft && <pre className="whitespace-pre-wrap rounded-lg bg-background p-3 font-sans text-sm">{draft}</pre>}
        </div>
      )}
    </article>
  );
}

"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { AgendaMatch } from "@/lib/civic";
import { COMMENT_EMAIL, JURISDICTIONS, TOPICS } from "@/lib/civic-shared";
import { downloadIcs } from "@/lib/ics";
import { MapExplorer } from "./map-explorer";

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

type Step = "show" | "speak" | "follow";

const ACTION_LABELS: Record<string, string> = {
  vote: "Council vote",
  public_hearing: "Public hearing",
  consent: "Consent calendar",
  discussion: "Discussion",
  informational: "Report",
  other: "Agenda item",
};

const LOADING = ["Reading city council agendas…", "Checking every item against what you care about…", "Finding ways you can weigh in…"];

const TOP_N = 4;

export default function Home() {
  const [cities, setCities] = useState<string[]>(["berkeley"]);
  const [topics, setTopics] = useState<string[]>([TOPICS[0].interest, TOPICS[1].interest]);
  const [custom, setCustom] = useState("");
  const [scan, setScan] = useState<ScanResult | null>(null);
  const [scanning, setScanning] = useState(false);
  const [stage, setStage] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [done, setDone] = useState<Record<string, Step[]>>({});

  useEffect(() => {
    if (!scanning) return;
    setStage(0);
    const t = setInterval(() => setStage((s) => Math.min(s + 1, LOADING.length - 1)), 5000);
    return () => clearInterval(t);
  }, [scanning]);

  const items = useMemo(
    () => [...(scan?.items ?? [])].sort((a, b) => b.relevance - a.relevance || a.meetingDate.localeCompare(b.meetingDate)),
    [scan],
  );
  const shown = showAll ? items : items.slice(0, TOP_N);
  const actions = Object.values(done).reduce((n, steps) => n + steps.length, 0);
  const cityNames = cities.map((c) => JURISDICTIONS.find((j) => j.id === c)?.name ?? c);

  function toggle<T>(list: T[], value: T) {
    return list.includes(value) ? list.filter((x) => x !== value) : [...list, value];
  }

  function addCustom() {
    const value = custom.trim();
    if (value && !topics.includes(value)) setTopics([...topics, value]);
    setCustom("");
  }

  function markDone(itemId: string, step: Step) {
    setDone((d) => ({ ...d, [itemId]: d[itemId]?.includes(step) ? d[itemId] : [...(d[itemId] ?? []), step] }));
  }

  async function findWays(only?: string[]) {
    const jurisdictions = only ?? cities;
    setScanning(true);
    setError(null);
    setShowAll(false);
    try {
      const res = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ interests: topics, jurisdictions }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setScan(data);
      setTimeout(() => document.getElementById("results")?.scrollIntoView({ behavior: "smooth" }), 50);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setScanning(false);
    }
  }

  return (
    <div className="min-h-screen">
      <nav className="border-b border-line bg-surface/70 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3 sm:px-6">
          <Logo />
          <span className="font-semibold tracking-tight">BeInvolved</span>
          <div className="ml-auto flex items-center gap-5 text-sm text-muted">
            <a href="#alerts" className="hidden hover:text-foreground sm:inline">
              Weekly alerts
            </a>
            <a href="#ask" className="hidden hover:text-foreground sm:inline">
              Ask
            </a>
            <Link href="/how-it-works" className="hover:text-foreground">
              How it works
            </Link>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-5xl px-4 pb-16 sm:px-6">
        <header className="pb-8 pt-10 sm:pt-12">
          <h1 className="font-serif max-w-3xl text-4xl font-medium leading-[1.08] tracking-tight sm:text-5xl">
            Your city decides things every week. <span className="text-accent">Have a say.</span>
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-muted">
            Find out who represents you, from city hall to Congress, and what they&apos;re deciding next.
          </p>
        </header>

        <MapExplorer
          onExplore={(id) => {
            setCities([id]);
            document.getElementById("find")?.scrollIntoView({ behavior: "smooth" });
            findWays([id]);
          }}
        />

        <ol className="mt-10 grid gap-3 sm:grid-cols-3">
          <Pillar icon="📍" title="Show up" body="Know when it's decided, and add the meeting to your calendar." />
          <Pillar icon="🎤" title="Speak up" body="Draft a public comment in your own words and send it to the clerk." />
          <Pillar icon="📬" title="Stay in the loop" body="Get a weekly email when your topics come up again." />
        </ol>

        <section id="find" className="mt-8 scroll-mt-6 rounded-xl border border-line bg-surface p-5 sm:p-8">
          <Label n={1}>Where do you live?</Label>
          <div className="mt-3 flex flex-wrap gap-2">
            {JURISDICTIONS.map((j) => (
              <Chip key={j.id} on={cities.includes(j.id)} onClick={() => setCities(toggle(cities, j.id))}>
                {j.name}
              </Chip>
            ))}
          </div>

          <div className="mt-7">
            <Label n={2}>What do you care about?</Label>
            <div className="mt-3 flex flex-wrap gap-2">
              {TOPICS.map((t) => (
                <Chip key={t.label} on={topics.includes(t.interest)} onClick={() => setTopics(toggle(topics, t.interest))}>
                  {t.label}
                </Chip>
              ))}
              {topics
                .filter((t) => !TOPICS.some((x) => x.interest === t))
                .map((t) => (
                  <Chip key={t} on onClick={() => setTopics(topics.filter((x) => x !== t))}>
                    {t} ×
                  </Chip>
                ))}
            </div>
            <div className="mt-3 flex max-w-xl gap-2">
              <input
                value={custom}
                onChange={(e) => setCustom(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addCustom()}
                placeholder="Something else? e.g. rent control, tree canopy, noise"
                className="min-w-0 flex-1 rounded-xl border border-line bg-background px-3 py-2.5 text-sm outline-none focus:border-accent"
              />
              <button onClick={addCustom} className="rounded-xl border border-line px-4 text-sm hover:border-accent">
                Add
              </button>
            </div>
          </div>

          <button
            onClick={() => findWays()}
            disabled={scanning || !topics.length || !cities.length}
            className="mt-8 w-full rounded-lg bg-accent px-5 py-4 text-base font-semibold text-surface transition hover:opacity-90 disabled:opacity-50 sm:w-auto"
          >
            {scanning ? LOADING[stage] : "Find ways to get involved →"}
          </button>
          {error && <p className="mt-4 rounded-xl bg-warn-soft px-4 py-3 text-sm text-warn">{error}</p>}
        </section>

        {scanning && !scan && (
          <div className="mt-10 space-y-4">
            {[0, 1].map((i) => (
              <div key={i} className="h-56 animate-pulse rounded-xl border border-line bg-surface" />
            ))}
          </div>
        )}

        {scan && (
          <section id="results" className="mt-14 scroll-mt-6">
            {scan.demo && (
              <p className="mb-4 rounded-xl bg-warn-soft px-4 py-3 text-sm text-warn">
                Showing a recorded example because this server isn&apos;t connected to Apify yet.
              </p>
            )}
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-accent">Coming up in {cityNames.join(" & ")}</p>
                <h2 className="font-serif mt-1 text-3xl font-medium tracking-tight">
                  {items.length === 0
                    ? "Nothing on your topics right now"
                    : `${items.length} decision${items.length === 1 ? "" : "s"} you can weigh in on`}
                </h2>
                <p className="mt-1 text-sm text-muted">
                  We read {scan.itemsScanned} upcoming agenda items so you don&apos;t have to.
                </p>
              </div>
              <ImpactMeter actions={actions} />
            </div>

            <div className="mt-8 space-y-5">
              {shown.map((item) => (
                <ActionCard
                  key={item.itemId}
                  item={item}
                  done={done[item.itemId] ?? []}
                  onDone={(step) => markDone(item.itemId, step)}
                />
              ))}
            </div>
            {items.length > TOP_N && (
              <button
                onClick={() => setShowAll(!showAll)}
                className="mt-5 w-full rounded-lg border border-dashed border-line py-3 text-sm text-muted hover:border-accent hover:text-foreground"
              >
                {showAll ? "Show fewer" : `Show ${items.length - TOP_N} more`}
              </button>
            )}
          </section>
        )}

        <WatchSection interests={topics} cities={cities} live={!!scan && !scan.demo} />

        <AgentSection interests={topics} cities={cities} />

        <section className="mt-16 grid gap-4 rounded-xl bg-soft border border-line p-6 sm:grid-cols-3 sm:p-8">
          <Fact title="It's your right" body="California's Brown Act guarantees the public a chance to comment at every city council meeting." />
          <Fact title="Before, not after" body="Agendas are posted days ahead. That window is when a comment can still change a vote." />
          <Fact title="Every word counts" body="Written comments become part of the public record that councilmembers see." />
        </section>

        <footer className="mt-14 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-line pt-6 text-xs text-muted">
          <span>Agenda data from Legistar and berkeleyca.gov, collected by the BeInvolved Apify Actor and explained by Claude.</span>
          <span>AI summaries can be wrong. Check the linked staff report before acting.</span>
          <Link href="/how-it-works" className="text-accent hover:underline">
            How it works →
          </Link>
        </footer>
      </main>
    </div>
  );
}

function ActionCard({ item, done, onDone }: { item: AgendaMatch; done: Step[]; onDone: (s: Step) => void }) {
  const [open, setOpen] = useState(false);
  const [stance, setStance] = useState("");
  const [name, setName] = useState("");
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const when = new Date(item.meetingDate + "T12:00:00").toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  const email = COMMENT_EMAIL[item.jurisdiction];
  const subject = draft.match(/^Subject:\s*(.+)$/m)?.[1] ?? `Public comment: ${item.title.slice(0, 80)}`;
  const body = draft.replace(/^Subject:.*\n+/m, "");

  async function draftComment() {
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/comment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ item, stance, name: name.trim() || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setDraft(data.draft);
      onDone("speak");
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <article className="overflow-hidden rounded-xl border border-line bg-surface">
      <div className="p-5 sm:p-7">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="rounded-full bg-foreground px-2.5 py-1 font-semibold text-background">
            {countdown(item.meetingDate)}
          </span>
          <span className="rounded-full border border-line px-2.5 py-1">{item.jurisdictionName}</span>
          <span className="rounded-full border border-line px-2.5 py-1">
            {ACTION_LABELS[item.actionType ?? "other"] ?? item.actionType}
          </span>
          {item.matchedInterest && (
            <span className="rounded-full bg-accent-soft px-2.5 py-1 text-accent">{topicLabel(item.matchedInterest)}</span>
          )}
        </div>
        <h3 className="font-serif mt-4 text-xl font-medium leading-snug tracking-tight">{item.plainSummary ?? item.title}</h3>
        {item.reason && <p className="mt-2 text-[15px] text-muted">{item.reason}</p>}
        <p className="mt-3 text-xs text-muted">
          {item.body} · {when}
          {item.itemNumber ? ` · item ${item.itemNumber}` : ""}
          {item.documentUrl && (
            <>
              {" · "}
              <a href={item.documentUrl} target="_blank" rel="noreferrer" className="text-accent hover:underline">
                Read the staff report ↗
              </a>
            </>
          )}
        </p>
      </div>

      <div className="grid border-t border-line sm:grid-cols-3">
        <LadderStep icon="📍" title="Show up" done={done.includes("show")}>
          <p className="text-xs text-muted">
            {when}
            {item.meetingTime ? ` · ${item.meetingTime}` : ""} · {item.body}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <SmallButton
              onClick={() => {
                downloadIcs([item]);
                onDone("show");
              }}
            >
              Add to calendar
            </SmallButton>
            {item.meetingUrl && (
              <a href={item.meetingUrl} target="_blank" rel="noreferrer" className="self-center text-xs text-accent hover:underline">
                Meeting info ↗
              </a>
            )}
          </div>
        </LadderStep>
        <LadderStep icon="🎤" title="Speak up" done={done.includes("speak")}>
          <p className="text-xs text-muted">Tell the council what you think before they vote.</p>
          <div className="mt-3">
            <SmallButton onClick={() => setOpen(!open)}>{open ? "Close" : "Write a comment"}</SmallButton>
          </div>
        </LadderStep>
        <LadderStep icon="📬" title="Stay in the loop" done={done.includes("follow")} last>
          <p className="text-xs text-muted">Get an email when this topic is on an agenda again.</p>
          <div className="mt-3">
            <SmallButton
              onClick={() => {
                onDone("follow");
                document.getElementById("alerts")?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              Get weekly alerts
            </SmallButton>
          </div>
        </LadderStep>
      </div>

      {open && (
        <div className="space-y-3 border-t border-line bg-background/60 p-5 sm:p-7">
          <label className="block text-sm font-medium">What do you think, and why does it matter to you?</label>
          <textarea
            value={stance}
            onChange={(e) => setStance(e.target.value)}
            placeholder="e.g. I support more housing here because I'm a student and rent near campus is out of reach."
            className="h-24 w-full rounded-xl border border-line bg-surface p-3 text-sm outline-none focus:border-accent"
          />
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name (optional)"
              className="min-w-0 flex-1 rounded-xl border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-accent"
            />
            <button
              onClick={draftComment}
              disabled={busy || !stance.trim()}
              className="rounded-xl bg-foreground px-4 py-2 text-sm font-medium text-background disabled:opacity-50"
            >
              {busy ? "Drafting…" : "Draft my comment"}
            </button>
          </div>
          {err && <p className="text-sm text-warn">{err}</p>}
          {draft && (
            <div className="rounded-lg border border-line bg-surface p-4">
              <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">{draft}</pre>
              <p className="mt-3 text-xs text-muted">Edit it so it sounds like you, then send it.</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {email && (
                  <a
                    href={`mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`}
                    className="rounded-xl bg-accent px-4 py-2 text-sm font-medium text-surface hover:opacity-90"
                  >
                    Email it to {item.jurisdictionName.replace("City of ", "")} ({email})
                  </a>
                )}
                <SmallButton onClick={() => navigator.clipboard.writeText(draft)}>Copy</SmallButton>
              </div>
            </div>
          )}
        </div>
      )}
    </article>
  );
}

function WatchSection({ interests, cities, live }: { interests: string[]; cities: string[]; live: boolean }) {
  const [email, setEmail] = useState("");
  const [cadence, setCadence] = useState("weekly");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ label: string } | null>(null);
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
    <section id="alerts" className="mt-16 scroll-mt-6 rounded-xl border border-line bg-surface p-6 sm:p-8">
      <div className="grid gap-6 md:grid-cols-[1fr_1fr] md:items-center">
        <div>
          <h2 className="font-serif text-2xl font-medium tracking-tight">📬 Never miss a vote on what you care about</h2>
          <p className="mt-2 text-sm text-muted">
            We&apos;ll check your city&apos;s agendas on a schedule and email you the decisions coming up, with the date
            and how to comment.
          </p>
        </div>
        {result ? (
          <p className="rounded-lg bg-accent-soft p-4 text-sm font-medium text-accent">
            You&apos;re in. We&apos;ll email you {result.label}.
          </p>
        ) : (
          <div className="space-y-2">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-xl border border-line bg-background px-3 py-2.5 text-sm outline-none focus:border-accent"
            />
            <div className="flex gap-2">
              {["weekly", "daily"].map((c) => (
                <button
                  key={c}
                  onClick={() => setCadence(c)}
                  className={`flex-1 rounded-xl border px-3 py-2 text-sm capitalize ${
                    cadence === c ? "border-accent bg-accent-soft text-accent" : "border-line"
                  }`}
                >
                  {c}
                </button>
              ))}
              <button
                onClick={watch}
                disabled={busy || !email || !interests.length || !cities.length}
                className="flex-[2] rounded-xl bg-accent px-3 py-2 text-sm font-semibold text-surface disabled:opacity-50"
              >
                {busy ? "Signing you up…" : "Sign me up"}
              </button>
            </div>
            {!live && <p className="text-xs text-muted">Uses the cities and topics you picked above.</p>}
            {err && <p className="text-xs text-warn">{err}</p>}
          </div>
        )}
      </div>
    </section>
  );
}

function AgentSection({ interests, cities }: { interests: string[]; cities: string[] }) {
  const suggestions = [
    "What's my city deciding about housing soon?",
    "Is anything about bike lanes being voted on?",
    "How do I comment on the next council meeting?",
  ];
  const [question, setQuestion] = useState(suggestions[0]);
  const [asking, setAsking] = useState(false);
  const [agent, setAgent] = useState<AgentResult | null>(null);
  const [err, setErr] = useState<string | null>(null);

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
    <section id="ask" className="mt-8 scroll-mt-6 rounded-xl border border-line bg-surface p-6 sm:p-8">
      <h2 className="font-serif text-2xl font-medium tracking-tight">💬 Ask about your city</h2>
      <p className="mt-2 text-sm text-muted">
        Ask in plain English. The assistant reads the latest agendas and staff reports and answers with sources.
      </p>
      <div className="mt-5 flex flex-col gap-2 sm:flex-row">
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
          {asking ? "Looking it up…" : "Ask"}
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
          <span className="h-2 w-2 animate-ping rounded-full bg-accent" /> Reading agendas and staff reports…
        </p>
      )}
      {err && <p className="mt-4 rounded-xl bg-warn-soft px-4 py-3 text-sm text-warn">{err}</p>}
      {agent && (
        <div className="mt-5">
          <div className="whitespace-pre-wrap text-sm leading-relaxed">{agent.answer}</div>
          {agent.toolCalls.length > 0 && (
            <p className="mt-4 text-xs text-muted">
              Sources checked: {agent.toolCalls.map((t) => t.name).join(" → ")}
            </p>
          )}
        </div>
      )}
    </section>
  );
}

function ImpactMeter({ actions }: { actions: number }) {
  const goal = 3;
  const pct = Math.min(100, Math.round((actions / goal) * 100));
  return (
    <div className="w-full rounded-lg border border-line bg-surface p-4 sm:w-64">
      <p className="text-xs font-medium text-muted">Your involvement this week</p>
      <p className="mt-1 text-2xl font-semibold tracking-tight">
        {actions} <span className="text-sm font-normal text-muted">action{actions === 1 ? "" : "s"}</span>
      </p>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-line">
        <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${pct}%` }} />
      </div>
      <p className="mt-2 text-xs text-muted">
        {actions >= goal ? "Weekly goal hit. Nice work. 🎉" : `${goal - actions} more to hit this week's goal`}
      </p>
    </div>
  );
}

function LadderStep({
  icon,
  title,
  done,
  last,
  children,
}: {
  icon: string;
  title: string;
  done: boolean;
  last?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={`p-5 ${last ? "" : "border-b border-line sm:border-b-0 sm:border-r"} ${done ? "bg-accent-soft/60" : ""}`}>
      <p className="flex items-center gap-2 text-sm font-semibold">
        <span>{done ? "✅" : icon}</span> {title}
      </p>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}

function SmallButton({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className="rounded-lg border border-line bg-surface px-3 py-1.5 text-xs font-medium hover:border-accent">
      {children}
    </button>
  );
}

function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full border px-3.5 py-2 text-sm transition ${
        on ? "border-accent bg-accent text-surface" : "border-line hover:border-accent"
      }`}
    >
      {children}
    </button>
  );
}

function Pillar({ icon, title, body }: { icon: string; title: string; body: string }) {
  return (
    <li className="rounded-lg border border-line bg-surface p-4">
      <p className="text-sm font-semibold">
        {icon} {title}
      </p>
      <p className="mt-1 text-xs leading-relaxed text-muted">{body}</p>
    </li>
  );
}

function Fact({ title, body }: { title: string; body: string }) {
  return (
    <div>
      <p className="font-semibold text-accent">{title}</p>
      <p className="mt-1 text-sm">{body}</p>
    </div>
  );
}

function Label({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <h2 className="flex items-center gap-2 text-base font-semibold">
      <span className="grid h-6 w-6 place-items-center rounded-full bg-foreground text-xs text-background">{n}</span>
      {children}
    </h2>
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

function topicLabel(interest: string) {
  return TOPICS.find((t) => t.interest === interest)?.label ?? interest;
}

function countdown(day: string) {
  const diff = Math.round((new Date(day + "T12:00:00").getTime() - Date.now()) / 86_400_000);
  if (diff <= 0) return "Decided today";
  if (diff === 1) return "Decided tomorrow";
  return `Decided in ${diff} days`;
}

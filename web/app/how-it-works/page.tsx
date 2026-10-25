"use client";

import Link from "next/link";
import { useState } from "react";
import { UnderTheHood } from "../under-the-hood";

export default function HowItWorks() {
  return (
    <div className="min-h-screen">
      <nav className="border-b border-line bg-surface/70 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3 sm:px-6">
          <Link href="/" className="flex items-center gap-3">
            <Logo />
            <span className="font-semibold tracking-tight">BeInvolved</span>
          </Link>
          <div className="ml-auto flex items-center gap-5 text-sm text-muted">
            <span className="hidden rounded-full border border-line px-3 py-1 text-xs sm:inline">
              Built on <b className="text-foreground">Apify</b> · explained by <b className="text-foreground">Claude</b>
            </span>
            <a href="https://github.com/2900xt/calhacks-2026" target="_blank" rel="noreferrer" className="hover:text-foreground">
              GitHub ↗
            </a>
          </div>
        </div>
      </nav>
      <main className="mx-auto max-w-5xl px-4 pb-16 sm:px-6">
        <header className="py-12">
          <Link href="/" className="text-sm text-accent hover:underline">
            ← Back to BeInvolved
          </Link>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight">How BeInvolved works</h1>
          <p className="mt-3 max-w-2xl text-lg text-muted">
            City agendas live on dozens of different platforms. A custom Apify Actor reads them all into one schema,
            Claude explains each item in plain English and scores it against what you care about, and every action
            (calendar, public comment, alerts) is built on top of that one stream.
          </p>
        </header>

        <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["Actor collects", "Legistar Web API + Berkeley eAgenda, normalized into one schema"],
            ["Dataset stores", "Every item lands in an Apify dataset with its staff report link"],
            ["Claude explains", "Relevance to your interests, plus a one-sentence plain-English summary"],
            ["You act", "Calendar, Claude-drafted public comments, weekly alerts via Apify Schedules"],
          ].map(([title, body], i) => (
            <li key={title} className="rounded-2xl border border-line bg-surface p-4">
              <p className="flex items-center gap-2 text-sm font-semibold">
                <span className="grid h-6 w-6 place-items-center rounded-full bg-accent text-xs text-surface">{i + 1}</span>
                {title}
              </p>
              <p className="mt-2 text-xs leading-relaxed text-muted">{body}</p>
            </li>
          ))}
        </ol>

        <UnderTheHood />

        <section className="mt-10 max-w-xl">
          <ConnectPanel />
        </section>
      </main>
    </div>
  );
}

function ConnectPanel() {
  const actor = process.env.NEXT_PUBLIC_APIFY_ACTOR_ID ?? "<username>/beinvolved";
  const [user, name] = actor.split("/");
  const endpoints = [
    { label: "Apify MCP server", url: `https://mcp.apify.com?tools=${actor}` },
    { label: "BeInvolved's own MCP (Standby)", url: `https://${user}--${name}.apify.actor/mcp` },
  ];
  const [copied, setCopied] = useState<string | null>(null);

  return (
    <div className="rounded-2xl border border-line bg-surface p-5">
      <h3 className="font-semibold">Use it from your own agent</h3>
      <p className="mt-1 text-sm text-muted">BeInvolved is an MCP tool. Add either endpoint to Claude, Cursor or any MCP client.</p>
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

function Logo() {
  return (
    <svg width="26" height="26" viewBox="0 0 32 32" aria-hidden>
      <rect width="32" height="32" rx="8" className="fill-accent" />
      <path d="M8 22V13l8-5 8 5v9" fill="none" stroke="white" strokeWidth="2" strokeLinejoin="round" />
      <path d="M12 22v-5M16 22v-7M20 22v-5" stroke="white" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

const FEATURES = [
  { name: "Custom Actor", detail: "civicsignal, Python + httpx + BeautifulSoup, published with input and dataset schemas" },
  { name: "Standby mode", detail: "Always-on HTTP API and its own MCP server at /mcp, no cold start" },
  { name: "Datasets", detail: "One normalized row per agenda item, with a table view for the Console" },
  { name: "Key-value store", detail: "OUTPUT record with a Markdown digest agents can read directly" },
  { name: "Pay per event", detail: "agenda-item-scanned and relevant-item-found, so agents can pay per call" },
  { name: "Tasks + Schedules", detail: "One click turns a scan into a weekly watch" },
  { name: "Actor-to-Actor", detail: "Digests go out through apify/send-mail" },
  { name: "Apify MCP server", detail: "Claude calls the Actor and apify/web-fetch through mcp.apify.com" },
];

export function UnderTheHood() {
  return (
    <section className="mt-14">
      <h2 className="text-2xl font-semibold tracking-tight">Under the hood</h2>
      <p className="mt-1 max-w-2xl text-sm text-muted">
        Government agendas are scattered across platforms that were never built to be read together. CivicSignal turns
        them into one stream that agents can call, built entirely on Apify.
      </p>

      <div className="mt-6 overflow-x-auto rounded-3xl border border-line bg-surface p-5 sm:p-7">
        <svg viewBox="0 0 880 250" className="min-w-[640px] w-full" role="img" aria-label="CivicSignal architecture">
          <defs>
            <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto">
              <path d="M0 0L10 5L0 10z" className="fill-muted" />
            </marker>
          </defs>
          {/* sources */}
          <Box x={10} y={30} w={170} h={50} title="Legistar Web API" sub="Oakland, San José + hundreds" />
          <Box x={10} y={100} w={170} h={50} title="Berkeley eAgenda" sub="berkeleyca.gov HTML" />
          <Box x={10} y={170} w={170} h={50} title="Staff report PDFs" sub="linked per item" muted />
          {/* actor */}
          <rect x={240} y={20} width={250} height={210} rx={16} className="fill-accent-soft stroke-accent" strokeWidth={1.5} />
          <text x={258} y={46} className="fill-accent text-[13px] font-semibold">CivicSignal Actor (Apify)</text>
          <Box x={258} y={60} w={214} h={44} title="Adapters → one schema" />
          <Box x={258} y={114} w={214} h={44} title="Claude relevance scoring" />
          <Box x={258} y={168} w={102} h={44} title="Dataset" />
          <Box x={370} y={168} w={102} h={44} title="KV digest" />
          {/* consumers */}
          <Box x={560} y={20} w={150} h={48} title="Web app" sub="apify-client" />
          <Box x={560} y={82} w={150} h={48} title="Claude agent" sub="mcp.apify.com" />
          <Box x={560} y={144} w={150} h={48} title="Any MCP client" sub="Standby /mcp" />
          <Box x={560} y={206} w={150} h={36} title="Schedule → Task" />
          <Box x={750} y={206} w={120} h={36} title="apify/send-mail" />
          <Box x={750} y={82} w={120} h={48} title="apify/web-fetch" sub="reads reports" />
          {[55, 125, 195].map((y) => (
            <line key={y} x1={180} y1={y} x2={238} y2={y > 150 ? 190 : y} className="stroke-muted" markerEnd="url(#arrow)" />
          ))}
          {[44, 106, 168].map((y) => (
            <line key={y} x1={490} y1={125} x2={558} y2={y} className="stroke-muted" markerEnd="url(#arrow)" />
          ))}
          <line x1={490} y1={200} x2={558} y2={224} className="stroke-muted" markerEnd="url(#arrow)" />
          <line x1={710} y1={224} x2={748} y2={224} className="stroke-muted" markerEnd="url(#arrow)" />
          <line x1={710} y1={106} x2={748} y2={106} className="stroke-muted" markerEnd="url(#arrow)" />
        </svg>
      </div>

      <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {FEATURES.map((f) => (
          <li key={f.name} className="rounded-2xl border border-line bg-surface p-4">
            <p className="text-sm font-semibold">{f.name}</p>
            <p className="mt-1 text-xs leading-relaxed text-muted">{f.detail}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Box({
  x,
  y,
  w,
  h,
  title,
  sub,
  muted,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  title: string;
  sub?: string;
  muted?: boolean;
}) {
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        rx={10}
        className={muted ? "fill-background stroke-line" : "fill-surface stroke-line"}
        strokeDasharray={muted ? "4 3" : undefined}
      />
      <text x={x + 12} y={y + (sub ? h / 2 - 3 : h / 2 + 4)} className="fill-foreground text-[12px] font-medium">
        {title}
      </text>
      {sub && (
        <text x={x + 12} y={y + h / 2 + 13} className="fill-muted text-[11px]">
          {sub}
        </text>
      )}
    </g>
  );
}

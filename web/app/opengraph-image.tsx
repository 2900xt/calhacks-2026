import { ImageResponse } from "next/og";

export const alt = "CivicSignal: know what your city will decide, before the vote";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const ITEMS = [
  { city: "Berkeley · City Council", what: "Developer selection for housing on the Ashby BART east lot", tag: "Vote", pct: 92 },
  { city: "Berkeley · City Council", what: "Highway Safety Improvement grant for safer streets", tag: "Consent", pct: 78 },
  { city: "Oakland · City Council", what: "Proposition 64 public health and safety grant", tag: "Vote", pct: 64 },
];

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: "#121311",
          color: "#ecebe6",
          padding: 64,
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", width: 560, justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: 14,
                background: "#7cc4a6",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#121311",
                fontSize: 32,
                fontWeight: 700,
              }}
            >
              C
            </div>
            <div style={{ fontSize: 34, fontWeight: 700 }}>CivicSignal</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 60, fontWeight: 700, lineHeight: 1.08, letterSpacing: -1.5 }}>
              Know what your city will decide,
            </div>
            <div style={{ fontSize: 60, fontWeight: 700, lineHeight: 1.08, letterSpacing: -1.5, color: "#7cc4a6" }}>
              before the vote.
            </div>
            <div style={{ marginTop: 24, fontSize: 24, color: "#a19e95", lineHeight: 1.4 }}>
              A custom Apify Actor reads every city council agenda, and Claude flags what matters to you.
            </div>
          </div>
          <div style={{ display: "flex", gap: 12, fontSize: 20, color: "#a19e95" }}>
            <span>Built on Apify</span>
            <span>·</span>
            <span>Scored by Claude</span>
            <span>·</span>
            <span>Cal Hacks 13.0</span>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 18, marginLeft: 48, flex: 1, justifyContent: "center" }}>
          {ITEMS.map((item) => (
            <div
              key={item.what}
              style={{
                display: "flex",
                flexDirection: "column",
                background: "#1b1c1a",
                border: "1px solid #2e2f2b",
                borderRadius: 20,
                padding: 22,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 17, color: "#a19e95" }}>
                <span>{item.city}</span>
                <span style={{ color: "#7cc4a6" }}>
                  {item.tag} · {item.pct}%
                </span>
              </div>
              <div style={{ marginTop: 10, fontSize: 23, lineHeight: 1.3 }}>{item.what}</div>
              <div style={{ display: "flex", marginTop: 14, height: 6, borderRadius: 3, background: "#2e2f2b" }}>
                <div style={{ width: `${item.pct}%`, background: "#7cc4a6", borderRadius: 3 }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    ),
    size,
  );
}

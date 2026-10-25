import type { AgendaMatch } from "@/lib/civic";

function esc(text: string) {
  return text.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
}

function parseTime(day: string, time: string | null): Date | null {
  const m = time?.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (!m) return null;
  let h = Number(m[1]) % 12;
  if (m[3].toUpperCase() === "PM") h += 12;
  return new Date(`${day}T${String(h).padStart(2, "0")}:${m[2]}:00`);
}

function stamp(d: Date) {
  return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

/** One calendar event per meeting, listing the matched items to watch at it. */
export function toIcs(items: AgendaMatch[]): string {
  const meetings = new Map<string, AgendaMatch[]>();
  for (const item of items) {
    const key = `${item.jurisdiction}|${item.body}|${item.meetingDate}`;
    meetings.set(key, [...(meetings.get(key) ?? []), item]);
  }

  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//BeInvolved//Agenda Watch//EN", "CALSCALE:GREGORIAN"];
  for (const [key, group] of meetings) {
    const first = group[0];
    const start = parseTime(first.meetingDate, first.meetingTime);
    const description = group
      .map((i) => `• ${i.plainSummary ?? i.title}${i.documentUrl ? ` (${i.documentUrl})` : ""}`)
      .join("\n");
    lines.push(
      "BEGIN:VEVENT",
      `UID:${key.replace(/[^a-z0-9]/gi, "-")}@beinvolved`,
      `DTSTAMP:${stamp(new Date())}`,
      ...(start
        ? [`DTSTART:${stamp(start)}`, `DTEND:${stamp(new Date(start.getTime() + 2 * 3_600_000))}`]
        : [`DTSTART;VALUE=DATE:${first.meetingDate.replace(/-/g, "")}`]),
      `SUMMARY:${esc(`${first.jurisdictionName} ${first.body}: ${group.length} item${group.length > 1 ? "s" : ""} you follow`)}`,
      `DESCRIPTION:${esc(description)}`,
      ...(first.meetingUrl ? [`URL:${first.meetingUrl}`] : []),
      "END:VEVENT",
    );
  }
  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}

export function downloadIcs(items: AgendaMatch[]) {
  const blob = new Blob([toIcs(items)], { type: "text/calendar" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "beinvolved-meetings.ics";
  a.click();
  URL.revokeObjectURL(a.href);
}

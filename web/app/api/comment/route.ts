import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import type { AgendaMatch } from "@/lib/civic";

export const maxDuration = 120;

const client = new Anthropic();

export async function POST(req: Request) {
  const { item, stance, name }: { item: AgendaMatch; stance: string; name?: string } = await req.json();
  if (!item || !stance?.trim()) {
    return NextResponse.json({ error: "Say what you think about this item." }, { status: 400 });
  }

  try {
    const message = await client.messages.create({
      model: "claude-opus-5-5",
      max_tokens: 4000,
      output_config: { effort: "low" },
      system:
        "You draft short, respectful public comments that residents send to their city council before a meeting. " +
        "Use only facts from the agenda item provided and the resident's own view. Under 180 words. " +
        "Start with a subject line formatted 'Subject: ...', then the body. Reference the meeting date and item number.",
      messages: [
        {
          role: "user",
          content:
            `Agenda item:\n${JSON.stringify({
              where: item.jurisdictionName,
              body: item.body,
              meetingDate: item.meetingDate,
              itemNumber: item.itemNumber,
              title: item.title,
              description: item.description,
              summary: item.plainSummary,
            })}\n\n` + `My view: ${stance}\n` + (name ? `Sign it as: ${name}` : "Sign it as: A resident"),
        },
      ],
    });
    if (message.stop_reason === "refusal") {
      return NextResponse.json({ error: "Claude declined to draft this comment." }, { status: 422 });
    }
    const text = message.content.map((b) => (b.type === "text" ? b.text : "")).join("").trim();
    return NextResponse.json({ draft: text });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

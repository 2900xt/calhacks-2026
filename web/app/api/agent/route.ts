import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { actorId } from "@/lib/civic";

export const maxDuration = 300;

const client = new Anthropic();

const SYSTEM = `You are BeInvolved, a local-government assistant for residents.
You have Apify tools through MCP, including the BeInvolved Actor, which reads upcoming city council
agendas (Berkeley, Oakland, San José, Alameda, Mountain View, Sunnyvale, or any Legistar city) and
scores each item against the resident's interests.
When the resident asks what is coming up, call the BeInvolved Actor with their interests and cities,
then fetch its dataset items (or the OUTPUT record in its key-value store, which holds a ready digest).
For follow-up questions about one item, open its documentUrl with the web-fetch tool. Answer with the specific items, meeting dates, what the government would do,
and a link to each source document. Say plainly when nothing matches. Never invent agenda items.
If a run is still going when the tool returns, fetch its dataset once it has finished.`;

export async function POST(req: Request) {
  const { question, interests = [], jurisdictions = [] } = await req.json();
  if (!question?.trim()) return NextResponse.json({ error: "Ask a question." }, { status: 400 });
  const token = process.env.APIFY_TOKEN;
  if (!token) return NextResponse.json({ error: "Set APIFY_TOKEN in web/.env.local" }, { status: 500 });

  const context = `My interests: ${interests.join("; ") || "(none given)"}. Cities I follow: ${jurisdictions.join(", ") || "berkeley, oakland"}.`;

  try {
    const stream = client.beta.messages.stream({
      model: "claude-opus-5-5",
      max_tokens: 64000,
      system: SYSTEM,
      output_config: { effort: "medium" },
      betas: ["mcp-client-2025-11-20"],
      mcp_servers: [
        {
          type: "url",
          name: "apify",
          // The Actor tool also brings get-actor-run, get-dataset-items and get-key-value-store-record;
          // apify/web-fetch lets the agent open a staff report to answer follow-up questions.
          url: `https://mcp.apify.com/?tools=${actorId()},apify/web-fetch`,
          authorization_token: token,
        },
      ],
      tools: [{ type: "mcp_toolset", mcp_server_name: "apify" }],
      messages: [{ role: "user", content: `${context}\n\n${question}` }],
    });
    const message = await stream.finalMessage();

    const toolCalls = message.content
      .filter((b) => b.type === "mcp_tool_use")
      .map((b) => (b.type === "mcp_tool_use" ? { name: b.name, input: b.input } : null));
    const answer = message.content
      .filter((b) => b.type === "text")
      .map((b) => (b.type === "text" ? b.text : ""))
      .join("\n")
      .trim();

    return NextResponse.json({ answer, toolCalls, stopReason: message.stop_reason });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

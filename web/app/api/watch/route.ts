import { NextResponse } from "next/server";
import { ScheduleActions } from "apify-client";
import { actorId, apify } from "@/lib/civic";

const CADENCES: Record<string, { cron: string; label: string }> = {
  weekly: { cron: "0 8 * * 1", label: "every Monday at 8am" },
  daily: { cron: "0 8 * * *", label: "every day at 8am" },
};

/**
 * Turns a one-off scan into a standing watch: saves the input as an Apify Task, then
 * attaches an Apify Schedule that runs it. The Actor emails matches via apify/send-mail.
 */
export async function POST(req: Request) {
  const { interests = [], jurisdictions = [], email, cadence = "weekly" } = await req.json();
  if (!email?.includes("@")) return NextResponse.json({ error: "Enter an email for alerts." }, { status: 400 });
  if (!interests.length || !jurisdictions.length) {
    return NextResponse.json({ error: "Pick at least one interest and one city." }, { status: 400 });
  }
  const when = CADENCES[cadence] ?? CADENCES.weekly;

  try {
    const client = apify();
    const actor = await client.actor(actorId()).get();
    if (!actor) throw new Error(`Actor ${actorId()} not found`);
    const suffix = Date.now().toString(36);

    const task = await client.tasks().create({
      actId: actor.id,
      name: `civicsignal-watch-${suffix}`,
      input: { interests, jurisdictions, daysAhead: cadence === "daily" ? 7 : 14, alertEmail: email },
    });
    const schedule = await client.schedules().create({
      name: `civicsignal-${suffix}`,
      cronExpression: when.cron,
      timezone: "America/Los_Angeles",
      isEnabled: true,
      isExclusive: true,
      actions: [{ type: ScheduleActions.RunActorTask, actorTaskId: task.id }],
    });

    return NextResponse.json({
      label: when.label,
      taskUrl: `https://console.apify.com/actors/tasks/${task.id}`,
      scheduleUrl: `https://console.apify.com/schedules/${schedule.id}`,
    });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}

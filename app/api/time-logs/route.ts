import { db } from "@/lib/db";
import { timeLogs, SINGLE_USER_ID } from "@/lib/db/schema";
import { startTimeLogSchema } from "@/lib/validations/time-log";
import { eq, and, isNull, desc } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const loggableType = searchParams.get("loggableType");
  const loggableId = searchParams.get("loggableId");
  const limit = parseInt(searchParams.get("limit") ?? "50", 10);

  let result;
  if (loggableType && loggableId) {
    result = await db
      .select()
      .from(timeLogs)
      .where(
        and(
          eq(timeLogs.userId, SINGLE_USER_ID),
          eq(timeLogs.loggableType, loggableType as "course" | "project" | "assignment" | "task"),
          eq(timeLogs.loggableId, loggableId),
        ),
      )
      .orderBy(desc(timeLogs.startedAt))
      .limit(limit);
  } else {
    result = await db
      .select()
      .from(timeLogs)
      .where(eq(timeLogs.userId, SINGLE_USER_ID))
      .orderBy(desc(timeLogs.startedAt))
      .limit(limit);
  }

  return NextResponse.json(result);
}

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = startTimeLogSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  // Stop any currently running timer first
  const running = await db
    .select()
    .from(timeLogs)
    .where(
      and(eq(timeLogs.userId, SINGLE_USER_ID), isNull(timeLogs.endedAt)),
    );

  for (const log of running) {
    const duration = Math.floor(
      (Date.now() - new Date(log.startedAt).getTime()) / 1000,
    );
    await db
      .update(timeLogs)
      .set({ endedAt: new Date(), durationSeconds: duration })
      .where(eq(timeLogs.id, log.id));
  }

  const [timeLog] = await db
    .insert(timeLogs)
    .values({
      ...parsed.data,
      userId: SINGLE_USER_ID,
      startedAt: new Date(),
    })
    .returning();

  return NextResponse.json(timeLog, { status: 201 });
}

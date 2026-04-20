import { db } from "@/lib/db";
import { dailyLogs, SINGLE_USER_ID } from "@/lib/db/schema";
import { upsertDailyLogSchema } from "@/lib/validations/daily-log";
import { and, desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date");

  if (date) {
    const [log] = await db
      .select()
      .from(dailyLogs)
      .where(
        and(eq(dailyLogs.userId, SINGLE_USER_ID), eq(dailyLogs.logDate, date)),
      );
    return NextResponse.json(log ?? null);
  }

  // Return recent logs (last 30)
  const result = await db
    .select()
    .from(dailyLogs)
    .where(eq(dailyLogs.userId, SINGLE_USER_ID))
    .orderBy(desc(dailyLogs.logDate))
    .limit(30);

  return NextResponse.json(result);
}

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = upsertDailyLogSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  // Upsert: update if exists for this date, otherwise insert
  const existing = await db
    .select()
    .from(dailyLogs)
    .where(
      and(
        eq(dailyLogs.userId, SINGLE_USER_ID),
        eq(dailyLogs.logDate, parsed.data.logDate),
      ),
    );

  if (existing.length > 0) {
    const [updated] = await db
      .update(dailyLogs)
      .set({
        content: parsed.data.content,
        mood: parsed.data.mood,
      })
      .where(eq(dailyLogs.id, existing[0].id))
      .returning();
    return NextResponse.json(updated);
  }

  const [log] = await db
    .insert(dailyLogs)
    .values({
      ...parsed.data,
      userId: SINGLE_USER_ID,
    })
    .returning();

  return NextResponse.json(log, { status: 201 });
}

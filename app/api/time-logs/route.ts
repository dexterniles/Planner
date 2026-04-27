import { db } from "@/lib/db";
import { timeLogs } from "@/lib/db/schema";
import { startTimeLogSchema } from "@/lib/validations/time-log";
import { eq, and, isNull } from "drizzle-orm";
import { NextResponse } from "next/server";
import { requireAuthGuard } from "@/lib/auth/require-auth";
import { getTimeLogs } from "@/lib/server/data/time-logs";

export async function GET(request: Request) {
  const auth = await requireAuthGuard(request);
  if (!auth.ok) return auth.response;
  const { userId } = auth;
  const { searchParams } = new URL(request.url);
  const loggableType = searchParams.get("loggableType");
  const loggableId = searchParams.get("loggableId");
  const limit = parseInt(searchParams.get("limit") ?? "50", 10);

  const result = await getTimeLogs(userId, {
    loggableType: loggableType ?? undefined,
    loggableId: loggableId ?? undefined,
    limit,
  });
  return NextResponse.json(result);
}

export async function POST(request: Request) {
  const auth = await requireAuthGuard(request);
  if (!auth.ok) return auth.response;
  const { userId } = auth;
  const body = await request.json();
  const parsed = startTimeLogSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const running = await db
    .select()
    .from(timeLogs)
    .where(and(eq(timeLogs.userId, userId), isNull(timeLogs.endedAt)));

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
      userId,
      startedAt: new Date(),
    })
    .returning();

  return NextResponse.json(timeLog, { status: 201 });
}

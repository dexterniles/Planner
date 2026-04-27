import { db } from "@/lib/db";
import { timeLogs } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { requireAuthGuard } from "@/lib/auth/require-auth";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  const auth = await requireAuthGuard(request);
  if (!auth.ok) return auth.response;
  const { userId } = auth;
  const { id } = await params;
  const body = await request.json().catch(() => ({}));

  const [existing] = await db
    .select()
    .from(timeLogs)
    .where(and(eq(timeLogs.id, id), eq(timeLogs.userId, userId)));

  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (existing.endedAt) {
    return NextResponse.json(
      { error: "Timer already stopped" },
      { status: 400 },
    );
  }

  const endedAt = new Date();
  const durationSeconds = Math.floor(
    (endedAt.getTime() - new Date(existing.startedAt).getTime()) / 1000,
  );

  const [updated] = await db
    .update(timeLogs)
    .set({
      endedAt,
      durationSeconds,
      notes: body.notes ?? existing.notes,
    })
    .where(and(eq(timeLogs.id, id), eq(timeLogs.userId, userId)))
    .returning();

  return NextResponse.json(updated);
}

import { db } from "@/lib/db";
import { timeLogs } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { requireAuthGuard } from "@/lib/auth/require-auth";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  const __guard = await requireAuthGuard();
  if (__guard) return __guard;
  const { id } = await params;
  const body = await request.json().catch(() => ({}));

  const [existing] = await db
    .select()
    .from(timeLogs)
    .where(eq(timeLogs.id, id));

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
    .where(eq(timeLogs.id, id))
    .returning();

  return NextResponse.json(updated);
}

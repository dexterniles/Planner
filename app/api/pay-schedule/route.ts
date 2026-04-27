import { db } from "@/lib/db";
import { paySchedule } from "@/lib/db/schema";
import { upsertPayScheduleSchema } from "@/lib/validations/bill";
import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { requireAuthGuard } from "@/lib/auth/require-auth";
import { getPaySchedule } from "@/lib/server/data/bills";

export async function GET(request: Request) {
  const auth = await requireAuthGuard(request);
  if (!auth.ok) return auth.response;
  const existing = await getPaySchedule(auth.userId);
  return NextResponse.json(existing);
}

export async function PUT(request: Request) {
  const auth = await requireAuthGuard(request);
  if (!auth.ok) return auth.response;
  const { userId } = auth;
  const body = await request.json();
  const parsed = upsertPayScheduleSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const [existing] = await db
    .select()
    .from(paySchedule)
    .where(eq(paySchedule.userId, userId));

  if (existing) {
    const [updated] = await db
      .update(paySchedule)
      .set(parsed.data)
      .where(and(eq(paySchedule.id, existing.id), eq(paySchedule.userId, userId)))
      .returning();
    return NextResponse.json(updated);
  }

  const [created] = await db
    .insert(paySchedule)
    .values({ ...parsed.data, userId })
    .returning();

  return NextResponse.json(created, { status: 201 });
}

export async function DELETE(request: Request) {
  const auth = await requireAuthGuard(request);
  if (!auth.ok) return auth.response;
  const { userId } = auth;
  await db.delete(paySchedule).where(eq(paySchedule.userId, userId));
  return NextResponse.json({ success: true });
}

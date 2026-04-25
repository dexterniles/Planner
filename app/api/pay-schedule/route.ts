import { db } from "@/lib/db";
import { paySchedule, SINGLE_USER_ID } from "@/lib/db/schema";
import { upsertPayScheduleSchema } from "@/lib/validations/bill";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { requireAuthGuard } from "@/lib/auth/require-auth";

export async function GET() {
  const __guard = await requireAuthGuard();
  if (__guard) return __guard;
  const [existing] = await db
    .select()
    .from(paySchedule)
    .where(eq(paySchedule.userId, SINGLE_USER_ID));

  return NextResponse.json(existing ?? null);
}

export async function PUT(request: Request) {
  const __guard = await requireAuthGuard();
  if (__guard) return __guard;
  const body = await request.json();
  const parsed = upsertPayScheduleSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const [existing] = await db
    .select()
    .from(paySchedule)
    .where(eq(paySchedule.userId, SINGLE_USER_ID));

  if (existing) {
    const [updated] = await db
      .update(paySchedule)
      .set(parsed.data)
      .where(eq(paySchedule.id, existing.id))
      .returning();
    return NextResponse.json(updated);
  }

  const [created] = await db
    .insert(paySchedule)
    .values({ ...parsed.data, userId: SINGLE_USER_ID })
    .returning();

  return NextResponse.json(created, { status: 201 });
}

export async function DELETE() {
  const __guard = await requireAuthGuard();
  if (__guard) return __guard;
  await db.delete(paySchedule).where(eq(paySchedule.userId, SINGLE_USER_ID));
  return NextResponse.json({ success: true });
}

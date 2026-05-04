import { db } from "@/lib/db";
import { incomeEntries } from "@/lib/db/schema";
import { updateIncomeSchema } from "@/lib/validations/income";
import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { requireAuthGuard } from "@/lib/auth/require-auth";
import { getIncomeById } from "@/lib/server/data/income";

type Params = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: Params) {
  const auth = await requireAuthGuard(request);
  if (!auth.ok) return auth.response;
  const { userId } = auth;
  const { id } = await params;
  const entry = await getIncomeById(userId, id);
  if (!entry) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(entry);
}

export async function PATCH(request: Request, { params }: Params) {
  const auth = await requireAuthGuard(request);
  if (!auth.ok) return auth.response;
  const { userId } = auth;
  const { id } = await params;
  const body = await request.json();
  const parsed = updateIncomeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { amount, source, notes, ...rest } = parsed.data;

  const updateData: Record<string, unknown> = { ...rest };
  if (amount !== undefined) updateData.amount = amount.toString();
  if (source !== undefined) updateData.source = source ?? null;
  if (notes !== undefined) updateData.notes = notes ?? null;

  const [updated] = await db
    .update(incomeEntries)
    .set(updateData)
    .where(and(eq(incomeEntries.id, id), eq(incomeEntries.userId, userId)))
    .returning();

  if (!updated) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(updated);
}

export async function DELETE(request: Request, { params }: Params) {
  const auth = await requireAuthGuard(request);
  if (!auth.ok) return auth.response;
  const { userId } = auth;
  const { id } = await params;
  const [deleted] = await db
    .delete(incomeEntries)
    .where(and(eq(incomeEntries.id, id), eq(incomeEntries.userId, userId)))
    .returning();

  if (!deleted) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}

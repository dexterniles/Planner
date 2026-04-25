import { db } from "@/lib/db";
import { bills, SINGLE_USER_ID } from "@/lib/db/schema";
import { updateBillSchema } from "@/lib/validations/bill";
import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { requireAuthGuard } from "@/lib/auth/require-auth";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const __guard = await requireAuthGuard();
  if (__guard) return __guard;
  const { id } = await params;
  const [bill] = await db
    .select()
    .from(bills)
    .where(and(eq(bills.id, id), eq(bills.userId, SINGLE_USER_ID)));

  if (!bill) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(bill);
}

export async function PATCH(request: Request, { params }: Params) {
  const __guard = await requireAuthGuard();
  if (__guard) return __guard;
  const { id } = await params;
  const body = await request.json();
  const parsed = updateBillSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { amount, paidAmount, paidAt, status, ...rest } = parsed.data;

  const updateData: Record<string, unknown> = { ...rest };
  if (amount !== undefined) updateData.amount = amount.toString();
  if (paidAmount !== undefined) {
    updateData.paidAmount = paidAmount != null ? paidAmount.toString() : null;
  }
  if (paidAt !== undefined) {
    updateData.paidAt = paidAt ? new Date(paidAt) : null;
  }
  if (status !== undefined) {
    updateData.status = status;
    // If marking paid and no explicit paidAt, stamp now
    if (status === "paid" && paidAt === undefined) {
      updateData.paidAt = new Date();
    }
    // If unmarking as paid, clear paidAt
    if (status === "unpaid") {
      updateData.paidAt = null;
    }
  }

  const [updated] = await db
    .update(bills)
    .set(updateData)
    .where(and(eq(bills.id, id), eq(bills.userId, SINGLE_USER_ID)))
    .returning();

  if (!updated) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(updated);
}

export async function DELETE(_request: Request, { params }: Params) {
  const __guard = await requireAuthGuard();
  if (__guard) return __guard;
  const { id } = await params;
  const [deleted] = await db
    .delete(bills)
    .where(and(eq(bills.id, id), eq(bills.userId, SINGLE_USER_ID)))
    .returning();

  if (!deleted) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}

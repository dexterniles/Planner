import { db } from "@/lib/db";
import { bills } from "@/lib/db/schema";
import { updateBillSchema } from "@/lib/validations/bill";
import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { requireAuthGuard } from "@/lib/auth/require-auth";

type Params = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: Params) {
  const auth = await requireAuthGuard(request);
  if (!auth.ok) return auth.response;
  const { userId } = auth;
  const { id } = await params;
  const [bill] = await db
    .select()
    .from(bills)
    .where(and(eq(bills.id, id), eq(bills.userId, userId)));

  if (!bill) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(bill);
}

export async function PATCH(request: Request, { params }: Params) {
  const auth = await requireAuthGuard(request);
  if (!auth.ok) return auth.response;
  const { userId } = auth;
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
    if (status === "paid" && paidAt === undefined) {
      updateData.paidAt = new Date();
    }
    if (status === "unpaid") {
      updateData.paidAt = null;
    }
  }

  const [updated] = await db
    .update(bills)
    .set(updateData)
    .where(and(eq(bills.id, id), eq(bills.userId, userId)))
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
    .delete(bills)
    .where(and(eq(bills.id, id), eq(bills.userId, userId)))
    .returning();

  if (!deleted) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}

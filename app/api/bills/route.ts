import { db } from "@/lib/db";
import { bills, recurrenceRules } from "@/lib/db/schema";
import { createBillSchema, billStatusValues } from "@/lib/validations/bill";
import { NextResponse } from "next/server";
import { requireAuthGuard } from "@/lib/auth/require-auth";
import { z } from "zod";
import { getBills } from "@/lib/server/data/bills";

export async function GET(request: Request) {
  const auth = await requireAuthGuard(request);
  if (!auth.ok) return auth.response;
  const { userId } = auth;
  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const status = searchParams.get("status");
  const categoryId = searchParams.get("categoryId");
  const limit = parseInt(searchParams.get("limit") ?? "500", 10);

  const statusParse = z.enum(billStatusValues).safeParse(status);

  const result = await getBills(userId, {
    from: from ?? undefined,
    to: to ?? undefined,
    status: statusParse.success ? statusParse.data : undefined,
    categoryId: categoryId ?? undefined,
    limit,
  });
  return NextResponse.json(result);
}

function addInterval(
  dateStr: string,
  frequency: "weekly" | "biweekly" | "monthly",
  n: number,
): string {
  const [y, m, d] = dateStr.split("-").map((s) => parseInt(s, 10));
  const date = new Date(y, m - 1, d);
  if (frequency === "weekly") date.setDate(date.getDate() + 7 * n);
  else if (frequency === "biweekly") date.setDate(date.getDate() + 14 * n);
  else date.setMonth(date.getMonth() + n);
  const yy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

export async function POST(request: Request) {
  const auth = await requireAuthGuard(request);
  if (!auth.ok) return auth.response;
  const { userId } = auth;
  const body = await request.json();
  const parsed = createBillSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { recurrence, amount, paidAmount, paidAt, ...rest } = parsed.data;

  if (!recurrence) {
    const [bill] = await db
      .insert(bills)
      .values({
        ...rest,
        amount: amount.toString(),
        paidAmount: paidAmount != null ? paidAmount.toString() : null,
        paidAt: paidAt ? new Date(paidAt) : null,
        userId,
      })
      .returning();
    return NextResponse.json(bill, { status: 201 });
  }

  const { rule, inserted } = await db.transaction(async (tx) => {
    const [rule] = await tx
      .insert(recurrenceRules)
      .values({
        frequency: recurrence.frequency,
        endDate: recurrence.endDate ?? null,
        count: recurrence.count ?? null,
      })
      .returning();

    const count = recurrence.count ?? 12;
    const billsToInsert = [];
    for (let i = 0; i < count; i++) {
      const due = addInterval(rest.dueDate, recurrence.frequency, i);
      if (recurrence.endDate && due > recurrence.endDate) break;
      billsToInsert.push({
        ...rest,
        dueDate: due,
        amount: amount.toString(),
        paidAmount: null,
        paidAt: null,
        recurrenceRuleId: rule.id,
        userId,
      });
    }

    const inserted = await tx.insert(bills).values(billsToInsert).returning();
    return { rule, inserted };
  });

  return NextResponse.json(
    { rule, bills: inserted, count: inserted.length },
    { status: 201 },
  );
}

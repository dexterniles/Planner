import { db } from "@/lib/db";
import { bills, recurrenceRules, SINGLE_USER_ID } from "@/lib/db/schema";
import { createBillSchema, type BillStatus } from "@/lib/validations/bill";
import { and, asc, eq, gte, lte, type SQL } from "drizzle-orm";
import { NextResponse } from "next/server";
import { requireAuthGuard } from "@/lib/auth/require-auth";

export async function GET(request: Request) {
  const __guard = await requireAuthGuard();
  if (__guard) return __guard;
  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const status = searchParams.get("status");
  const categoryId = searchParams.get("categoryId");
  const limit = parseInt(searchParams.get("limit") ?? "500", 10);

  const conditions: SQL[] = [eq(bills.userId, SINGLE_USER_ID)];
  if (from) conditions.push(gte(bills.dueDate, from));
  if (to) conditions.push(lte(bills.dueDate, to));
  if (status) conditions.push(eq(bills.status, status as BillStatus));
  if (categoryId) conditions.push(eq(bills.categoryId, categoryId));

  const result = await db
    .select()
    .from(bills)
    .where(and(...conditions))
    .orderBy(asc(bills.dueDate))
    .limit(limit);

  return NextResponse.json(result);
}

/** Add N units to a date string (YYYY-MM-DD), returning a new YYYY-MM-DD. */
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
  const __guard = await requireAuthGuard();
  if (__guard) return __guard;
  const body = await request.json();
  const parsed = createBillSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { recurrence, amount, paidAmount, paidAt, ...rest } = parsed.data;

  // Non-recurring: single insert
  if (!recurrence) {
    const [bill] = await db
      .insert(bills)
      .values({
        ...rest,
        amount: amount.toString(),
        paidAmount: paidAmount != null ? paidAmount.toString() : null,
        paidAt: paidAt ? new Date(paidAt) : null,
        userId: SINGLE_USER_ID,
      })
      .returning();
    return NextResponse.json(bill, { status: 201 });
  }

  // Recurring: create rule + N materialized instances
  const [rule] = await db
    .insert(recurrenceRules)
    .values({
      ownerType: "bill",
      ownerId: "00000000-0000-0000-0000-000000000000", // placeholder, not used for bills
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
      userId: SINGLE_USER_ID,
    });
  }

  const inserted = await db.insert(bills).values(billsToInsert).returning();

  return NextResponse.json(
    { rule, bills: inserted, count: inserted.length },
    { status: 201 },
  );
}

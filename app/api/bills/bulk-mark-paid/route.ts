import { db } from "@/lib/db";
import { bills, SINGLE_USER_ID } from "@/lib/db/schema";
import { bulkMarkPaidSchema } from "@/lib/validations/bill";
import { and, eq, inArray } from "drizzle-orm";
import { NextResponse } from "next/server";
import { requireAuthGuard } from "@/lib/auth/require-auth";

export async function POST(request: Request) {
  const __guard = await requireAuthGuard();
  if (__guard) return __guard;
  const body = await request.json();
  const parsed = bulkMarkPaidSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const now = new Date();

  const updated = await db
    .update(bills)
    .set({ status: "paid", paidAt: now })
    .where(
      and(
        eq(bills.userId, SINGLE_USER_ID),
        inArray(bills.id, parsed.data.ids),
      ),
    )
    .returning({ id: bills.id });

  return NextResponse.json({ count: updated.length, ids: updated.map((r) => r.id) });
}

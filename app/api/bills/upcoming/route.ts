import { db } from "@/lib/db";
import { bills } from "@/lib/db/schema";
import { and, asc, eq, gte } from "drizzle-orm";
import { NextResponse } from "next/server";
import { requireAuthGuard } from "@/lib/auth/require-auth";

export async function GET(request: Request) {
  const auth = await requireAuthGuard(request);
  if (!auth.ok) return auth.response;
  const { userId } = auth;
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get("limit") ?? "10", 10);

  const todayStr = new Date().toISOString().slice(0, 10);

  const result = await db
    .select()
    .from(bills)
    .where(
      and(
        eq(bills.userId, userId),
        eq(bills.status, "unpaid"),
        gte(bills.dueDate, todayStr),
      ),
    )
    .orderBy(asc(bills.dueDate))
    .limit(limit);

  return NextResponse.json(result);
}

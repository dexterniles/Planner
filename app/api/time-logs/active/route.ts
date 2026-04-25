import { db } from "@/lib/db";
import { timeLogs, SINGLE_USER_ID } from "@/lib/db/schema";
import { and, eq, isNull } from "drizzle-orm";
import { NextResponse } from "next/server";
import { requireAuthGuard } from "@/lib/auth/require-auth";

export async function GET() {
  const __guard = await requireAuthGuard();
  if (__guard) return __guard;
  const [active] = await db
    .select()
    .from(timeLogs)
    .where(
      and(eq(timeLogs.userId, SINGLE_USER_ID), isNull(timeLogs.endedAt)),
    );

  return NextResponse.json(active ?? null);
}

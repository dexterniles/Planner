import { db } from "@/lib/db";
import { timeLogs } from "@/lib/db/schema";
import { and, eq, isNull } from "drizzle-orm";
import { NextResponse } from "next/server";
import { requireAuthGuard } from "@/lib/auth/require-auth";

export async function GET(request: Request) {
  const auth = await requireAuthGuard(request);
  if (!auth.ok) return auth.response;
  const { userId } = auth;
  const [active] = await db
    .select()
    .from(timeLogs)
    .where(and(eq(timeLogs.userId, userId), isNull(timeLogs.endedAt)));

  return NextResponse.json(active ?? null);
}

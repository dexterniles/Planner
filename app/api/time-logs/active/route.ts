import { db } from "@/lib/db";
import { timeLogs, SINGLE_USER_ID } from "@/lib/db/schema";
import { and, eq, isNull } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET() {
  const [active] = await db
    .select()
    .from(timeLogs)
    .where(
      and(eq(timeLogs.userId, SINGLE_USER_ID), isNull(timeLogs.endedAt)),
    );

  return NextResponse.json(active ?? null);
}

import { db } from "@/lib/db";
import { incomeEntries } from "@/lib/db/schema";
import {
  createIncomeSchema,
  incomeKindValues,
} from "@/lib/validations/income";
import { NextResponse } from "next/server";
import { requireAuthGuard } from "@/lib/auth/require-auth";
import { z } from "zod";
import { getIncome } from "@/lib/server/data/income";

const isoDate = /^\d{4}-\d{2}-\d{2}$/;

export async function GET(request: Request) {
  const auth = await requireAuthGuard(request);
  if (!auth.ok) return auth.response;
  const { userId } = auth;
  const { searchParams } = new URL(request.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const kind = searchParams.get("kind");
  const limit = parseInt(searchParams.get("limit") ?? "500", 10);

  if (from !== null && !isoDate.test(from)) {
    return NextResponse.json(
      { error: "from must be YYYY-MM-DD" },
      { status: 400 },
    );
  }
  if (to !== null && !isoDate.test(to)) {
    return NextResponse.json(
      { error: "to must be YYYY-MM-DD" },
      { status: 400 },
    );
  }

  const kindParse = z.enum(incomeKindValues).safeParse(kind);

  const result = await getIncome(userId, {
    from: from ?? undefined,
    to: to ?? undefined,
    kind: kindParse.success ? kindParse.data : undefined,
    limit,
  });
  return NextResponse.json(result);
}

export async function POST(request: Request) {
  const auth = await requireAuthGuard(request);
  if (!auth.ok) return auth.response;
  const { userId } = auth;
  const body = await request.json();
  const parsed = createIncomeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { amount, source, notes, ...rest } = parsed.data;

  const [entry] = await db
    .insert(incomeEntries)
    .values({
      ...rest,
      amount: amount.toString(),
      source: source ?? null,
      notes: notes ?? null,
      userId,
    })
    .returning();
  return NextResponse.json(entry, { status: 201 });
}

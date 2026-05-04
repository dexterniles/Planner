import { db } from "@/lib/db";
import { incomeEntries } from "@/lib/db/schema";
import { and, asc, desc, eq, gte, lte, type SQL } from "drizzle-orm";
import type { InferSelectModel } from "drizzle-orm";
import type { IncomeKind } from "@/lib/validations/income";

export type IncomeEntry = InferSelectModel<typeof incomeEntries>;

export type IncomeFilters = {
  from?: string;
  to?: string;
  kind?: IncomeKind;
  limit?: number;
};

export async function getIncome(
  userId: string,
  filters: IncomeFilters = {},
): Promise<IncomeEntry[]> {
  const { from, to, kind, limit = 500 } = filters;
  const conditions: SQL[] = [eq(incomeEntries.userId, userId)];
  if (from) conditions.push(gte(incomeEntries.receivedDate, from));
  if (to) conditions.push(lte(incomeEntries.receivedDate, to));
  if (kind) conditions.push(eq(incomeEntries.kind, kind));

  return db
    .select()
    .from(incomeEntries)
    .where(and(...conditions))
    .orderBy(desc(incomeEntries.receivedDate), asc(incomeEntries.id))
    .limit(limit);
}

export async function getIncomeById(
  userId: string,
  id: string,
): Promise<IncomeEntry | null> {
  const [entry] = await db
    .select()
    .from(incomeEntries)
    .where(and(eq(incomeEntries.id, id), eq(incomeEntries.userId, userId)));
  return entry ?? null;
}

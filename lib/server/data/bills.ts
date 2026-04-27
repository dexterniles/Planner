import { db } from "@/lib/db";
import { bills, billCategories, paySchedule } from "@/lib/db/schema";
import { and, asc, eq, gte, lte, type SQL } from "drizzle-orm";
import type { InferSelectModel } from "drizzle-orm";
import type { BillStatus } from "@/lib/validations/bill";

export type Bill = InferSelectModel<typeof bills>;
export type BillCategory = InferSelectModel<typeof billCategories>;
export type PaySchedule = InferSelectModel<typeof paySchedule>;

export type BillsFilters = {
  from?: string;
  to?: string;
  status?: BillStatus;
  categoryId?: string;
  limit?: number;
};

export async function getBills(
  userId: string,
  filters: BillsFilters = {},
): Promise<Bill[]> {
  const { from, to, status, categoryId, limit = 500 } = filters;
  const conditions: SQL[] = [eq(bills.userId, userId)];
  if (from) conditions.push(gte(bills.dueDate, from));
  if (to) conditions.push(lte(bills.dueDate, to));
  if (status) conditions.push(eq(bills.status, status));
  if (categoryId) conditions.push(eq(bills.categoryId, categoryId));

  return db
    .select()
    .from(bills)
    .where(and(...conditions))
    .orderBy(asc(bills.dueDate))
    .limit(limit);
}

export async function getUpcomingBills(
  userId: string,
  limit: number,
): Promise<Bill[]> {
  const todayStr = new Date().toISOString().slice(0, 10);
  return db
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
}

export async function getBillCategories(
  userId: string,
): Promise<BillCategory[]> {
  return db
    .select()
    .from(billCategories)
    .where(eq(billCategories.userId, userId))
    .orderBy(asc(billCategories.sortOrder), asc(billCategories.name));
}

export async function getBillById(
  userId: string,
  id: string,
): Promise<Bill | null> {
  const [bill] = await db
    .select()
    .from(bills)
    .where(and(eq(bills.id, id), eq(bills.userId, userId)));
  return bill ?? null;
}

export async function getPaySchedule(
  userId: string,
): Promise<PaySchedule | null> {
  const [existing] = await db
    .select()
    .from(paySchedule)
    .where(eq(paySchedule.userId, userId));
  return existing ?? null;
}

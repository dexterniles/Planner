"use client";

import Link from "next/link";
import { Check, Wallet } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useBills, useUpdateBill } from "@/lib/hooks/use-bills";
import { useBillCategories } from "@/lib/hooks/use-bill-categories";
import { usePaySchedule } from "@/lib/hooks/use-pay-schedule";
import {
  categoryInitial,
  defaultCategoryColor,
  formatCurrency,
  formatDueShort,
  getPayPeriod,
  isOverdue,
  toISODate,
} from "@/components/bills/bill-utils";
import type { PayFrequency } from "@/lib/validations/bill";
import type { BillCardData } from "@/components/bills/bill-card";
import { toast } from "sonner";
import { useMemo } from "react";

interface Category {
  id: string;
  name: string;
  color: string | null;
}

export function BillsThisPeriod() {
  const { data: paySchedule } = usePaySchedule();
  const { data: allBills } = useBills({ limit: 500 });
  const { data: categories } = useBillCategories();
  const updateBill = useUpdateBill();

  const catMap = useMemo(() => {
    const map = new Map<string, Category>();
    for (const c of (categories ?? []) as Category[]) map.set(c.id, c);
    return map;
  }, [categories]);

  // Compute range: pay period if schedule exists, else next 14 days
  const { start, end, label } = useMemo(() => {
    if (paySchedule) {
      const p = getPayPeriod(
        paySchedule.referenceDate,
        paySchedule.frequency as PayFrequency,
      );
      return {
        start: toISODate(p.start),
        end: toISODate(p.end),
        label: "This pay period",
      };
    }
    const now = new Date();
    const fut = new Date(now);
    fut.setDate(fut.getDate() + 14);
    return {
      start: toISODate(now),
      end: toISODate(fut),
      label: "Next 14 days",
    };
  }, [paySchedule]);

  const periodBills = useMemo(() => {
    const list = (allBills ?? []) as BillCardData[];
    return list
      .filter((b) => b.dueDate >= start && b.dueDate <= end)
      .sort((a, b) => (a.dueDate < b.dueDate ? -1 : 1));
  }, [allBills, start, end]);

  const unpaid = periodBills.filter((b) => b.status !== "paid");
  const totalDue = unpaid.reduce((s, b) => s + parseFloat(b.amount), 0);
  const overdueCount = unpaid.filter((b) =>
    isOverdue(b.dueDate, b.status),
  ).length;

  const markPaid = async (id: string, name: string) => {
    try {
      await updateBill.mutateAsync({ id, data: { status: "paid" } });
      toast.success(`Paid: ${name}`);
    } catch {
      toast.error("Failed to mark paid");
    }
  };

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Wallet className="h-4 w-4 text-muted-foreground" />
          <h2 className="font-semibold">Bills</h2>
        </div>
        <Link
          href="/bills"
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          View all
        </Link>
      </div>

      {/* Summary */}
      <div className="mb-3 flex items-baseline justify-between rounded-lg bg-muted/40 px-3 py-2">
        <div>
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">
            {label}
          </p>
          <p className="text-xl font-semibold tabular-nums">
            {formatCurrency(totalDue)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">
            Unpaid
          </p>
          <p className="text-sm font-semibold tabular-nums">
            {unpaid.length}
            {overdueCount > 0 && (
              <span className="ml-2 text-xs font-medium text-red-600 dark:text-red-400">
                · {overdueCount} overdue
              </span>
            )}
          </p>
        </div>
      </div>

      {periodBills.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {paySchedule
            ? "No bills in this pay period."
            : "No bills in the next 2 weeks."}
        </p>
      ) : (
        <div className="space-y-1">
          {periodBills.slice(0, 5).map((bill) => {
            const cat = bill.categoryId ? catMap.get(bill.categoryId) : null;
            const color = cat?.color ?? defaultCategoryColor;
            const overdue = isOverdue(bill.dueDate, bill.status);
            const paid = bill.status === "paid";
            return (
              <div
                key={bill.id}
                className={`group flex items-center gap-2 rounded-md px-2 py-1.5 transition-colors hover:bg-accent ${
                  paid ? "opacity-60" : ""
                }`}
              >
                <span
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[10px] font-bold text-white"
                  style={{ backgroundColor: color }}
                >
                  {cat ? categoryInitial(cat.name) : "$"}
                </span>
                <span
                  className={`flex-1 text-sm font-medium truncate ${
                    paid ? "line-through" : ""
                  }`}
                >
                  {bill.name}
                </span>
                <span className="text-sm font-semibold tabular-nums">
                  {formatCurrency(bill.amount)}
                </span>
                <span
                  className={`text-xs tabular-nums w-16 text-right ${
                    overdue ? "text-red-600 dark:text-red-400 font-medium" : "text-muted-foreground"
                  }`}
                >
                  {formatDueShort(bill.dueDate)}
                </span>
                {!paid && (
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => markPaid(bill.id, bill.name)}
                    disabled={updateBill.isPending}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-emerald-600 dark:text-emerald-400"
                    aria-label={`Mark ${bill.name} paid`}
                    title="Mark paid"
                  >
                    <Check className="h-3 w-3" />
                  </Button>
                )}
              </div>
            );
          })}
          {periodBills.length > 5 && (
            <Link
              href="/bills"
              className="block text-center text-xs text-muted-foreground hover:text-foreground pt-1"
            >
              +{periodBills.length - 5} more
            </Link>
          )}
        </div>
      )}
    </Card>
  );
}

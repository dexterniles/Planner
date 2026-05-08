"use client";

import Link from "next/link";
import { useBills } from "@/lib/hooks/use-bills";
import { usePaySchedule } from "@/lib/hooks/use-pay-schedule";
import {
  formatCurrency,
  formatDueShort,
  getPayPeriod,
  isOverdue,
  toISODate,
} from "@/components/bills/bill-utils";
import type { PayFrequency } from "@/lib/validations/bill";
import type { BillCardData } from "@/components/bills/bill-card";
import { useMemo } from "react";
import { useCurrentDate } from "@/lib/hooks/use-current-date";
import { cn } from "@/lib/utils";

export function BillsThisPeriod() {
  const { data: paySchedule } = usePaySchedule();
  const { data: allBills } = useBills({ limit: 500 });
  const now = useCurrentDate();

  const { start, end } = useMemo(() => {
    if (paySchedule) {
      const p = getPayPeriod(
        paySchedule.referenceDate,
        paySchedule.frequency as PayFrequency,
      );
      return {
        start: toISODate(p.start),
        end: toISODate(p.end),
      };
    }
    const fut = new Date(now);
    fut.setDate(fut.getDate() + 14);
    return {
      start: toISODate(now),
      end: toISODate(fut),
    };
  }, [paySchedule, now]);

  const periodBills = useMemo(() => {
    const list = (allBills ?? []) as BillCardData[];
    return list
      .filter((b) => b.dueDate >= start && b.dueDate <= end)
      .sort((a, b) => (a.dueDate < b.dueDate ? -1 : 1));
  }, [allBills, start, end]);

  if (periodBills.length === 0) {
    return (
      <p className="text-[13px] text-muted-foreground">
        {paySchedule
          ? "No bills in this pay period."
          : "No bills in the next 2 weeks."}
      </p>
    );
  }

  return (
    <div className="space-y-0">
      {periodBills.slice(0, 5).map((bill) => {
        const overdue = isOverdue(bill.dueDate, bill.status);
        const paid = bill.status === "paid";
        return (
          <Link
            key={bill.id}
            href="/bills"
            className={cn(
              "group flex items-center gap-3 rounded-md px-1 py-1.5 text-[13px] transition-colors hover:bg-muted/50",
              paid && "opacity-60",
            )}
          >
            <span
              className={cn(
                "flex-1 truncate font-medium",
                paid && "line-through",
              )}
            >
              {bill.name}
            </span>
            <span
              className={cn(
                "text-[11.5px] whitespace-nowrap tabular-nums",
                overdue
                  ? "font-medium text-destructive"
                  : "text-muted-foreground",
              )}
            >
              {formatDueShort(bill.dueDate)}
            </span>
            <span className="text-[13px] tabular-nums">
              {formatCurrency(bill.amount)}
            </span>
          </Link>
        );
      })}
      {periodBills.length > 5 && (
        <Link
          href="/bills"
          className="block pt-2 text-center text-[11.5px] text-muted-foreground hover:text-foreground"
        >
          +{periodBills.length - 5} more
        </Link>
      )}
    </div>
  );
}

export function useBillsThisPeriodSummary() {
  const { data: paySchedule } = usePaySchedule();
  const { data: allBills } = useBills({ limit: 500 });
  const now = useCurrentDate();

  return useMemo(() => {
    let start: string;
    let end: string;
    let label: string;
    if (paySchedule) {
      const p = getPayPeriod(
        paySchedule.referenceDate,
        paySchedule.frequency as PayFrequency,
      );
      start = toISODate(p.start);
      end = toISODate(p.end);
      label = "This pay period";
    } else {
      const fut = new Date(now);
      fut.setDate(fut.getDate() + 14);
      start = toISODate(now);
      end = toISODate(fut);
      label = "Next 14 days";
    }
    const list = (allBills ?? []) as BillCardData[];
    const period = list.filter(
      (b) => b.dueDate >= start && b.dueDate <= end,
    );
    const unpaid = period.filter((b) => b.status !== "paid");
    const totalDue = unpaid.reduce(
      (s, b) => s + parseFloat(b.amount),
      0,
    );
    return { totalDue, unpaidCount: unpaid.length, label };
  }, [allBills, paySchedule, now]);
}

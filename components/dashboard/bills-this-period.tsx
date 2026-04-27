"use client";

import Link from "next/link";
import { Check, Wallet } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useBills, useUpdateBill } from "@/lib/hooks/use-bills";
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
import { toast } from "sonner";
import { useMemo } from "react";
import { useCurrentDate } from "@/lib/hooks/use-current-date";

export function BillsThisPeriod() {
  const { data: paySchedule } = usePaySchedule();
  const { data: allBills } = useBills({ limit: 500 });
  const updateBill = useUpdateBill();
  const now = useCurrentDate();

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
    const fut = new Date(now);
    fut.setDate(fut.getDate() + 14);
    return {
      start: toISODate(now),
      end: toISODate(fut),
      label: "Next 14 days",
    };
  }, [paySchedule, now]);

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
    <Card className="p-5">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-baseline gap-2">
          <h2 className="font-serif text-[18px] font-medium leading-none tracking-tight">
            Bills · this period
          </h2>
        </div>
        <div className="flex items-center gap-3">
          <Wallet className="h-4 w-4 text-muted-foreground" strokeWidth={1.75} />
          <Link
            href="/bills"
            className="text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            See all
          </Link>
        </div>
      </div>

      {/* Summary strip */}
      <div className="mb-3 flex items-end justify-between border-b border-border/60 pb-3">
        <div>
          <p className="text-[10.5px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
            {label}
          </p>
          <p className="mt-1 font-serif text-[22px] sm:text-[26px] font-medium leading-none tabular-nums">
            {formatCurrency(totalDue)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-[10.5px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
            Unpaid
          </p>
          <p className="mt-1 font-mono text-[13px] tabular-nums">
            {unpaid.length}
            {overdueCount > 0 && (
              <span className="ml-1.5 text-destructive">
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
        <div>
          {periodBills.slice(0, 5).map((bill, idx) => {
            const overdue = isOverdue(bill.dueDate, bill.status);
            const paid = bill.status === "paid";
            return (
              <div
                key={bill.id}
                className={`group flex items-center gap-3 rounded-md px-2 py-2 transition-colors hover:bg-accent/60 ${
                  idx > 0 ? "border-t border-border/60" : ""
                } ${paid ? "opacity-60" : ""}`}
              >
                <span
                  className={`flex-1 truncate text-sm font-medium ${paid ? "line-through" : ""}`}
                >
                  {bill.name}
                </span>
                <span
                  className={`text-xs whitespace-nowrap tabular-nums ${
                    overdue
                      ? "font-medium text-destructive"
                      : "text-muted-foreground"
                  }`}
                >
                  {formatDueShort(bill.dueDate)}
                </span>
                <span className="font-serif text-[16px] tabular-nums">
                  {formatCurrency(bill.amount)}
                </span>
                {!paid && (
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => markPaid(bill.id, bill.name)}
                    disabled={updateBill.isPending}
                    className="md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100 transition-opacity text-chart-2"
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
              className="block text-center pt-2 text-xs text-muted-foreground hover:text-foreground"
            >
              +{periodBills.length - 5} more
            </Link>
          )}
        </div>
      )}
    </Card>
  );
}

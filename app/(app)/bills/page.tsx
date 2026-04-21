"use client";

import { useMemo, useState } from "react";
import {
  AlertCircle,
  Check,
  ChevronLeft,
  ChevronRight,
  Plus,
  Receipt,
  TrendingDown,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useBills, useBulkMarkPaid } from "@/lib/hooks/use-bills";
import { useBillCategories } from "@/lib/hooks/use-bill-categories";
import { usePaySchedule } from "@/lib/hooks/use-pay-schedule";
import { BillCard, type BillCardData } from "@/components/bills/bill-card";
import { BillDialog } from "@/components/bills/bill-dialog";
import {
  formatCurrency,
  getPayPeriod,
  isOverdue,
  shiftPayPeriod,
  toISODate,
} from "@/components/bills/bill-utils";
import { toast } from "sonner";
import type { PayFrequency } from "@/lib/validations/bill";

type Tab = "all" | "period";
type StatusFilter = "all" | "unpaid" | "overdue" | "paid";

interface Category {
  id: string;
  name: string;
  color: string | null;
}

export default function BillsPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<BillCardData | null>(null);
  const [tab, setTab] = useState<Tab>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [periodOffset, setPeriodOffset] = useState(0);

  const { data: bills, isLoading } = useBills({ limit: 500 });
  const { data: categories } = useBillCategories();
  const { data: paySchedule } = usePaySchedule();
  const bulkMarkPaid = useBulkMarkPaid();

  const catMap = useMemo(() => {
    const map = new Map<string, Category>();
    for (const c of (categories ?? []) as Category[]) map.set(c.id, c);
    return map;
  }, [categories]);

  // Current pay period (if schedule exists) with offset
  const payPeriod = useMemo(() => {
    if (!paySchedule) return null;
    const current = getPayPeriod(
      paySchedule.referenceDate,
      paySchedule.frequency as PayFrequency,
    );
    const shiftedStart = shiftPayPeriod(
      paySchedule.referenceDate,
      paySchedule.frequency as PayFrequency,
      current.start,
      periodOffset,
    );
    const shiftedEnd = shiftPayPeriod(
      paySchedule.referenceDate,
      paySchedule.frequency as PayFrequency,
      current.end,
      periodOffset,
    );
    return { start: shiftedStart, end: shiftedEnd };
  }, [paySchedule, periodOffset]);

  const allBills = (bills ?? []) as BillCardData[];

  // Bills filtered by current tab + filters
  const filtered = useMemo(() => {
    let list = allBills;

    // Tab filter
    if (tab === "period" && payPeriod) {
      const startStr = toISODate(payPeriod.start);
      const endStr = toISODate(payPeriod.end);
      list = list.filter((b) => b.dueDate >= startStr && b.dueDate <= endStr);
    }

    // Status filter
    if (statusFilter === "unpaid") {
      list = list.filter((b) => b.status === "unpaid");
    } else if (statusFilter === "overdue") {
      list = list.filter((b) => isOverdue(b.dueDate, b.status));
    } else if (statusFilter === "paid") {
      list = list.filter((b) => b.status === "paid");
    }

    // Category filter
    if (categoryFilter) {
      list = list.filter((b) => b.categoryId === categoryFilter);
    }

    return list;
  }, [allBills, tab, payPeriod, statusFilter, categoryFilter]);

  // Summary stats (based on ALL bills, not filtered — gives an overall view)
  const stats = useMemo(() => {
    const now = new Date();
    const monthStart = toISODate(
      new Date(now.getFullYear(), now.getMonth(), 1),
    );
    const monthEnd = toISODate(
      new Date(now.getFullYear(), now.getMonth() + 1, 0),
    );

    const thisMonth = allBills.filter(
      (b) => b.dueDate >= monthStart && b.dueDate <= monthEnd,
    );
    const dueThisMonth = thisMonth.reduce(
      (sum, b) => sum + parseFloat(b.amount),
      0,
    );
    const paidThisMonth = thisMonth
      .filter((b) => b.status === "paid")
      .reduce((sum, b) => sum + parseFloat(b.amount), 0);
    const overdueCount = allBills.filter((b) =>
      isOverdue(b.dueDate, b.status),
    ).length;

    // Minimum needed across next 2 pay periods (if pay schedule set)
    let minimumNeeded: number | null = null;
    if (paySchedule) {
      const current = getPayPeriod(
        paySchedule.referenceDate,
        paySchedule.frequency as PayFrequency,
      );
      const nextEnd = shiftPayPeriod(
        paySchedule.referenceDate,
        paySchedule.frequency as PayFrequency,
        current.end,
        1,
      );
      const currentStr = toISODate(current.start);
      const nextEndStr = toISODate(nextEnd);

      minimumNeeded = allBills
        .filter(
          (b) =>
            b.status === "unpaid" &&
            b.dueDate >= currentStr &&
            b.dueDate <= nextEndStr,
        )
        .reduce((sum, b) => sum + parseFloat(b.amount), 0);
    }

    return { dueThisMonth, paidThisMonth, overdueCount, minimumNeeded };
  }, [allBills, paySchedule]);

  const selectionMode = selected.size > 0;

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleBulkMarkPaid = async () => {
    try {
      const res = await bulkMarkPaid.mutateAsync(Array.from(selected));
      toast.success(`Marked ${res.count} paid`);
      setSelected(new Set());
    } catch {
      toast.error("Failed to bulk mark paid");
    }
  };

  const openCreate = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  const openEdit = (bill: BillCardData) => {
    setEditing(bill);
    setDialogOpen(true);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Bills</h1>
        <Button onClick={openCreate}>
          <Plus className="mr-1.5 h-4 w-4" />
          New Bill
        </Button>
      </div>

      {/* Stats row */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Receipt}
          label="Due this month"
          value={formatCurrency(stats.dueThisMonth)}
          iconBg="from-blue-500/20 to-blue-500/5"
          iconColor="text-blue-600 dark:text-blue-400"
        />
        <StatCard
          icon={Check}
          label="Paid this month"
          value={formatCurrency(stats.paidThisMonth)}
          iconBg="from-emerald-500/20 to-emerald-500/5"
          iconColor="text-emerald-600 dark:text-emerald-400"
        />
        <StatCard
          icon={AlertCircle}
          label="Overdue"
          value={String(stats.overdueCount)}
          iconBg={
            stats.overdueCount > 0
              ? "from-red-500/20 to-red-500/5"
              : "from-muted to-muted"
          }
          iconColor={
            stats.overdueCount > 0
              ? "text-red-600 dark:text-red-400"
              : "text-muted-foreground"
          }
        />
        <StatCard
          icon={TrendingDown}
          label="Min. needed (2 periods)"
          value={
            stats.minimumNeeded != null
              ? formatCurrency(stats.minimumNeeded)
              : "Set pay schedule"
          }
          iconBg="from-violet-500/20 to-violet-500/5"
          iconColor="text-violet-600 dark:text-violet-400"
        />
      </div>

      {/* Tabs: All bills vs Pay period */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="inline-flex rounded-xl bg-gradient-to-b from-muted/80 to-muted/50 ring-1 ring-border/40 shadow-sm p-1">
          <button
            onClick={() => setTab("all")}
            className={cn(
              "px-3 py-1 text-[13px] font-medium rounded-lg transition-all duration-200",
              tab === "all"
                ? "bg-gradient-to-b from-background to-background/90 text-foreground shadow-sm ring-1 ring-border/60"
                : "text-foreground/55 hover:text-foreground",
            )}
          >
            All bills
          </button>
          <button
            onClick={() => setTab("period")}
            disabled={!paySchedule}
            className={cn(
              "px-3 py-1 text-[13px] font-medium rounded-lg transition-all duration-200 disabled:opacity-50",
              tab === "period"
                ? "bg-gradient-to-b from-background to-background/90 text-foreground shadow-sm ring-1 ring-border/60"
                : "text-foreground/55 hover:text-foreground",
            )}
            title={
              !paySchedule
                ? "Set your pay schedule in Settings to enable this view"
                : undefined
            }
          >
            Pay period
          </button>
        </div>

        {/* Status filter chips */}
        <div className="flex gap-1">
          {(["all", "unpaid", "overdue", "paid"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={cn(
                "px-2.5 py-1 text-xs font-medium rounded-full border capitalize transition-all",
                statusFilter === s
                  ? "bg-primary text-primary-foreground border-primary shadow-sm"
                  : "bg-muted/50 text-muted-foreground border-border/60 hover:bg-muted",
              )}
            >
              {s}
            </button>
          ))}
        </div>

        {/* Category filter */}
        {categories && categories.length > 0 && (
          <div className="flex flex-wrap gap-1">
            <button
              onClick={() => setCategoryFilter(null)}
              className={cn(
                "px-2.5 py-1 text-xs font-medium rounded-full border transition-all",
                categoryFilter === null
                  ? "bg-foreground text-background border-foreground shadow-sm"
                  : "bg-muted/50 text-muted-foreground border-border/60 hover:bg-muted",
              )}
            >
              All categories
            </button>
            {(categories as Category[]).map((cat) => (
              <button
                key={cat.id}
                onClick={() =>
                  setCategoryFilter(categoryFilter === cat.id ? null : cat.id)
                }
                className={cn(
                  "flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full border transition-all",
                  categoryFilter === cat.id
                    ? "bg-foreground text-background border-foreground shadow-sm"
                    : "bg-muted/50 text-foreground border-border/60 hover:bg-muted",
                )}
              >
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: cat.color ?? "#6366F1" }}
                />
                {cat.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Pay period navigator */}
      {tab === "period" && payPeriod && (
        <div className="flex items-center gap-3 rounded-lg border bg-muted/30 px-3 py-2">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setPeriodOffset((o) => o - 1)}
            aria-label="Previous pay period"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1 text-center text-sm font-medium">
            {payPeriod.start.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })}{" "}
            –{" "}
            {payPeriod.end.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
            {periodOffset === 0 && (
              <span className="ml-2 text-xs text-primary">Current</span>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setPeriodOffset((o) => o + 1)}
            aria-label="Next pay period"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          {periodOffset !== 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPeriodOffset(0)}
            >
              Current
            </Button>
          )}
        </div>
      )}

      {/* Bulk action bar */}
      {selectionMode && (
        <div className="sticky top-2 z-10 flex items-center gap-3 rounded-xl border bg-primary/10 px-4 py-2 shadow-md backdrop-blur-sm">
          <span className="text-sm font-medium">
            {selected.size} selected
          </span>
          <span className="text-xs text-muted-foreground">
            Total:{" "}
            <span className="font-semibold text-foreground tabular-nums">
              {formatCurrency(
                filtered
                  .filter((b) => selected.has(b.id))
                  .reduce((s, b) => s + parseFloat(b.amount), 0),
              )}
            </span>
          </span>
          <div className="flex-1" />
          <Button
            size="sm"
            onClick={handleBulkMarkPaid}
            disabled={bulkMarkPaid.isPending}
          >
            <Check className="mr-1.5 h-3.5 w-3.5" />
            Mark all paid
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelected(new Set())}
          >
            Clear
          </Button>
        </div>
      )}

      {/* List */}
      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-[74px] w-full rounded-xl" />
          <Skeleton className="h-[74px] w-full rounded-xl" />
          <Skeleton className="h-[74px] w-full rounded-xl" />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState hasBills={allBills.length > 0} onCreate={openCreate} />
      ) : (
        <>
          {/* Select-all toggle */}
          <div className="flex items-center gap-2 px-1">
            <button
              onClick={() => {
                if (selected.size === filtered.length) setSelected(new Set());
                else setSelected(new Set(filtered.map((b) => b.id)));
              }}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              {selected.size === filtered.length
                ? "Deselect all"
                : "Select all"}
            </button>
            <span className="text-xs text-muted-foreground">
              · {filtered.length} bill{filtered.length !== 1 ? "s" : ""} ·{" "}
              <span className="font-semibold text-foreground tabular-nums">
                {formatCurrency(
                  filtered.reduce((s, b) => s + parseFloat(b.amount), 0),
                )}
              </span>
            </span>
          </div>
          <div className="space-y-2">
            {filtered.map((bill) => (
              <BillCard
                key={bill.id}
                bill={bill}
                category={
                  bill.categoryId ? catMap.get(bill.categoryId) ?? null : null
                }
                selected={selected.has(bill.id)}
                onToggleSelect={() => toggleSelect(bill.id)}
                onEdit={() => openEdit(bill)}
                selectionMode={selectionMode || selected.size > 0}
              />
            ))}
          </div>
        </>
      )}

      <BillDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        bill={editing ?? undefined}
      />
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  iconBg,
  iconColor,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  iconBg: string;
  iconColor: string;
}) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br",
            iconBg,
            iconColor,
          )}
        >
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs text-muted-foreground truncate">{label}</p>
          <p className="text-lg font-semibold tabular-nums truncate">
            {value}
          </p>
        </div>
      </div>
    </Card>
  );
}

function EmptyState({
  hasBills,
  onCreate,
}: {
  hasBills: boolean;
  onCreate: () => void;
}) {
  if (!hasBills) {
    return (
      <div className="mt-12 flex flex-col items-center text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500/15 to-emerald-500/5">
          <Wallet className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
        </div>
        <h3 className="text-base font-medium">Track what you owe</h3>
        <p className="mt-1 text-sm text-muted-foreground max-w-sm">
          Add bills with due dates and amounts. Tag with categories you create
          on the fly. See what&apos;s coming up each paycheck.
        </p>
        <Button className="mt-5" onClick={onCreate}>
          <Plus className="mr-1.5 h-4 w-4" />
          Add your first bill
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center py-12 text-center">
      <p className="text-sm text-muted-foreground">
        No bills match the current filters.
      </p>
    </div>
  );
}

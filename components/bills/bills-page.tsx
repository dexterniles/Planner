"use client";

import { useMemo, useState } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { Check, Plus, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { FilterChip } from "@/components/ui/filter-chip";
import { SectionHeader } from "@/components/ui/section-header";
import { cn } from "@/lib/utils";
import { useBills, useBulkMarkPaid } from "@/lib/hooks/use-bills";
import { useBillCategories } from "@/lib/hooks/use-bill-categories";
import { usePaySchedule } from "@/lib/hooks/use-pay-schedule";
import { useIncomeList } from "@/lib/hooks/use-income";
import { BillCard, type BillCardData } from "@/components/bills/bill-card";
import { BillDialog } from "@/components/bills/bill-dialog";
import {
  IncomeCard,
  type IncomeCardData,
} from "@/components/bills/income-card";
import { IncomeDialog } from "@/components/bills/income-dialog";
import { PayPeriodNav } from "@/components/bills/pay-period-nav";
import { INCOME_KIND_LABELS } from "@/components/bills/income-utils";
import {
  formatCurrency,
  getPayPeriod,
  isOverdue,
  shiftPayPeriod,
  toISODate,
} from "@/components/bills/bill-utils";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/page-header";
import type { PayFrequency } from "@/lib/validations/bill";
import type { IncomeKind } from "@/lib/validations/income";
import {
  SavedViewsButton,
  SavedViewsStrip,
} from "@/components/layout/saved-views";

type Tab = "all" | "period" | "income";
type StatusFilter = "all" | "unpaid" | "overdue" | "paid" | "skipped";
type IncomeKindFilter = "all" | IncomeKind;

const TAB_VALUES = ["all", "period", "income"] as const;
const STATUS_VALUES = [
  "all",
  "unpaid",
  "overdue",
  "paid",
  "skipped",
] as const;
const INCOME_KIND_FILTERS: IncomeKindFilter[] = ["all", "paycheck", "misc"];

interface Category {
  id: string;
  name: string;
  color: string | null;
}

export function BillsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const [billDialogOpen, setBillDialogOpen] = useState(false);
  const [editingBill, setEditingBill] = useState<BillCardData | null>(null);
  const [incomeDialogOpen, setIncomeDialogOpen] = useState(false);
  const [editingIncome, setEditingIncome] = useState<IncomeCardData | null>(
    null,
  );
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const tabParam = searchParams.get("tab");
  const tab: Tab = TAB_VALUES.includes(tabParam as Tab)
    ? (tabParam as Tab)
    : "all";

  const statusParam = searchParams.get("status");
  const statusFilter: StatusFilter = STATUS_VALUES.includes(
    statusParam as StatusFilter,
  )
    ? (statusParam as StatusFilter)
    : "all";

  const categoryFilter = searchParams.get("category");

  const periodParam = searchParams.get("period");
  const periodOffset = periodParam ? parseInt(periodParam, 10) || 0 : 0;

  const incomeKindParam = searchParams.get("incomeKind");
  const incomeKindFilter: IncomeKindFilter = (
    INCOME_KIND_FILTERS as readonly string[]
  ).includes(incomeKindParam ?? "")
    ? (incomeKindParam as IncomeKindFilter)
    : "all";

  const setParam = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams);
    if (!value) params.delete(key);
    else params.set(key, value);
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  const setTab = (next: Tab) =>
    setParam("tab", next === "all" ? null : next);
  const setStatusFilter = (next: StatusFilter) =>
    setParam("status", next === "all" ? null : next);
  const setCategoryFilter = (next: string | null) =>
    setParam("category", next);
  const setPeriodOffset = (next: number) =>
    setParam("period", next === 0 ? null : String(next));
  const setIncomeKindFilter = (next: IncomeKindFilter) =>
    setParam("incomeKind", next === "all" ? null : next);

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

  const periodStartStr = payPeriod ? toISODate(payPeriod.start) : null;
  const periodEndStr = payPeriod ? toISODate(payPeriod.end) : null;

  // Income — scope depends on tab.
  // - Period tab: scope to the active period.
  // - Income tab: scope to the period when a pay schedule exists, else all-time.
  // - All bills tab: don't fetch period-scoped income (use a separate all-time
  //   fetch only when needed for the empty-state CTA — handled below).
  const incomeScopedFrom =
    tab === "period"
      ? periodStartStr ?? undefined
      : tab === "income" && payPeriod
        ? periodStartStr ?? undefined
        : undefined;
  const incomeScopedTo =
    tab === "period"
      ? periodEndStr ?? undefined
      : tab === "income" && payPeriod
        ? periodEndStr ?? undefined
        : undefined;
  const incomeScopedKind =
    tab === "income" && incomeKindFilter !== "all"
      ? incomeKindFilter
      : undefined;

  const incomeListEnabled = tab === "period" || tab === "income";
  const { data: scopedIncome, isLoading: incomeLoading } = useIncomeList({
    from: incomeScopedFrom,
    to: incomeScopedTo,
    kind: incomeScopedKind,
    enabled: incomeListEnabled,
  });

  // Lightweight all-time income query so we know whether to show the
  // "Log your first income" empty CTA. Only needed on the Income tab.
  const { data: allTimeIncome } = useIncomeList({ enabled: tab === "income" });

  const allBills = useMemo(
    () => (bills ?? []) as BillCardData[],
    [bills],
  );

  const allIncome = useMemo(
    () => (scopedIncome ?? []) as IncomeCardData[],
    [scopedIncome],
  );

  // Bills filtered client-side by tab, status, category. Stats read from `allBills` (unfiltered).
  const filtered = useMemo(() => {
    let list = allBills;

    if (tab === "period" && payPeriod) {
      const startStr = toISODate(payPeriod.start);
      const endStr = toISODate(payPeriod.end);
      list = list.filter((b) => b.dueDate >= startStr && b.dueDate <= endStr);
    }

    if (statusFilter === "overdue") {
      list = list.filter((b) => isOverdue(b.dueDate, b.status));
    } else if (statusFilter !== "all") {
      list = list.filter((b) => b.status === statusFilter);
    }

    if (categoryFilter) {
      list = list.filter((b) => b.categoryId === categoryFilter);
    }

    return list;
  }, [allBills, tab, payPeriod, statusFilter, categoryFilter]);

  // Income filtered by client-side kind on the income tab (scoped query already
  // applies the date window — kind is also passed through but we filter again
  // here as a safety net so the UI is in lockstep with the chip).
  const filteredIncome = useMemo(() => {
    if (incomeKindFilter === "all") return allIncome;
    return allIncome.filter((i) => i.kind === incomeKindFilter);
  }, [allIncome, incomeKindFilter]);

  // Period-scoped totals for the summary band (period tab only).
  const periodSummary = useMemo(() => {
    if (tab !== "period" || !payPeriod) return null;
    const startStr = toISODate(payPeriod.start);
    const endStr = toISODate(payPeriod.end);

    const billsTotal = allBills
      .filter((b) => b.dueDate >= startStr && b.dueDate <= endStr)
      .reduce((sum, b) => sum + parseFloat(b.amount), 0);

    // For the period summary we want ALL income in window, ignoring the
    // (income-tab-only) kind filter.
    const incomeTotal = allIncome.reduce(
      (sum, i) => sum + parseFloat(i.amount),
      0,
    );

    return {
      income: incomeTotal,
      bills: billsTotal,
      net: incomeTotal - billsTotal,
    };
  }, [tab, payPeriod, allBills, allIncome]);

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

  // Sticky bulk action bar shows when anything is selected; the per-row
  // checkbox is always rendered (low contrast → full when selected).
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

  const openCreateBill = () => {
    setEditingBill(null);
    setBillDialogOpen(true);
  };

  const openEditBill = (bill: BillCardData) => {
    setEditingBill(bill);
    setBillDialogOpen(true);
  };

  const openLogIncome = () => {
    setEditingIncome(null);
    setIncomeDialogOpen(true);
  };

  const openEditIncome = (income: IncomeCardData) => {
    setEditingIncome(income);
    setIncomeDialogOpen(true);
  };

  const incomeTotal = filteredIncome.reduce(
    (s, i) => s + parseFloat(i.amount),
    0,
  );

  const hasAnyIncome = (allTimeIncome ?? []).length > 0;

  return (
    <div>
      <PageHeader
        title="Bills"
        actions={
          <>
            <Button variant="outline" size="sm" onClick={openLogIncome}>
              <Plus className="mr-1.5 h-3 w-3" />
              Log income
            </Button>
            <Button size="sm" onClick={openCreateBill}>
              <Plus className="mr-1.5 h-3 w-3" />
              New bill
            </Button>
          </>
        }
      />

      <div className="space-y-5">
        {/* Stats row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 lg:divide-x divide-border/60 gap-y-2">
          <StatTile
            label="Due this month"
            value={formatCurrency(stats.dueThisMonth)}
          />
          <StatTile
            label="Paid this month"
            value={formatCurrency(stats.paidThisMonth)}
          />
          <StatTile
            label="Overdue"
            value={String(stats.overdueCount)}
            tone={stats.overdueCount > 0 ? "danger" : "muted"}
          />
          <StatTile
            label="Min. needed (2 periods)"
            value={
              stats.minimumNeeded != null
                ? formatCurrency(stats.minimumNeeded)
                : "Set schedule"
            }
            tone={stats.minimumNeeded == null ? "muted" : "default"}
          />
        </div>

        {/* Tabs: All bills / Pay period / Income */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="inline-flex rounded-md border border-border/60 p-[3px] gap-[2px]">
            <button
              onClick={() => setTab("all")}
              className={cn(
                "px-3 py-1 text-[12.5px] font-medium rounded-[5px] transition-colors",
                tab === "all"
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              All bills
            </button>
            <button
              onClick={() => setTab("period")}
              disabled={!paySchedule}
              className={cn(
                "px-3 py-1 text-[12.5px] font-medium rounded-[5px] transition-colors disabled:opacity-50",
                tab === "period"
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
              title={
                !paySchedule
                  ? "Set your pay schedule in Settings to enable this view"
                  : undefined
              }
            >
              Pay period
            </button>
            <button
              onClick={() => setTab("income")}
              className={cn(
                "px-3 py-1 text-[12.5px] font-medium rounded-[5px] transition-colors",
                tab === "income"
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              Income
            </button>
          </div>

          {/* Bills filters — hidden on Income tab */}
          {tab !== "income" && (
            <>
              <div className="flex flex-wrap gap-1">
                {STATUS_VALUES.map((s) => (
                  <FilterChip
                    key={s}
                    active={statusFilter === s}
                    onClick={() => setStatusFilter(s)}
                    className="capitalize"
                  >
                    {s}
                  </FilterChip>
                ))}
              </div>

              {categories && categories.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  <FilterChip
                    active={categoryFilter === null}
                    onClick={() => setCategoryFilter(null)}
                  >
                    All categories
                  </FilterChip>
                  {(categories as Category[]).map((cat) => (
                    <FilterChip
                      key={cat.id}
                      active={categoryFilter === cat.id}
                      onClick={() =>
                        setCategoryFilter(
                          categoryFilter === cat.id ? null : cat.id,
                        )
                      }
                    >
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: cat.color ?? "#6366F1" }}
                      />
                      {cat.name}
                    </FilterChip>
                  ))}
                </div>
              )}
            </>
          )}

          {/* Income kind filter — only on Income tab */}
          {tab === "income" && (
            <div className="flex flex-wrap gap-1">
              {INCOME_KIND_FILTERS.map((k) => (
                <FilterChip
                  key={k}
                  active={incomeKindFilter === k}
                  onClick={() => setIncomeKindFilter(k)}
                >
                  {k === "all" ? "All" : INCOME_KIND_LABELS[k]}
                </FilterChip>
              ))}
            </div>
          )}

          <div className="ml-auto">
            <SavedViewsButton routeKey="bills" />
          </div>
        </div>

        <SavedViewsStrip routeKey="bills" />

        {/* Pay period nav — period tab (with summary) and income tab (when schedule exists) */}
        {tab === "period" && payPeriod && (
          <PayPeriodNav
            payPeriod={payPeriod}
            periodOffset={periodOffset}
            onChange={setPeriodOffset}
            summary={
              periodSummary ? (
                <PeriodSummaryBand summary={periodSummary} />
              ) : null
            }
          />
        )}
        {tab === "income" && payPeriod && (
          <PayPeriodNav
            payPeriod={payPeriod}
            periodOffset={periodOffset}
            onChange={setPeriodOffset}
          />
        )}

        {/* Bulk action bar (bills tabs only) */}
        {tab !== "income" && selectionMode && (
          <div className="sticky top-2 z-10 flex flex-wrap items-center gap-x-3 gap-y-2 rounded-md border border-border/60 bg-background/95 px-4 py-2 shadow-md backdrop-blur-sm">
            <span className="text-[13px] font-medium tabular-nums">
              {selected.size} selected
            </span>
            <span className="text-[11.5px] text-muted-foreground">
              Total{" "}
              <span className="text-[13px] font-medium text-foreground tabular-nums">
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
              <Check className="mr-1.5 h-3 w-3" />
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

        {/* Body */}
        {tab === "income" ? (
          <IncomeTabBody
            isLoading={incomeLoading}
            incomes={filteredIncome}
            total={incomeTotal}
            hasAnyIncome={hasAnyIncome}
            onCreate={openLogIncome}
            onEdit={openEditIncome}
          />
        ) : (
          <>
            {/* Period view: Income section sits above bills */}
            {tab === "period" && payPeriod && (
              <PeriodIncomeSection
                isLoading={incomeLoading}
                incomes={allIncome}
                onLogIncome={openLogIncome}
                onEdit={openEditIncome}
              />
            )}

            {/* Bills list */}
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-[68px] w-full rounded-md" />
                <Skeleton className="h-[68px] w-full rounded-md" />
                <Skeleton className="h-[68px] w-full rounded-md" />
              </div>
            ) : filtered.length === 0 ? (
              <BillsEmptyState
                hasBills={allBills.length > 0}
                onCreate={openCreateBill}
              />
            ) : (
              <>
                {tab === "period" && <SectionHeader label="BILLS DUE" />}
                {/* Select-all toggle */}
                <div className="flex items-center gap-2 px-1">
                  <button
                    onClick={() => {
                      if (selected.size === filtered.length)
                        setSelected(new Set());
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
                        filtered.reduce(
                          (s, b) => s + parseFloat(b.amount),
                          0,
                        ),
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
                        bill.categoryId
                          ? catMap.get(bill.categoryId) ?? null
                          : null
                      }
                      selected={selected.has(bill.id)}
                      onToggleSelect={() => toggleSelect(bill.id)}
                      onEdit={() => openEditBill(bill)}
                      selectionMode={selectionMode}
                    />
                  ))}
                </div>
              </>
            )}
          </>
        )}

        <BillDialog
          open={billDialogOpen}
          onOpenChange={setBillDialogOpen}
          bill={editingBill ?? undefined}
        />
        <IncomeDialog
          open={incomeDialogOpen}
          onOpenChange={setIncomeDialogOpen}
          income={editingIncome ?? undefined}
        />
      </div>
    </div>
  );
}

function PeriodSummaryBand({
  summary,
}: {
  summary: { income: number; bills: number; net: number };
}) {
  const netPositive = summary.net > 0;
  const netNegative = summary.net < 0;
  const sign = netPositive ? "+" : netNegative ? "-" : "";
  const netDisplay = `${sign}${formatCurrency(Math.abs(summary.net))}`;
  return (
    <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[12.5px] tabular-nums">
      <span className="text-muted-foreground">
        Income{" "}
        <span className="font-medium text-emerald-600 dark:text-emerald-500">
          {formatCurrency(summary.income)}
        </span>
      </span>
      <span className="text-muted-foreground/50">·</span>
      <span className="text-muted-foreground">
        Bills{" "}
        <span className="font-medium text-foreground">
          {formatCurrency(summary.bills)}
        </span>
      </span>
      <span className="text-muted-foreground/50">·</span>
      <span
        className={cn(
          "font-medium",
          netPositive && "text-emerald-600 dark:text-emerald-500",
          netNegative && "text-destructive",
          !netPositive && !netNegative && "text-muted-foreground",
        )}
      >
        Net {netDisplay}
      </span>
    </div>
  );
}

function PeriodIncomeSection({
  isLoading,
  incomes,
  onLogIncome,
  onEdit,
}: {
  isLoading: boolean;
  incomes: IncomeCardData[];
  onLogIncome: () => void;
  onEdit: (i: IncomeCardData) => void;
}) {
  return (
    <div className="space-y-2">
      <SectionHeader
        label="INCOME"
        action={
          <button
            onClick={onLogIncome}
            className="text-[11px] text-muted-foreground transition-colors hover:text-foreground"
          >
            + Log income
          </button>
        }
      />
      {isLoading ? (
        <Skeleton className="h-[68px] w-full rounded-md" />
      ) : incomes.length === 0 ? (
        <div className="rounded-md border border-dashed border-border/60 px-4 py-5 text-center">
          <p className="text-[13px] text-muted-foreground">
            No income logged for this period yet.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={onLogIncome}
            className="mt-2"
          >
            <Plus className="mr-1.5 h-3 w-3" />
            Log income
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {incomes.map((income) => (
            <IncomeCard
              key={income.id}
              income={income}
              onEdit={() => onEdit(income)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function IncomeTabBody({
  isLoading,
  incomes,
  total,
  hasAnyIncome,
  onCreate,
  onEdit,
}: {
  isLoading: boolean;
  incomes: IncomeCardData[];
  total: number;
  hasAnyIncome: boolean;
  onCreate: () => void;
  onEdit: (i: IncomeCardData) => void;
}) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-[68px] w-full rounded-md" />
        <Skeleton className="h-[68px] w-full rounded-md" />
        <Skeleton className="h-[68px] w-full rounded-md" />
      </div>
    );
  }
  if (incomes.length === 0) {
    return <IncomeEmptyState hasAnyIncome={hasAnyIncome} onCreate={onCreate} />;
  }
  return (
    <>
      <div className="flex items-center gap-2 px-1">
        <span className="text-xs text-muted-foreground">
          {incomes.length} entr{incomes.length !== 1 ? "ies" : "y"} ·{" "}
          <span className="font-semibold text-emerald-600 dark:text-emerald-500 tabular-nums">
            {formatCurrency(total)}
          </span>
        </span>
      </div>
      <div className="space-y-2">
        {incomes.map((income) => (
          <IncomeCard
            key={income.id}
            income={income}
            onEdit={() => onEdit(income)}
          />
        ))}
      </div>
    </>
  );
}

function StatTile({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "danger" | "muted";
}) {
  return (
    <div className="flex flex-col gap-1 px-3 py-2 lg:py-0 lg:first:pl-0 lg:last:pr-0">
      <p className="text-[10.5px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
        {label}
      </p>
      <p
        className={cn(
          "text-[18px] font-medium leading-none tabular-nums truncate",
          tone === "danger" && "text-destructive",
          tone === "muted" && "text-muted-foreground",
        )}
      >
        {value}
      </p>
    </div>
  );
}

function BillsEmptyState({
  hasBills,
  onCreate,
}: {
  hasBills: boolean;
  onCreate: () => void;
}) {
  if (!hasBills) {
    return (
      <div className="mt-12 flex flex-col items-center text-center">
        <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-md bg-muted">
          <Wallet
            className="h-5 w-5 text-muted-foreground"
            strokeWidth={1.75}
          />
        </div>
        <h3 className="text-[15px] font-semibold tracking-tight">
          Track what you owe
        </h3>
        <p className="mt-1 max-w-sm text-[13px] text-muted-foreground">
          Add bills with due dates and amounts. Tag with categories you create
          on the fly. See what&apos;s coming up each paycheck.
        </p>
        <Button size="sm" className="mt-4" onClick={onCreate}>
          <Plus className="mr-1.5 h-3 w-3" />
          Add your first bill
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center py-12 text-center">
      <p className="text-[13px] text-muted-foreground">
        No bills match the current filters.
      </p>
    </div>
  );
}

function IncomeEmptyState({
  hasAnyIncome,
  onCreate,
}: {
  hasAnyIncome: boolean;
  onCreate: () => void;
}) {
  if (!hasAnyIncome) {
    return (
      <div className="mt-12 flex flex-col items-center text-center">
        <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-md bg-emerald-500/10">
          <Wallet
            className="h-5 w-5 text-emerald-600 dark:text-emerald-500"
            strokeWidth={1.75}
          />
        </div>
        <h3 className="text-[15px] font-semibold tracking-tight">
          Track money in
        </h3>
        <p className="mt-1 max-w-sm text-[13px] text-muted-foreground">
          Log paychecks and misc income as they come in. See income vs bills
          for each pay period.
        </p>
        <Button size="sm" className="mt-4" onClick={onCreate}>
          <Plus className="mr-1.5 h-3 w-3" />
          Log your first income
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center py-12 text-center">
      <p className="text-[13px] text-muted-foreground">
        No income matches the current filters.
      </p>
    </div>
  );
}

import type { BillStatus, PayFrequency } from "@/lib/validations/bill";

const usd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

export function formatCurrency(value: string | number | null | undefined): string {
  if (value == null || value === "") return "—";
  const n = typeof value === "string" ? parseFloat(value) : value;
  if (isNaN(n)) return "—";
  return usd.format(n);
}

export function formatDueDate(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map((s) => parseInt(s, 10));
  return new Date(y, m - 1, d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatDueShort(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map((s) => parseInt(s, 10));
  const date = new Date(y, m - 1, d);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const diffDays = Math.round(
    (date.getTime() - now.getTime()) / 86400000,
  );
  if (diffDays === 0) return "Today";
  if (diffDays === -1) return "Yesterday";
  if (diffDays === 1) return "Tomorrow";
  if (diffDays < 0) return `${Math.abs(diffDays)}d overdue`;
  if (diffDays < 7) return `In ${diffDays}d`;
  if (diffDays < 30) return `In ${Math.floor(diffDays / 7)}w`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function isOverdue(dueDate: string, status: BillStatus): boolean {
  if (status !== "unpaid") return false;
  const todayStr = new Date().toISOString().slice(0, 10);
  return dueDate < todayStr;
}

export const statusLabels: Record<BillStatus, string> = {
  unpaid: "Unpaid",
  paid: "Paid",
  skipped: "Skipped",
};

/**
 * Given a pay frequency and a known reference payday, compute the
 * payday that starts the period containing `today`, and the next payday.
 */
export function getPayPeriod(
  referenceDate: string,
  frequency: PayFrequency,
  target: Date = new Date(),
): { start: Date; end: Date } {
  const [y, m, d] = referenceDate.split("-").map((s) => parseInt(s, 10));
  const ref = new Date(y, m - 1, d);

  const periodDays =
    frequency === "weekly" ? 7 : frequency === "biweekly" ? 14 : null;

  if (periodDays) {
    // Compute how many periods from reference to target
    const diffDays = Math.floor(
      (target.getTime() - ref.getTime()) / 86400000,
    );
    const periodsElapsed = Math.floor(diffDays / periodDays);
    const start = new Date(ref);
    start.setDate(ref.getDate() + periodsElapsed * periodDays);
    const end = new Date(start);
    end.setDate(start.getDate() + periodDays - 1);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  }

  // Monthly: period starts on the reference day-of-month of the current
  // target month (or most recent month that contains the target).
  const refDay = ref.getDate();
  const start = new Date(target.getFullYear(), target.getMonth(), refDay);
  if (start > target) start.setMonth(start.getMonth() - 1);
  const end = new Date(start);
  end.setMonth(end.getMonth() + 1);
  end.setDate(end.getDate() - 1);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

export function shiftPayPeriod(
  referenceDate: string,
  frequency: PayFrequency,
  periodStart: Date,
  deltaPeriods: number,
): Date {
  const next = new Date(periodStart);
  if (frequency === "weekly") next.setDate(next.getDate() + 7 * deltaPeriods);
  else if (frequency === "biweekly")
    next.setDate(next.getDate() + 14 * deltaPeriods);
  else next.setMonth(next.getMonth() + deltaPeriods);
  return next;
}

export function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Get the first letter of a category name, uppercase, for monogram display. */
export function categoryInitial(name: string): string {
  return (name.trim().charAt(0) || "?").toUpperCase();
}

export const defaultCategoryColor = "#6366F1";

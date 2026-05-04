import { Banknote, Wallet, type LucideIcon } from "lucide-react";
import type { IncomeKind } from "@/lib/validations/income";

export const INCOME_KIND_LABELS: Record<IncomeKind, string> = {
  paycheck: "Paycheck",
  misc: "Misc",
};

export const INCOME_KIND_ICONS: Record<IncomeKind, LucideIcon> = {
  paycheck: Wallet,
  misc: Banknote,
};

export function formatReceivedShort(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map((s) => parseInt(s, 10));
  const date = new Date(y, m - 1, d);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const diffDays = Math.round((now.getTime() - date.getTime()) / 86400000);
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays > 0 && diffDays < 7) return `${diffDays}d ago`;
  if (diffDays > 0 && diffDays < 30)
    return `${Math.floor(diffDays / 7)}w ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

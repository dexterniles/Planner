"use client";

import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useDeleteIncome } from "@/lib/hooks/use-income";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { formatCurrency } from "./bill-utils";
import {
  INCOME_KIND_ICONS,
  INCOME_KIND_LABELS,
  formatReceivedShort,
} from "./income-utils";
import { toast } from "sonner";
import type { IncomeKind } from "@/lib/validations/income";

export interface IncomeCardData {
  id: string;
  kind: IncomeKind;
  receivedDate: string;
  amount: string;
  source: string | null;
  notes: string | null;
}

interface IncomeCardProps {
  income: IncomeCardData;
  onEdit: () => void;
}

export function IncomeCard({ income, onEdit }: IncomeCardProps) {
  const deleteIncome = useDeleteIncome();
  const confirm = useConfirm();

  const Icon = INCOME_KIND_ICONS[income.kind];
  const kindLabel = INCOME_KIND_LABELS[income.kind];

  const handleDelete = async () => {
    if (
      !(await confirm({
        title: `Delete this ${kindLabel.toLowerCase()}?`,
        description: "This income entry will be removed from your tracker.",
        destructive: true,
      }))
    ) {
      return;
    }
    try {
      await deleteIncome.mutateAsync(income.id);
      toast.success("Income deleted");
    } catch {
      // useDeleteIncome surfaces the toast already on error
    }
  };

  return (
    <div
      className={cn(
        "group relative flex items-center gap-3 rounded-xl border bg-card px-4 py-3 shadow-sm transition-all",
      )}
    >
      {/* Kind icon */}
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-500">
        <Icon className="h-4 w-4" strokeWidth={1.75} />
      </div>

      {/* Main content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="text-[14px] font-medium leading-tight truncate">
            {income.source?.trim() || kindLabel}
          </h3>
          <Badge
            variant="outline"
            className="text-[10px] uppercase tracking-[0.08em]"
          >
            {kindLabel}
          </Badge>
        </div>
        {income.notes && (
          <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[11.5px] text-muted-foreground truncate">
            <span className="truncate">{income.notes}</span>
          </div>
        )}
      </div>

      {/* Received date */}
      <span className="hidden sm:inline text-[12px] tabular-nums whitespace-nowrap shrink-0 text-muted-foreground">
        {formatReceivedShort(income.receivedDate)}
      </span>

      {/* Amount */}
      <div className="text-right shrink-0">
        <p className="font-serif text-[18px] font-medium leading-none tabular-nums tracking-tight text-emerald-600 dark:text-emerald-500">
          +{formatCurrency(income.amount)}
        </p>
      </div>

      {/* Actions */}
      <div className="flex gap-1 shrink-0 md:opacity-60 md:group-hover:opacity-100 md:group-focus-within:opacity-100 transition-opacity">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onEdit}
          aria-label="Edit income"
        >
          <Pencil className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={handleDelete}
          disabled={deleteIncome.isPending}
          className="text-destructive"
          aria-label="Delete income"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

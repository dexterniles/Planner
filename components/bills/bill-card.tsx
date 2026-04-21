"use client";

import { Check, Pencil, Repeat, Trash2, Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  useDeleteBill,
  useUpdateBill,
} from "@/lib/hooks/use-bills";
import {
  categoryInitial,
  defaultCategoryColor,
  formatCurrency,
  formatDueShort,
  isOverdue,
} from "./bill-utils";
import { toast } from "sonner";
import type { BillStatus } from "@/lib/validations/bill";

export interface BillCardData {
  id: string;
  name: string;
  amount: string;
  categoryId: string | null;
  dueDate: string;
  status: BillStatus;
  paidAt: string | null;
  recurrenceRuleId: string | null;
  notes: string | null;
}

interface Category {
  id: string;
  name: string;
  color: string | null;
}

interface BillCardProps {
  bill: BillCardData;
  category: Category | null;
  selected: boolean;
  onToggleSelect: () => void;
  onEdit: () => void;
  selectionMode: boolean;
}

export function BillCard({
  bill,
  category,
  selected,
  onToggleSelect,
  onEdit,
  selectionMode,
}: BillCardProps) {
  const updateBill = useUpdateBill();
  const deleteBill = useDeleteBill();

  const overdue = isOverdue(bill.dueDate, bill.status);
  const paid = bill.status === "paid";
  const skipped = bill.status === "skipped";

  const categoryColor = category?.color ?? defaultCategoryColor;

  const markPaid = async () => {
    try {
      await updateBill.mutateAsync({
        id: bill.id,
        data: { status: "paid" },
      });
      toast.success(`Paid: ${bill.name}`);
    } catch {
      toast.error("Failed to mark paid");
    }
  };

  const markUnpaid = async () => {
    try {
      await updateBill.mutateAsync({
        id: bill.id,
        data: { status: "unpaid" },
      });
      toast.success("Marked unpaid");
    } catch {
      toast.error("Failed");
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Delete "${bill.name}"?`)) return;
    try {
      await deleteBill.mutateAsync(bill.id);
      toast.success("Bill deleted");
    } catch {
      toast.error("Failed to delete");
    }
  };

  return (
    <div
      className={cn(
        "group relative flex items-center gap-3 rounded-xl border bg-card px-4 py-3 shadow-sm transition-all",
        selected && "ring-2 ring-primary/50 border-primary/40",
        paid && "opacity-60",
        skipped && "opacity-50",
        overdue && !selected && "border-red-500/40",
      )}
    >
      {/* Selection checkbox */}
      {selectionMode && (
        <input
          type="checkbox"
          checked={selected}
          onChange={onToggleSelect}
          aria-label={`Select ${bill.name}`}
          className="h-4 w-4 rounded border-input accent-primary cursor-pointer shrink-0"
        />
      )}

      {/* Category avatar */}
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-sm font-bold text-white"
        style={{ backgroundColor: categoryColor }}
      >
        {category ? categoryInitial(category.name) : "$"}
      </div>

      {/* Main content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h3
            className={cn(
              "font-semibold leading-tight truncate",
              paid && "line-through",
            )}
          >
            {bill.name}
          </h3>
          {bill.recurrenceRuleId && (
            <Repeat className="h-3 w-3 text-primary shrink-0" />
          )}
          {overdue && (
            <Badge
              variant="destructive"
              className="text-[10px] uppercase tracking-wide"
            >
              Overdue
            </Badge>
          )}
          {paid && (
            <Badge
              variant="secondary"
              className="text-[10px] uppercase tracking-wide"
            >
              Paid
            </Badge>
          )}
          {skipped && (
            <Badge
              variant="outline"
              className="text-[10px] uppercase tracking-wide"
            >
              Skipped
            </Badge>
          )}
        </div>
        <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          {category && <span>{category.name}</span>}
          <span
            className={cn(
              "tabular-nums",
              overdue && "text-red-600 dark:text-red-400 font-medium",
            )}
          >
            {formatDueShort(bill.dueDate)}
          </span>
        </div>
      </div>

      {/* Amount */}
      <div className="text-right shrink-0">
        <p className="text-base font-semibold tabular-nums">
          {formatCurrency(bill.amount)}
        </p>
      </div>

      {/* Actions */}
      <div className="flex gap-1 shrink-0 md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100 transition-opacity">
        {bill.status === "unpaid" ? (
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={markPaid}
            disabled={updateBill.isPending}
            className="text-emerald-600 dark:text-emerald-400"
            aria-label={`Mark ${bill.name} as paid`}
            title="Mark as paid"
          >
            <Check className="h-4 w-4" />
          </Button>
        ) : bill.status === "paid" ? (
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={markUnpaid}
            disabled={updateBill.isPending}
            aria-label={`Unmark ${bill.name} as paid`}
            title="Mark as unpaid"
          >
            <Undo2 className="h-4 w-4" />
          </Button>
        ) : null}
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onEdit}
          aria-label={`Edit ${bill.name}`}
        >
          <Pencil className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={handleDelete}
          disabled={deleteBill.isPending}
          className="text-destructive"
          aria-label={`Delete ${bill.name}`}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

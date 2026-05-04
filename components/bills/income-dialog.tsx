"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { DollarSign } from "lucide-react";
import {
  createIncomeSchema,
  type CreateIncomeInput,
  incomeKindValues,
} from "@/lib/validations/income";
import { useCreateIncome, useUpdateIncome } from "@/lib/hooks/use-income";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { INCOME_KIND_ICONS, INCOME_KIND_LABELS } from "./income-utils";
import { toast } from "sonner";

/** Today's date in the user's local timezone, as YYYY-MM-DD. */
function todayLocalDate(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

interface IncomeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  income?: {
    id: string;
    kind: (typeof incomeKindValues)[number];
    receivedDate: string;
    amount: string;
    source: string | null;
    notes: string | null;
  };
}

export function IncomeDialog({
  open,
  onOpenChange,
  income,
}: IncomeDialogProps) {
  const isEditing = !!income;
  const createIncome = useCreateIncome();
  const updateIncome = useUpdateIncome();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreateIncomeInput>({
    resolver: zodResolver(createIncomeSchema),
    defaultValues: {
      kind: "paycheck",
      receivedDate: todayLocalDate(),
      amount: 0,
      source: "",
      notes: "",
    },
  });

  const currentKind = watch("kind") ?? "paycheck";

  useEffect(() => {
    reset({
      kind: income?.kind ?? "paycheck",
      receivedDate: income?.receivedDate ?? todayLocalDate(),
      amount: income?.amount ? parseFloat(income.amount) : 0,
      source: income?.source ?? "",
      notes: income?.notes ?? "",
    });
  }, [income, open, reset]);

  const onSubmit = async (data: CreateIncomeInput) => {
    try {
      const payload: CreateIncomeInput = {
        ...data,
        source: data.source?.trim() || null,
        notes: data.notes?.trim() || null,
      };

      if (isEditing) {
        await updateIncome.mutateAsync({ id: income.id, data: payload });
        toast.success("Income updated");
      } else {
        await createIncome.mutateAsync(payload);
        toast.success("Income logged");
      }
      onOpenChange(false);
    } catch {
      toast.error(isEditing ? "Failed to update" : "Failed to create");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit income" : "Log income"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Kind segmented control */}
          <div className="space-y-2">
            <Label>Kind</Label>
            <div className="inline-flex w-full rounded-md border border-border bg-card p-[3px] shadow-sm gap-[2px]">
              {incomeKindValues.map((k) => {
                const Icon = INCOME_KIND_ICONS[k];
                return (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setValue("kind", k, { shouldDirty: true })}
                    className={cn(
                      "flex flex-1 items-center justify-center gap-1.5 px-3 py-1.5 text-[12.5px] font-medium rounded-[5px] transition-colors duration-150",
                      currentKind === k
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" strokeWidth={1.75} />
                    {INCOME_KIND_LABELS[k]}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Amount + Received date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount *</Label>
              <div className="relative">
                <DollarSign className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  className="pl-7 tabular-nums"
                  {...register("amount", {
                    setValueAs: (v) =>
                      v === "" || v == null || Number.isNaN(Number(v))
                        ? 0
                        : Number(v),
                  })}
                  placeholder="0.00"
                />
              </div>
              {errors.amount && (
                <p className="text-sm text-destructive">
                  {errors.amount.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="receivedDate">Received *</Label>
              <Input
                id="receivedDate"
                type="date"
                autoFocus={!isEditing}
                {...register("receivedDate")}
              />
              {errors.receivedDate && (
                <p className="text-sm text-destructive">
                  {errors.receivedDate.message}
                </p>
              )}
            </div>
          </div>

          {/* Source */}
          <div className="space-y-2">
            <Label htmlFor="source">Source</Label>
            <Input
              id="source"
              {...register("source")}
              placeholder={
                currentKind === "paycheck"
                  ? "e.g. Acme Corp"
                  : "e.g. Etsy, Tutoring"
              }
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              {...register("notes")}
              placeholder="Optional notes..."
              rows={2}
            />
          </div>

          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>
              Cancel
            </DialogClose>
            <Button
              type="submit"
              disabled={createIncome.isPending || updateIncome.isPending}
            >
              {createIncome.isPending || updateIncome.isPending
                ? "Saving..."
                : isEditing
                  ? "Update"
                  : "Log income"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

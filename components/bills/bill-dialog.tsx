"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { DollarSign } from "lucide-react";
import {
  createBillSchema,
  type CreateBillInput,
  billStatusValues,
} from "@/lib/validations/bill";
import { useCreateBill, useUpdateBill } from "@/lib/hooks/use-bills";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CategoryPicker } from "./category-picker";
import { toast } from "sonner";

const STATUS_LABELS: Record<(typeof billStatusValues)[number], string> = {
  unpaid: "Unpaid",
  paid: "Paid",
  skipped: "Skipped",
};

/** Today's date in the user's local timezone, as YYYY-MM-DD. */
function todayLocalDate(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

const FREQ_LABELS: Record<"weekly" | "biweekly" | "monthly", string> = {
  weekly: "Weekly",
  biweekly: "Every 2 weeks",
  monthly: "Monthly",
};

interface BillDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bill?: {
    id: string;
    name: string;
    description?: string | null;
    amount: string;
    categoryId: string | null;
    dueDate: string;
    status: (typeof billStatusValues)[number];
    paidAt: string | null;
    paidAmount?: string | null;
    notes: string | null;
    color?: string | null;
    recurrenceRuleId: string | null;
  };
}

export function BillDialog({ open, onOpenChange, bill }: BillDialogProps) {
  const isEditing = !!bill;
  const createBill = useCreateBill();
  const updateBill = useUpdateBill();

  const [useRecurrence, setUseRecurrence] = useState(false);
  const [recurFreq, setRecurFreq] =
    useState<"weekly" | "biweekly" | "monthly">("monthly");
  const [recurCount, setRecurCount] = useState<number>(12);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreateBillInput>({
    resolver: zodResolver(createBillSchema),
    defaultValues: {
      name: "",
      description: "",
      amount: 0,
      categoryId: null,
      dueDate: todayLocalDate(),
      status: "unpaid",
      notes: "",
    },
  });

  const currentCategoryId = watch("categoryId") ?? null;
  const currentStatus = watch("status") ?? "unpaid";

  useEffect(() => {
    reset({
      name: bill?.name ?? "",
      description: bill?.description ?? "",
      amount: bill?.amount ? parseFloat(bill.amount) : 0,
      categoryId: bill?.categoryId ?? null,
      dueDate: bill?.dueDate ?? todayLocalDate(),
      status: bill?.status ?? "unpaid",
      notes: bill?.notes ?? "",
    });
    setUseRecurrence(false);
    setRecurFreq("monthly");
    setRecurCount(12);
  }, [bill, open, reset]);

  const onSubmit = async (data: CreateBillInput) => {
    try {
      const payload: CreateBillInput = {
        ...data,
        description: data.description?.trim() || null,
        notes: data.notes?.trim() || null,
      };

      if (isEditing) {
        await updateBill.mutateAsync({ id: bill.id, data: payload });
        toast.success("Bill updated");
      } else {
        if (useRecurrence) {
          payload.recurrence = {
            frequency: recurFreq,
            count: recurCount,
          };
        }
        const result = await createBill.mutateAsync(payload);
        if (payload.recurrence && result.count) {
          toast.success(`Created ${result.count} recurring bills`);
        } else {
          toast.success("Bill created");
        }
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
          <DialogTitle>{isEditing ? "Edit Bill" : "New Bill"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              {...register("name")}
              placeholder="e.g. Rent"
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          {/* Amount + Due date */}
          <div className="grid grid-cols-2 gap-3">
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
            </div>
            <div className="space-y-2">
              <Label htmlFor="dueDate">Due Date *</Label>
              <Input id="dueDate" type="date" {...register("dueDate")} />
            </div>
          </div>

          {/* Category picker */}
          <div className="space-y-2">
            <Label>Category</Label>
            <CategoryPicker
              value={currentCategoryId}
              onChange={(id) => setValue("categoryId", id)}
            />
          </div>

          {/* Status (edit only) */}
          {isEditing && (
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={currentStatus}
                onValueChange={(val) =>
                  setValue(
                    "status",
                    val as (typeof billStatusValues)[number],
                  )
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue>
                    {(value) =>
                      STATUS_LABELS[
                        value as keyof typeof STATUS_LABELS
                      ] ?? value
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {billStatusValues.map((s) => (
                    <SelectItem key={s} value={s}>
                      {STATUS_LABELS[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Recurrence (create only) */}
          {!isEditing && (
            <div className="rounded-lg border border-border/60 bg-muted/30 p-3 space-y-3">
              <div className="flex items-center gap-2">
                <input
                  id="useRecurrence"
                  type="checkbox"
                  checked={useRecurrence}
                  onChange={(e) => setUseRecurrence(e.target.checked)}
                  className="h-4 w-4 rounded border-input accent-primary"
                />
                <Label
                  htmlFor="useRecurrence"
                  className="text-sm font-medium cursor-pointer"
                >
                  Recurring bill
                </Label>
              </div>

              {useRecurrence && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Frequency</Label>
                    <Select
                      value={recurFreq}
                      onValueChange={(v) =>
                        setRecurFreq(
                          v as "weekly" | "biweekly" | "monthly",
                        )
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue>
                          {(value) =>
                            FREQ_LABELS[
                              value as keyof typeof FREQ_LABELS
                            ] ?? value
                          }
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {(
                          ["weekly", "biweekly", "monthly"] as const
                        ).map((f) => (
                          <SelectItem key={f} value={f}>
                            {FREQ_LABELS[f]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Instances</Label>
                    <Input
                      type="number"
                      min="1"
                      max="60"
                      value={recurCount}
                      onChange={(e) =>
                        setRecurCount(parseInt(e.target.value) || 12)
                      }
                    />
                  </div>
                </div>
              )}
            </div>
          )}

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
              disabled={createBill.isPending || updateBill.isPending}
            >
              {createBill.isPending || updateBill.isPending
                ? "Saving..."
                : isEditing
                  ? "Update"
                  : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

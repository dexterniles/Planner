"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  usePaySchedule,
  useUpsertPaySchedule,
  useDeletePaySchedule,
} from "@/lib/hooks/use-pay-schedule";
import { payFrequencyValues } from "@/lib/validations/bill";
import type { PayFrequency } from "@/lib/validations/bill";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { toast } from "sonner";

const FREQ_LABELS: Record<PayFrequency, string> = {
  weekly: "Weekly",
  biweekly: "Every 2 weeks",
  monthly: "Monthly",
};

export function PayScheduleSettings() {
  const { data: existing, isLoading } = usePaySchedule();
  const upsert = useUpsertPaySchedule();
  const remove = useDeletePaySchedule();
  const confirm = useConfirm();

  const [frequency, setFrequency] = useState<PayFrequency>("biweekly");
  const [referenceDate, setReferenceDate] = useState("");

  useEffect(() => {
    if (existing) {
      setFrequency(existing.frequency);
      setReferenceDate(existing.referenceDate);
    } else {
      setFrequency("biweekly");
      setReferenceDate("");
    }
  }, [existing]);

  const handleSave = async () => {
    if (!referenceDate) {
      toast.error("Pick a reference payday first");
      return;
    }
    try {
      await upsert.mutateAsync({ frequency, referenceDate });
      toast.success("Pay schedule saved");
    } catch {
      toast.error("Failed to save");
    }
  };

  const handleRemove = async () => {
    if (
      !(await confirm({
        title: "Clear your pay schedule?",
        description:
          "Bills will go back to grouping by the next 14 days instead of by pay period.",
        confirmLabel: "Clear",
        destructive: true,
      }))
    ) {
      return;
    }
    try {
      await remove.mutateAsync();
      toast.success("Pay schedule cleared");
    } catch {
      toast.error("Failed");
    }
  };

  return (
    <div>
      <div className="mb-4">
        <h2 className="font-serif text-[20px] font-medium leading-tight tracking-tight">Pay Schedule</h2>
        <p className="mt-1 text-[13px] text-muted-foreground">
          Tell us when you get paid so bills can be grouped per paycheck.
        </p>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
          <div className="space-y-1.5">
            <Label className="text-xs">Frequency</Label>
            <Select
              value={frequency}
              onValueChange={(v) => setFrequency(v as PayFrequency)}
            >
              <SelectTrigger className="w-full">
                <SelectValue>
                  {(value) =>
                    FREQ_LABELS[value as PayFrequency] ?? value
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {payFrequencyValues.map((f) => (
                  <SelectItem key={f} value={f}>
                    {FREQ_LABELS[f]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="refdate" className="text-xs">
              Reference payday
            </Label>
            <Input
              id="refdate"
              type="date"
              value={referenceDate}
              onChange={(e) => setReferenceDate(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleSave}
              disabled={upsert.isPending}
              size="sm"
            >
              {upsert.isPending ? "Saving..." : existing ? "Update" : "Save"}
            </Button>
            {existing && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleRemove}
                disabled={remove.isPending}
              >
                Clear
              </Button>
            )}
          </div>
        </div>
      )}

      {existing && (
        <p className="mt-3 text-xs text-muted-foreground">
          Currently set to <strong>{FREQ_LABELS[existing.frequency as PayFrequency]}</strong>,
          reference date {new Date(existing.referenceDate + "T12:00:00").toLocaleDateString()}
        </p>
      )}
    </div>
  );
}

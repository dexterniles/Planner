"use client";

import { useState } from "react";
import { Repeat, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCreateRecurrenceRule, useDeleteRecurrenceRule } from "@/lib/hooks/use-recurrence";
import { toast } from "sonner";

const FREQUENCY_OPTIONS = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "biweekly", label: "Every 2 weeks" },
  { value: "monthly", label: "Monthly" },
] as const;

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

interface RecurrencePickerProps {
  ownerType: "assignment" | "task";
  ownerId: string;
  recurrenceRuleId: string | null;
}

export function RecurrencePicker({
  ownerType,
  ownerId,
  recurrenceRuleId,
}: RecurrencePickerProps) {
  const [showForm, setShowForm] = useState(false);
  const [frequency, setFrequency] = useState<string>("weekly");
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>([]);
  const [endDate, setEndDate] = useState("");
  const createRule = useCreateRecurrenceRule();
  const deleteRule = useDeleteRecurrenceRule();

  const handleCreate = async () => {
    try {
      await createRule.mutateAsync({
        ownerType,
        ownerId,
        frequency: frequency as "daily" | "weekly" | "biweekly" | "monthly" | "custom",
        daysOfWeek: frequency === "weekly" && daysOfWeek.length > 0 ? daysOfWeek : null,
        endDate: endDate || null,
      });
      setShowForm(false);
      toast.success("Recurrence set");
    } catch {
      toast.error("Failed to set recurrence");
    }
  };

  const handleRemove = async () => {
    if (!recurrenceRuleId) return;
    try {
      await deleteRule.mutateAsync(recurrenceRuleId);
      toast.success("Recurrence removed");
    } catch {
      toast.error("Failed to remove recurrence");
    }
  };

  const toggleDay = (day: number) => {
    setDaysOfWeek((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day],
    );
  };

  if (recurrenceRuleId) {
    return (
      <div className="flex items-center gap-2 rounded-lg border px-3 py-2">
        <Repeat className="h-3.5 w-3.5 text-primary" />
        <span className="text-sm text-muted-foreground">Recurring</span>
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={handleRemove}
          disabled={deleteRule.isPending}
          className="ml-auto"
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
    );
  }

  if (!showForm) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => setShowForm(true)}
        className="w-full"
      >
        <Repeat className="mr-1.5 h-3.5 w-3.5" />
        Set Recurrence
      </Button>
    );
  }

  return (
    <div className="space-y-3 rounded-lg border p-3">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">Recurrence</Label>
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={() => setShowForm(false)}
        >
          <X className="h-3 w-3" />
        </Button>
      </div>

      <Select value={frequency} onValueChange={(val) => setFrequency(val ?? "weekly")}>
        <SelectTrigger className="w-full">
          <SelectValue>
            {(value) =>
              FREQUENCY_OPTIONS.find((o) => o.value === value)?.label ?? value
            }
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {FREQUENCY_OPTIONS.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {frequency === "weekly" && (
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">On days</Label>
          <div className="flex gap-1">
            {DAY_LABELS.map((label, i) => (
              <button
                key={i}
                type="button"
                onClick={() => toggleDay(i)}
                className={`h-8 w-8 rounded-md text-xs font-medium transition-colors ${
                  daysOfWeek.includes(i)
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted hover:bg-accent"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="recurrence-end" className="text-xs text-muted-foreground">
          End date (optional)
        </Label>
        <Input
          id="recurrence-end"
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
        />
      </div>

      <Button
        size="sm"
        onClick={handleCreate}
        disabled={createRule.isPending}
        className="w-full"
      >
        {createRule.isPending ? "Saving..." : "Apply Recurrence"}
      </Button>
    </div>
  );
}

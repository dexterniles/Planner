"use client";

import { useState } from "react";
import { Check, CalendarClock, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useConfirm } from "@/components/ui/confirm-dialog";

export type BulkAction = "mark-done" | "delete" | "reschedule";

interface BulkActionBarProps {
  count: number;
  /** Label noun for the confirm dialog ("task" / "assignment" / "milestone"). */
  entityLabel: string;
  /** Custom label for the mark-done button. Default "Mark done". */
  markDoneLabel?: string;
  isPending?: boolean;
  onAction: (action: BulkAction, days?: number) => Promise<void> | void;
  onClear: () => void;
}

/**
 * Sticky bar that appears at the top of an entity list when one or more rows
 * are selected. Mirrors the bills bulk pattern — `sticky top-2 z-10` over a
 * primary-tinted backdrop, with mark-done / reschedule (popover) / delete
 * (confirm) / clear actions.
 */
export function BulkActionBar({
  count,
  entityLabel,
  markDoneLabel = "Mark done",
  isPending = false,
  onAction,
  onClear,
}: BulkActionBarProps) {
  const confirm = useConfirm();
  const [reschedOpen, setReschedOpen] = useState(false);
  const [days, setDays] = useState<string>("1");

  const handleDelete = async () => {
    const ok = await confirm({
      title: `Delete ${count} ${entityLabel}${count === 1 ? "" : "s"}?`,
      description: "This cannot be undone.",
      destructive: true,
    });
    if (!ok) return;
    await onAction("delete");
  };

  const parsedDays = parseInt(days, 10);
  const reschedDisabled = Number.isNaN(parsedDays) || parsedDays === 0;

  const handleReschedule = async () => {
    if (reschedDisabled) return;
    setReschedOpen(false);
    await onAction("reschedule", parsedDays);
  };

  return (
    <div className="sticky top-2 z-10 flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border border-primary/30 bg-primary/10 px-4 py-2 shadow-md backdrop-blur-sm">
      <span className="font-serif text-[15px] font-medium leading-none tabular-nums">
        {count} selected
      </span>
      <div className="flex-1" />
      <Button size="sm" onClick={() => onAction("mark-done")} disabled={isPending}>
        <Check className="mr-1.5 h-3.5 w-3.5" />
        {markDoneLabel}
      </Button>
      <Popover open={reschedOpen} onOpenChange={setReschedOpen}>
        <PopoverTrigger
          render={
            <Button size="sm" variant="outline" disabled={isPending} />
          }
        >
          <CalendarClock className="mr-1.5 h-3.5 w-3.5" />
          Reschedule
        </PopoverTrigger>
        <PopoverContent align="end" className="w-60">
          <p className="text-[12px] font-medium text-foreground">Shift dates</p>
          <p className="text-[11.5px] text-muted-foreground">
            Positive moves forward, negative moves earlier.
          </p>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              value={days}
              onChange={(e) => setDays(e.target.value)}
              onFocus={(e) => e.currentTarget.select()}
              autoFocus
              min={-365}
              max={365}
              step={1}
              aria-label="Days to shift"
            />
            <span className="text-[12px] text-muted-foreground">days</span>
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setReschedOpen(false)}
            >
              Cancel
            </Button>
            <Button size="sm" onClick={handleReschedule} disabled={reschedDisabled}>
              Apply
            </Button>
          </div>
        </PopoverContent>
      </Popover>
      <Button
        size="sm"
        variant="destructive"
        onClick={handleDelete}
        disabled={isPending}
      >
        <Trash2 className="mr-1.5 h-3.5 w-3.5" />
        Delete
      </Button>
      <Button size="sm" variant="ghost" onClick={onClear} disabled={isPending}>
        Clear
      </Button>
    </div>
  );
}

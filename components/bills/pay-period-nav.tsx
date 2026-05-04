"use client";

import type { ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PayPeriodNavProps {
  payPeriod: { start: Date; end: Date };
  periodOffset: number;
  onChange: (next: number) => void;
  /** Optional inline content rendered below the date label (e.g. summary band). */
  summary?: ReactNode;
}

export function PayPeriodNav({
  payPeriod,
  periodOffset,
  onChange,
  summary,
}: PayPeriodNavProps) {
  return (
    <div className="rounded-xl border border-border bg-card px-3 py-2 shadow-sm">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => onChange(periodOffset - 1)}
          aria-label="Previous pay period"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1 text-center">
          <p className="text-[10.5px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
            {periodOffset === 0 ? "Current pay period" : "Pay period"}
          </p>
          <p className="font-serif text-[15px] leading-tight tabular-nums">
            {payPeriod.start.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })}{" "}
            –{" "}
            {payPeriod.end.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => onChange(periodOffset + 1)}
          aria-label="Next pay period"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        {periodOffset !== 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onChange(0)}
          >
            Current
          </Button>
        )}
      </div>
      {summary && (
        <div className="mt-2 border-t border-border/60 pt-2">{summary}</div>
      )}
    </div>
  );
}

"use client";

import { Minus, Plus, RotateCcw, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PortionConverterProps {
  /** The recipe's stored portion count (the original). */
  basePortions: number;
  /** The currently displayed portion count (may be scaled by the user). */
  targetPortions: number;
  onChange: (value: number) => void;
}

export function PortionConverter({
  basePortions,
  targetPortions,
  onChange,
}: PortionConverterProps) {
  const scaled = targetPortions !== basePortions;
  const scale = basePortions > 0 ? targetPortions / basePortions : 1;

  const dec = () => onChange(Math.max(1, targetPortions - 1));
  const inc = () => onChange(Math.min(999, targetPortions + 1));
  const reset = () => onChange(basePortions);

  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-lg border bg-card px-3 py-2 text-[12.5px]",
        scaled ? "border-primary/40 bg-primary/5" : "border-border",
      )}
    >
      <Users
        className="h-3.5 w-3.5 text-muted-foreground"
        strokeWidth={1.75}
        aria-hidden="true"
      />
      <span className="text-muted-foreground">Serves</span>

      <div className="inline-flex items-center gap-0.5">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={dec}
          disabled={targetPortions <= 1}
          aria-label="Decrease portions"
        >
          <Minus className="h-3.5 w-3.5" />
        </Button>
        <span className="min-w-[24px] text-center font-mono text-[13px] font-medium tabular-nums">
          {targetPortions}
        </span>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={inc}
          disabled={targetPortions >= 999}
          aria-label="Increase portions"
        >
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>

      {scaled && (
        <>
          <span className="ml-1 font-mono text-[11px] tabular-nums text-primary">
            ×{scale.toFixed(2).replace(/\.?0+$/, "")}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={reset}
            aria-label="Reset to original"
            title={`Reset to ${basePortions}`}
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </Button>
        </>
      )}
    </div>
  );
}

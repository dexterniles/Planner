"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

interface FilterChipProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
  active: boolean;
  children: ReactNode;
}

export function FilterChip({
  active,
  children,
  className,
  type = "button",
  ...rest
}: FilterChipProps) {
  return (
    <button
      type={type}
      aria-pressed={active}
      className={cn(
        "inline-flex h-7 items-center gap-1.5 rounded-md border px-2.5 text-[11.5px] font-medium transition-colors",
        "disabled:opacity-50 disabled:pointer-events-none",
        active
          ? "border-border bg-muted text-foreground"
          : "border-border/60 bg-background text-muted-foreground hover:bg-muted/50 hover:text-foreground",
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}

"use client";

import { useState, type ReactNode } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface SectionGroupProps {
  label: string;
  /** localStorage key for persisting expanded state. If omitted, state is in-memory only. */
  storageKey?: string;
  /** Default expanded state when no persisted value exists. */
  defaultExpanded?: boolean;
  /** If true, skip the disclosure header and render children directly. */
  hideHeader?: boolean;
  /** Outer wrapper class. */
  className?: string;
  /** Inner children-wrapper class. */
  contentClassName?: string;
  children: ReactNode;
}

function readExpanded(key: string | undefined, fallback: boolean): boolean {
  if (!key || typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (raw === null) return fallback;
    return raw === "true";
  } catch {
    return fallback;
  }
}

function writeExpanded(key: string, value: boolean) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, String(value));
  } catch {
    /* ignore */
  }
}

export function SectionGroup({
  label,
  storageKey,
  defaultExpanded = true,
  hideHeader = false,
  className,
  contentClassName,
  children,
}: SectionGroupProps) {
  const [expanded, setExpanded] = useState<boolean>(() =>
    readExpanded(storageKey, defaultExpanded),
  );

  const toggle = () => {
    setExpanded((prev) => {
      const next = !prev;
      if (storageKey) writeExpanded(storageKey, next);
      return next;
    });
  };

  if (hideHeader) {
    return <div className={cn(className, contentClassName)}>{children}</div>;
  }

  return (
    <div className={className}>
      <button
        type="button"
        onClick={toggle}
        aria-expanded={expanded}
        className="flex w-full items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground/80 transition-colors hover:text-foreground"
      >
        {expanded ? (
          <ChevronDown className="h-3 w-3 shrink-0" strokeWidth={2} />
        ) : (
          <ChevronRight className="h-3 w-3 shrink-0" strokeWidth={2} />
        )}
        <span>{label}</span>
      </button>
      {expanded && (
        <div className={cn("mt-0.5", contentClassName)}>{children}</div>
      )}
    </div>
  );
}

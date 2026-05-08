import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface SectionHeaderProps {
  label: string;
  count?: number | string;
  icon?: LucideIcon;
  action?: ReactNode;
  tone?: "default" | "danger";
  className?: string;
}

export function SectionHeader({
  label,
  count,
  icon: Icon,
  action,
  tone = "default",
  className,
}: SectionHeaderProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 mb-2 min-h-5",
        className,
      )}
    >
      <div className="flex min-w-0 items-center gap-1.5">
        {Icon && (
          <Icon
            className={cn(
              "h-3 w-3 shrink-0",
              tone === "danger"
                ? "text-destructive"
                : "text-muted-foreground/80",
            )}
            strokeWidth={1.75}
            aria-hidden="true"
          />
        )}
        <span
          className={cn(
            "text-[11px] font-medium uppercase tracking-[0.08em] truncate",
            tone === "danger" ? "text-destructive" : "text-muted-foreground",
          )}
        >
          {label}
        </span>
        {count !== undefined && count !== null && count !== "" && (
          <span
            className={cn(
              "text-[11px] tabular-nums",
              tone === "danger"
                ? "text-destructive/80"
                : "text-muted-foreground/80",
            )}
          >
            {count}
          </span>
        )}
      </div>
      {action && (
        <div className="ml-auto flex shrink-0 items-center">{action}</div>
      )}
    </div>
  );
}

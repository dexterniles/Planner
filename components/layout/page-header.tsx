import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  className?: string;
}

export const pageHeaderTitleClass =
  "font-serif text-[26px] md:text-[34px] font-medium leading-tight tracking-tight";

export function PageHeader({
  title,
  subtitle,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        "mb-7 flex flex-col gap-3 border-b border-border pb-5 md:flex-row md:items-end md:justify-between md:gap-6",
        className,
      )}
    >
      <div className="min-w-0">
        <h1 className={pageHeaderTitleClass}>{title}</h1>
        {subtitle && (
          <div className="mt-2 flex flex-wrap items-center gap-x-3.5 gap-y-1 text-[13px] text-muted-foreground">
            {subtitle}
          </div>
        )}
      </div>
      {actions && (
        <div className="flex flex-wrap items-center gap-2 md:shrink-0">
          {actions}
        </div>
      )}
    </div>
  );
}

export function PageHeaderDot() {
  return (
    <span
      aria-hidden="true"
      className="h-0.5 w-0.5 rounded-full bg-muted-foreground/50"
    />
  );
}

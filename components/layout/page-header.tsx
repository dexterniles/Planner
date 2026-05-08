import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  subtitle,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        "mb-3 flex h-10 items-center gap-3",
        className,
      )}
    >
      <div className="flex min-w-0 items-baseline gap-2.5">
        <h1 className="text-[15px] font-semibold leading-none tracking-tight truncate">
          {title}
        </h1>
        {subtitle && (
          <span className="text-[11.5px] text-muted-foreground truncate">
            {subtitle}
          </span>
        )}
      </div>
      {actions && (
        <div className="ml-auto flex shrink-0 items-center gap-2">
          {actions}
        </div>
      )}
    </div>
  );
}

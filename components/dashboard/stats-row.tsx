"use client";

import { useDashboardStats } from "@/lib/hooks/use-dashboard";
import { useCountUp } from "@/lib/hooks/use-count-up";
import { cn } from "@/lib/utils";

interface StatTileProps {
  label: string;
  value: number;
  suffix?: string;
  decimals?: number;
  delta?: string;
  deltaTone?: "up" | "down" | "muted";
  tone?: "default" | "danger";
  isLoading?: boolean;
}

function StatTile({
  label,
  value,
  suffix,
  decimals = 0,
  delta,
  deltaTone = "muted",
  tone = "default",
  isLoading,
}: StatTileProps) {
  const animated = useCountUp(value, 700, decimals);
  const display = isLoading ? "—" : animated.toFixed(decimals);

  const deltaColor =
    deltaTone === "up"
      ? "text-chart-2"
      : deltaTone === "down"
        ? "text-destructive"
        : "text-muted-foreground";

  return (
    <div className="flex flex-col gap-1 px-3 py-2 lg:py-0 lg:first:pl-0 lg:last:pr-0">
      <p className="text-[10.5px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
        {label}
      </p>
      <div className="flex items-baseline gap-1 leading-none tabular-nums">
        <span
          className={cn(
            "text-[18px] font-medium",
            tone === "danger" && value > 0 && "text-destructive",
          )}
        >
          {display}
        </span>
        {suffix && (
          <span className="text-[12px] font-normal text-muted-foreground">
            {suffix}
          </span>
        )}
      </div>
      {delta && (
        <p className={cn("text-[11.5px]", deltaColor)}>{delta}</p>
      )}
    </div>
  );
}

export function StatsRow() {
  const { data: stats, isLoading } = useDashboardStats();

  const s = stats ?? {
    activeCourses: 0,
    activeProjects: 0,
    overdueCount: 0,
    hoursThisWeek: 0,
  };

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 lg:divide-x divide-border/60 gap-y-2">
      <StatTile
        label="Courses"
        value={s.activeCourses}
        delta={s.activeCourses === 1 ? "1 active" : `${s.activeCourses} active`}
        isLoading={isLoading}
      />
      <StatTile
        label="Projects"
        value={s.activeProjects}
        delta={s.activeProjects === 1 ? "1 active" : `${s.activeProjects} active`}
        isLoading={isLoading}
      />
      <StatTile
        label="Overdue"
        value={s.overdueCount}
        tone="danger"
        delta={s.overdueCount === 0 ? "all caught up" : "needs attention"}
        deltaTone={s.overdueCount === 0 ? "up" : "down"}
        isLoading={isLoading}
      />
      <StatTile
        label="Hours · week"
        value={s.hoursThisWeek}
        suffix="h"
        decimals={1}
        delta="this week"
        isLoading={isLoading}
      />
    </div>
  );
}

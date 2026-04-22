"use client";

import { Card } from "@/components/ui/card";
import { useDashboardStats } from "@/lib/hooks/use-dashboard";
import { useCountUp } from "@/lib/hooks/use-count-up";

interface StatCardProps {
  label: string;
  value: number;
  suffix?: string;
  decimals?: number;
  delta?: string;
  deltaTone?: "up" | "down" | "muted";
  tone?: "default" | "danger";
  isLoading?: boolean;
}

function StatCard({
  label,
  value,
  suffix,
  decimals = 0,
  delta,
  deltaTone = "muted",
  tone = "default",
  isLoading,
}: StatCardProps) {
  const animated = useCountUp(value, 700, decimals);
  const display = isLoading ? "—" : animated.toFixed(decimals);

  const deltaColor =
    deltaTone === "up"
      ? "text-chart-2"
      : deltaTone === "down"
        ? "text-destructive"
        : "text-muted-foreground";

  return (
    <Card className="p-4 sm:p-5">
      <div className="flex flex-col gap-2">
        <p className="text-[10.5px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
          {label}
        </p>
        <div className="font-serif font-medium leading-none tabular-nums">
          <span
            className={`text-[26px] sm:text-[32px] tracking-[-0.02em] ${tone === "danger" && value > 0 ? "text-destructive" : ""}`}
          >
            {display}
          </span>
          {suffix && (
            <span className="ml-0.5 font-sans text-[15px] sm:text-[18px] font-normal text-muted-foreground">
              {suffix}
            </span>
          )}
        </div>
        {delta && (
          <p className={`font-mono text-[11.5px] ${deltaColor}`}>{delta}</p>
        )}
      </div>
    </Card>
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
    <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
      <StatCard
        label="Active Courses"
        value={s.activeCourses}
        delta={s.activeCourses === 1 ? "1 course" : `${s.activeCourses} courses`}
        isLoading={isLoading}
      />
      <StatCard
        label="Active Projects"
        value={s.activeProjects}
        delta={
          s.activeProjects === 1 ? "1 project" : `${s.activeProjects} projects`
        }
        isLoading={isLoading}
      />
      <StatCard
        label="Overdue"
        value={s.overdueCount}
        tone="danger"
        delta={s.overdueCount === 0 ? "all caught up" : "needs attention"}
        deltaTone={s.overdueCount === 0 ? "up" : "down"}
        isLoading={isLoading}
      />
      <StatCard
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

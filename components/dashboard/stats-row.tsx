"use client";

import { GraduationCap, FolderKanban, AlertCircle, Clock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useDashboardStats } from "@/lib/hooks/use-dashboard";
import { useCountUp } from "@/lib/hooks/use-count-up";

interface StatCardProps {
  label: string;
  value: number;
  suffix?: string;
  decimals?: number;
  icon: React.ComponentType<{ className?: string }>;
  iconBg: string;
  iconColor: string;
  isLoading?: boolean;
}

function StatCard({
  label,
  value,
  suffix,
  decimals = 0,
  icon: Icon,
  iconBg,
  iconColor,
  isLoading,
}: StatCardProps) {
  const animated = useCountUp(value, 700, decimals);
  const display = isLoading
    ? "—"
    : `${animated.toFixed(decimals)}${suffix ?? ""}`;

  return (
    <Card className="p-4">
      <div className="flex items-center gap-3">
        <div
          className={`flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br ${iconBg} ${iconColor}`}
        >
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-xl font-semibold tabular-nums">{display}</p>
        </div>
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
        icon={GraduationCap}
        iconBg="from-blue-500/20 to-blue-500/5"
        iconColor="text-blue-600 dark:text-blue-400"
        isLoading={isLoading}
      />
      <StatCard
        label="Active Projects"
        value={s.activeProjects}
        icon={FolderKanban}
        iconBg="from-violet-500/20 to-violet-500/5"
        iconColor="text-violet-600 dark:text-violet-400"
        isLoading={isLoading}
      />
      <StatCard
        label="Overdue"
        value={s.overdueCount}
        icon={AlertCircle}
        iconBg={
          s.overdueCount > 0
            ? "from-red-500/20 to-red-500/5"
            : "from-muted to-muted"
        }
        iconColor={
          s.overdueCount > 0
            ? "text-red-600 dark:text-red-400"
            : "text-muted-foreground"
        }
        isLoading={isLoading}
      />
      <StatCard
        label="Hours This Week"
        value={s.hoursThisWeek}
        suffix="h"
        decimals={1}
        icon={Clock}
        iconBg="from-emerald-500/20 to-emerald-500/5"
        iconColor="text-emerald-600 dark:text-emerald-400"
        isLoading={isLoading}
      />
    </div>
  );
}

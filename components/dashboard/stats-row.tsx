"use client";

import { GraduationCap, FolderKanban, AlertCircle, Clock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useDashboardStats } from "@/lib/hooks/use-dashboard";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  accent?: string;
}

function StatCard({ label, value, icon: Icon, accent }: StatCardProps) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-3">
        <div
          className={`flex h-9 w-9 items-center justify-center rounded-lg ${accent ?? "bg-muted"}`}
        >
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-xl font-semibold tabular-nums">{value}</p>
        </div>
      </div>
    </Card>
  );
}

export function StatsRow() {
  const { data: stats, isLoading } = useDashboardStats();

  const displayStats = stats ?? {
    activeCourses: 0,
    activeProjects: 0,
    overdueCount: 0,
    hoursThisWeek: 0,
  };

  return (
    <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
      <StatCard
        label="Active Courses"
        value={isLoading ? "—" : displayStats.activeCourses}
        icon={GraduationCap}
        accent="bg-blue-500/10 text-blue-600 dark:text-blue-400"
      />
      <StatCard
        label="Active Projects"
        value={isLoading ? "—" : displayStats.activeProjects}
        icon={FolderKanban}
        accent="bg-violet-500/10 text-violet-600 dark:text-violet-400"
      />
      <StatCard
        label="Overdue"
        value={isLoading ? "—" : displayStats.overdueCount}
        icon={AlertCircle}
        accent={
          displayStats.overdueCount > 0
            ? "bg-red-500/10 text-red-600 dark:text-red-400"
            : "bg-muted"
        }
      />
      <StatCard
        label="Hours This Week"
        value={isLoading ? "—" : `${displayStats.hoursThisWeek}h`}
        icon={Clock}
        accent="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
      />
    </div>
  );
}

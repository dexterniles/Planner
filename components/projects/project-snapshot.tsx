"use client";

import { useMemo } from "react";
import { CheckCircle2, Clock, Flag, ListChecks } from "lucide-react";
import { useTasks } from "@/lib/hooks/use-tasks";
import { useMilestones } from "@/lib/hooks/use-milestones";
import { useTimeLogs } from "@/lib/hooks/use-time-logs";

interface ProjectSnapshotProps {
  projectId: string;
}

interface Task {
  status: string;
}

interface Milestone {
  title: string;
  targetDate: string | null;
  completedAt: string | null;
}

interface TimeLog {
  durationSeconds: number | null;
}

function formatDaysUntil(dateStr: string | null): string {
  if (!dateStr) return "No date";
  const target = new Date(dateStr);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const days = Math.round((target.getTime() - now.getTime()) / 86400000);
  if (days < 0) return `${Math.abs(days)}d late`;
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  if (days < 7) return `${days}d`;
  if (days < 30) return `${Math.floor(days / 7)}w`;
  return target.toLocaleDateString();
}

export function ProjectSnapshot({ projectId }: ProjectSnapshotProps) {
  const { data: tasks } = useTasks(projectId);
  const { data: milestones } = useMilestones(projectId);
  const { data: timeLogs } = useTimeLogs("project", projectId);

  const { done, total, percent } = useMemo(() => {
    if (!tasks) return { done: 0, total: 0, percent: 0 };
    const active = (tasks as Task[]).filter((t) => t.status !== "cancelled");
    const doneCount = active.filter((t) => t.status === "done").length;
    const totalCount = active.length;
    return {
      done: doneCount,
      total: totalCount,
      percent: totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0,
    };
  }, [tasks]);

  const nextMilestone = useMemo(() => {
    if (!milestones) return null;
    const incomplete = (milestones as Milestone[])
      .filter((m) => !m.completedAt && m.targetDate)
      .sort(
        (a, b) =>
          new Date(a.targetDate!).getTime() - new Date(b.targetDate!).getTime(),
      );
    return incomplete[0] ?? null;
  }, [milestones]);

  const hoursLogged = useMemo(() => {
    if (!timeLogs) return 0;
    const total = (timeLogs as TimeLog[]).reduce(
      (sum, l) => sum + (l.durationSeconds ?? 0),
      0,
    );
    return Math.round((total / 3600) * 10) / 10;
  }, [timeLogs]);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
      <SnapshotPill
        icon={CheckCircle2}
        label="Progress"
        value={total > 0 ? `${percent}%` : "—"}
        tone="emerald"
      />
      <SnapshotPill
        icon={ListChecks}
        label="Tasks"
        value={total > 0 ? `${done} / ${total}` : "0"}
        tone="violet"
      />
      <SnapshotPill
        icon={Flag}
        label="Next milestone"
        value={
          nextMilestone ? (
            <span className="flex items-center gap-1.5">
              <span className="truncate">{nextMilestone.title}</span>
              <span className="text-[10px] text-muted-foreground shrink-0">
                {formatDaysUntil(nextMilestone.targetDate)}
              </span>
            </span>
          ) : (
            <span className="text-muted-foreground">—</span>
          )
        }
        tone="amber"
      />
      <SnapshotPill
        icon={Clock}
        label="Hours logged"
        value={`${hoursLogged}h`}
        tone="blue"
      />
    </div>
  );
}

interface SnapshotPillProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: React.ReactNode;
  tone: "blue" | "violet" | "emerald" | "amber" | "red";
}

const toneStyles: Record<SnapshotPillProps["tone"], string> = {
  blue: "from-blue-500/15 to-blue-500/5 text-blue-600 dark:text-blue-400",
  violet:
    "from-violet-500/15 to-violet-500/5 text-violet-600 dark:text-violet-400",
  emerald:
    "from-emerald-500/15 to-emerald-500/5 text-emerald-600 dark:text-emerald-400",
  amber: "from-amber-500/15 to-amber-500/5 text-amber-600 dark:text-amber-400",
  red: "from-red-500/15 to-red-500/5 text-red-600 dark:text-red-400",
};

function SnapshotPill({ icon: Icon, label, value, tone }: SnapshotPillProps) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-card px-3 py-2.5 shadow-sm">
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${toneStyles[tone]}`}
      >
        <Icon className="h-3.5 w-3.5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] uppercase tracking-wide text-muted-foreground font-medium">
          {label}
        </p>
        <p className="text-sm font-semibold tabular-nums truncate">{value}</p>
      </div>
    </div>
  );
}

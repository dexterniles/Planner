"use client";

import { useMemo } from "react";
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
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <SnapshotStat label="Progress" value={total > 0 ? `${percent}%` : "—"} />
      <SnapshotStat
        label="Tasks"
        value={total > 0 ? `${done}/${total}` : "0"}
      />
      <SnapshotStat
        label="Next milestone"
        value={
          nextMilestone ? (
            <span className="flex items-baseline gap-2">
              <span className="truncate text-[14px] font-medium">
                {nextMilestone.title}
              </span>
              <span className="shrink-0 font-mono text-[10px] text-muted-foreground">
                {formatDaysUntil(nextMilestone.targetDate)}
              </span>
            </span>
          ) : (
            <span className="text-muted-foreground">—</span>
          )
        }
        serif={false}
      />
      <SnapshotStat label="Hours logged" value={`${hoursLogged}h`} />
    </div>
  );
}

interface SnapshotStatProps {
  label: string;
  value: React.ReactNode;
  valueClass?: string;
  serif?: boolean;
}

function SnapshotStat({
  label,
  value,
  valueClass,
  serif = true,
}: SnapshotStatProps) {
  return (
    <div className="rounded-xl border border-border/60 bg-card px-4 py-3 shadow-sm">
      <p className="text-[10.5px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
        {label}
      </p>
      <p
        className={`mt-1 ${serif ? "font-serif text-[20px] sm:text-[22px] font-medium leading-none" : "text-[14px] sm:text-[15px] leading-tight"} tabular-nums truncate ${valueClass ?? ""}`}
      >
        {value}
      </p>
    </div>
  );
}

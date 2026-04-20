"use client";

import { useMemo } from "react";
import { Clock, FileText, GraduationCap, Target } from "lucide-react";
import { useAssignments } from "@/lib/hooks/use-assignments";
import { useGradeCategories } from "@/lib/hooks/use-grade-categories";
import { useTimeLogs } from "@/lib/hooks/use-time-logs";

interface CourseSnapshotProps {
  courseId: string;
}

interface Assignment {
  id: string;
  dueDate: string | null;
  categoryId: string | null;
  pointsEarned: string | null;
  pointsPossible: string | null;
  status: string;
}

interface Category {
  id: string;
  weight: string;
  dropLowestN: number;
}

interface TimeLog {
  durationSeconds: number | null;
}

function gradeColor(grade: number): string {
  if (grade >= 90) return "text-emerald-600 dark:text-emerald-400";
  if (grade >= 80) return "text-blue-600 dark:text-blue-400";
  if (grade >= 70) return "text-amber-600 dark:text-amber-400";
  return "text-red-600 dark:text-red-400";
}

function computeCategoryPercent(
  entries: { earned: number; possible: number }[],
  dropLowestN: number,
): number | null {
  const valid = entries.filter((e) => e.possible > 0);
  if (valid.length === 0) return null;
  const sorted = valid
    .map((e) => ({ ...e, pct: e.earned / e.possible }))
    .sort((a, b) => a.pct - b.pct);
  const kept = sorted.slice(Math.min(dropLowestN, sorted.length - 1));
  const earned = kept.reduce((s, e) => s + e.earned, 0);
  const possible = kept.reduce((s, e) => s + e.possible, 0);
  return possible > 0 ? (earned / possible) * 100 : null;
}

export function CourseSnapshot({ courseId }: CourseSnapshotProps) {
  const { data: assignments } = useAssignments(courseId);
  const { data: categories } = useGradeCategories(courseId);
  const { data: timeLogs } = useTimeLogs("course", courseId);

  const { grade, gradedWeight } = useMemo(() => {
    if (!categories || !assignments) return { grade: null, gradedWeight: 0 };

    let weightedSum = 0;
    let totalWeight = 0;

    for (const cat of categories as Category[]) {
      const catAssignments = (assignments as Assignment[]).filter(
        (a) => a.categoryId === cat.id,
      );
      const graded = catAssignments
        .filter(
          (a) => a.pointsEarned != null && Number(a.pointsPossible ?? 0) > 0,
        )
        .map((a) => ({
          earned: Number(a.pointsEarned),
          possible: Number(a.pointsPossible),
        }));
      const pct = computeCategoryPercent(graded, cat.dropLowestN);
      if (pct != null) {
        weightedSum += (Number(cat.weight) / 100) * pct;
        totalWeight += Number(cat.weight);
      }
    }

    return {
      grade: totalWeight > 0 ? (weightedSum / totalWeight) * 100 : null,
      gradedWeight: totalWeight,
    };
  }, [categories, assignments]);

  const upcomingCount = useMemo(() => {
    if (!assignments) return 0;
    const now = new Date();
    const weekAhead = new Date(now.getTime() + 7 * 86400000);
    return (assignments as Assignment[]).filter((a) => {
      if (!a.dueDate) return false;
      if (["submitted", "graded"].includes(a.status)) return false;
      const d = new Date(a.dueDate);
      return d >= now && d <= weekAhead;
    }).length;
  }, [assignments]);

  const hoursLogged = useMemo(() => {
    if (!timeLogs) return 0;
    const total = (timeLogs as TimeLog[]).reduce(
      (sum, l) => sum + (l.durationSeconds ?? 0),
      0,
    );
    return Math.round((total / 3600) * 10) / 10;
  }, [timeLogs]);

  const ungraded = (assignments as Assignment[] | undefined)?.filter(
    (a) =>
      (a.pointsEarned == null || a.pointsEarned === "") &&
      a.pointsPossible != null &&
      Number(a.pointsPossible) > 0,
  ).length ?? 0;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
      <SnapshotPill
        icon={GraduationCap}
        label="Grade"
        value={
          grade != null ? (
            <span className={gradeColor(grade)}>{grade.toFixed(1)}%</span>
          ) : (
            <span className="text-muted-foreground">—</span>
          )
        }
        tone="blue"
      />
      <SnapshotPill
        icon={FileText}
        label="Due this week"
        value={upcomingCount.toString()}
        tone="amber"
      />
      <SnapshotPill
        icon={Target}
        label="Ungraded"
        value={ungraded.toString()}
        tone="violet"
      />
      <SnapshotPill
        icon={Clock}
        label={gradedWeight > 0 ? `Graded (${gradedWeight}%)` : "Hours logged"}
        value={
          gradedWeight > 0 && grade != null
            ? `${gradedWeight}%`
            : `${hoursLogged}h`
        }
        tone="emerald"
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

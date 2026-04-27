"use client";

import { useMemo } from "react";
import { useAssignments } from "@/lib/hooks/use-assignments";
import { useGradeCategories } from "@/lib/hooks/use-grade-categories";
import { useTimeLogs } from "@/lib/hooks/use-time-logs";
import { computeCategoryPercent, gradeColor } from "@/lib/grades";

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
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <SnapshotStat
        label="Grade"
        value={grade != null ? `${grade.toFixed(1)}%` : "—"}
        valueClass={grade != null ? gradeColor(grade) : "text-muted-foreground"}
      />
      <SnapshotStat label="Due this week" value={upcomingCount.toString()} />
      <SnapshotStat label="Ungraded" value={ungraded.toString()} />
      <SnapshotStat
        label={gradedWeight > 0 ? "Graded" : "Hours logged"}
        value={
          gradedWeight > 0 && grade != null
            ? `${gradedWeight}%`
            : `${hoursLogged}h`
        }
      />
    </div>
  );
}

interface SnapshotStatProps {
  label: string;
  value: React.ReactNode;
  valueClass?: string;
}

function SnapshotStat({ label, value, valueClass }: SnapshotStatProps) {
  return (
    <div className="rounded-xl border border-border/60 bg-card px-4 py-3 shadow-sm">
      <p className="text-[10.5px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
        {label}
      </p>
      <p
        className={`mt-1 font-serif text-[20px] sm:text-[22px] font-medium leading-none tabular-nums truncate ${valueClass ?? ""}`}
      >
        {value}
      </p>
    </div>
  );
}

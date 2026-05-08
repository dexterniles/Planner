"use client";

import Link from "next/link";
import { useDashboardGrades } from "@/lib/hooks/use-dashboard";

interface CourseGrade {
  courseId: string;
  name: string;
  code: string | null;
  color: string | null;
  grade: number | null;
  weightGraded: number;
}

export function GradeSnapshot() {
  const { data: grades } = useDashboardGrades();
  const rows = (grades ?? []) as CourseGrade[];

  if (rows.length === 0) {
    return (
      <p className="text-[13px] text-muted-foreground">No active courses yet.</p>
    );
  }

  return (
    <div className="space-y-2.5">
      {rows.map((g) => {
        const hasGrade = g.grade != null;
        const pct = Math.max(0, Math.min(100, g.grade ?? 0));
        return (
          <Link
            key={g.courseId}
            href={`/academic/${g.courseId}`}
            className="block rounded-md px-1 py-1 transition-colors hover:bg-muted/50"
          >
            <div className="mb-1 flex items-baseline justify-between gap-3 text-[13px]">
              <div className="min-w-0 flex-1 truncate">
                {g.code && (
                  <span className="mr-1.5 font-mono text-[11px] text-muted-foreground">
                    {g.code}
                  </span>
                )}
                <span className="font-medium">{g.name}</span>
              </div>
              {hasGrade ? (
                <span className="text-[13px] tabular-nums tracking-tight">
                  {g.grade!.toFixed(1)}
                </span>
              ) : (
                <span className="text-[11.5px] text-muted-foreground">—</span>
              )}
            </div>
            <div className="h-1 overflow-hidden rounded-full bg-muted/60">
              <div
                className="h-full rounded-full transition-[width] duration-500"
                style={{
                  width: hasGrade ? `${pct}%` : "0%",
                  backgroundColor: g.color ?? "var(--primary)",
                }}
              />
            </div>
          </Link>
        );
      })}
    </div>
  );
}

"use client";

import Link from "next/link";
import { TrendingUp } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useDashboardGrades } from "@/lib/hooks/use-dashboard";

interface CourseGrade {
  courseId: string;
  name: string;
  code: string | null;
  color: string | null;
  grade: number | null;
  weightGraded: number;
}

function gradeColor(grade: number): string {
  if (grade >= 90) return "text-emerald-600 dark:text-emerald-400";
  if (grade >= 80) return "text-blue-600 dark:text-blue-400";
  if (grade >= 70) return "text-amber-600 dark:text-amber-400";
  return "text-red-600 dark:text-red-400";
}

export function GradeSnapshot() {
  const { data: grades } = useDashboardGrades();

  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-3">
        <TrendingUp className="h-4 w-4 text-muted-foreground" />
        <h2 className="font-semibold">Grade Snapshot</h2>
      </div>
      {!grades || grades.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No active courses yet.
        </p>
      ) : (
        <div className="space-y-2">
          {grades.map((g: CourseGrade) => (
            <Link
              key={g.courseId}
              href={`/academic/${g.courseId}`}
              className="flex items-center gap-3 rounded-md px-2 py-2 hover:bg-accent transition-colors"
            >
              <div
                className="h-2 w-2 rounded-full shrink-0"
                style={{ backgroundColor: g.color ?? "#888" }}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{g.name}</p>
                {g.code && (
                  <p className="text-xs text-muted-foreground truncate">
                    {g.code}
                  </p>
                )}
              </div>
              {g.grade != null ? (
                <div className="text-right">
                  <p
                    className={`text-base font-semibold tabular-nums ${gradeColor(g.grade)}`}
                  >
                    {g.grade.toFixed(1)}%
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {g.weightGraded}% graded
                  </p>
                </div>
              ) : (
                <span className="text-xs text-muted-foreground">No grades</span>
              )}
            </Link>
          ))}
        </div>
      )}
    </Card>
  );
}

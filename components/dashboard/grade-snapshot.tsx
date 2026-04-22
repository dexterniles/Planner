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

export function GradeSnapshot() {
  const { data: grades } = useDashboardGrades();
  const rows = (grades ?? []) as CourseGrade[];

  return (
    <Card className="p-5">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-serif text-[18px] font-medium leading-none tracking-tight">
          Grade snapshot
        </h2>
        <div className="flex items-center gap-3">
          <TrendingUp className="h-4 w-4 text-muted-foreground" strokeWidth={1.75} />
          <Link
            href="/academic"
            className="text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            Academic
          </Link>
        </div>
      </div>
      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">No active courses yet.</p>
      ) : (
        <div className="space-y-3.5">
          {rows.map((g) => {
            const hasGrade = g.grade != null;
            const pct = Math.max(0, Math.min(100, g.grade ?? 0));
            return (
              <Link
                key={g.courseId}
                href={`/academic/${g.courseId}`}
                className="block rounded-md px-1 py-1 transition-colors hover:bg-accent/40"
              >
                <div className="mb-1.5 flex items-baseline justify-between gap-3 text-sm">
                  <div className="min-w-0 flex-1 truncate">
                    {g.code && (
                      <span className="mr-1.5 font-mono text-[11px] text-muted-foreground">
                        {g.code}
                      </span>
                    )}
                    <span className="font-medium">{g.name}</span>
                  </div>
                  {hasGrade ? (
                    <span className="font-serif text-[16px] tabular-nums">
                      {g.grade!.toFixed(1)}
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-muted/60">
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
      )}
    </Card>
  );
}

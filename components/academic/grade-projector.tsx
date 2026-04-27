"use client";

import { useMemo, useState } from "react";
import { Sparkles, Target } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useGradeCategories } from "@/lib/hooks/use-grade-categories";
import { useAssignments } from "@/lib/hooks/use-assignments";
import { computeCategoryPercent, gradeColor } from "@/lib/grades";

interface GradeProjectorProps {
  courseId: string;
}

interface Assignment {
  id: string;
  title: string;
  categoryId: string | null;
  pointsEarned: string | null;
  pointsPossible: string | null;
}

interface Category {
  id: string;
  name: string;
  weight: string;
  dropLowestN: number;
}

export function GradeProjector({ courseId }: GradeProjectorProps) {
  const { data: categories } = useGradeCategories(courseId);
  const { data: assignments } = useAssignments(courseId);
  const [projected, setProjected] = useState<Record<string, string>>({});
  const [targetGrade, setTargetGrade] = useState<string>("");

  const ungraded = useMemo<Assignment[]>(
    () =>
      (assignments ?? []).filter(
        (a: Assignment) =>
          a.pointsPossible != null &&
          Number(a.pointsPossible) > 0 &&
          (a.pointsEarned == null || a.pointsEarned === ""),
      ),
    [assignments],
  );

  const { currentGrade, projectedGrade, totalWeight } = useMemo(() => {
    if (!categories || !assignments) {
      return { currentGrade: null, projectedGrade: null, totalWeight: 0 };
    }

    let currentSum = 0;
    let currentWeight = 0;
    let projectedSum = 0;
    let projectedWeight = 0;

    for (const cat of categories as Category[]) {
      const catAssignments = (assignments as Assignment[]).filter(
        (a) => a.categoryId === cat.id,
      );

      // Current: only actually graded
      const graded = catAssignments
        .filter(
          (a) => a.pointsEarned != null && Number(a.pointsPossible ?? 0) > 0,
        )
        .map((a) => ({
          earned: Number(a.pointsEarned),
          possible: Number(a.pointsPossible),
        }));
      const currentPct = computeCategoryPercent(graded, cat.dropLowestN);
      if (currentPct != null) {
        currentSum += (Number(cat.weight) / 100) * currentPct;
        currentWeight += Number(cat.weight);
      }

      // Projected: graded + hypothetical values
      const withProjection = catAssignments
        .filter((a) => Number(a.pointsPossible ?? 0) > 0)
        .map((a) => {
          const earned =
            a.pointsEarned != null && a.pointsEarned !== ""
              ? Number(a.pointsEarned)
              : projected[a.id] != null && projected[a.id] !== ""
                ? Number(projected[a.id])
                : null;
          return earned != null
            ? { earned, possible: Number(a.pointsPossible) }
            : null;
        })
        .filter((e): e is { earned: number; possible: number } => e !== null);

      const projectedPct = computeCategoryPercent(
        withProjection,
        cat.dropLowestN,
      );
      if (projectedPct != null) {
        projectedSum += (Number(cat.weight) / 100) * projectedPct;
        projectedWeight += Number(cat.weight);
      }
    }

    return {
      currentGrade:
        currentWeight > 0 ? (currentSum / currentWeight) * 100 : null,
      projectedGrade:
        projectedWeight > 0 ? (projectedSum / projectedWeight) * 100 : null,
      totalWeight: projectedWeight,
    };
  }, [categories, assignments, projected]);

  // Target-score calculator: what avg score on ungraded assignments gives targetGrade?
  const targetNeeded = useMemo(() => {
    if (!categories || !assignments || !targetGrade) return null;
    const target = parseFloat(targetGrade);
    if (isNaN(target)) return null;

    let currentEarnedPoints = 0; // weighted-contribution toward overall
    let totalWeight = 0;
    let ungradedPoints = 0; // total points in ungraded (for weighting back)
    let ungradedWeight = 0;

    for (const cat of categories as Category[]) {
      const catAssignments = (assignments as Assignment[]).filter(
        (a) => a.categoryId === cat.id && Number(a.pointsPossible ?? 0) > 0,
      );
      totalWeight += Number(cat.weight);

      const graded = catAssignments.filter(
        (a) => a.pointsEarned != null && a.pointsEarned !== "",
      );
      const ungradedInCat = catAssignments.filter(
        (a) => a.pointsEarned == null || a.pointsEarned === "",
      );

      if (catAssignments.length === 0) continue;

      const gradedPct = computeCategoryPercent(
        graded.map((a) => ({
          earned: Number(a.pointsEarned),
          possible: Number(a.pointsPossible),
        })),
        0,
      );

      // Portion of category weight attributable to graded work
      const gradedShare =
        catAssignments.length > 0
          ? graded.length / catAssignments.length
          : 0;
      const ungradedShare = 1 - gradedShare;

      if (gradedPct != null) {
        currentEarnedPoints +=
          (Number(cat.weight) / 100) * gradedPct * gradedShare;
      }

      ungradedWeight += Number(cat.weight) * ungradedShare;
      ungradedPoints += ungradedInCat.length;
    }

    if (ungradedWeight <= 0 || ungradedPoints === 0) return null;

    // target = currentEarnedPoints + (neededPct * ungradedWeight / 100)
    // solve for neededPct
    const neededPct =
      ((target / 100) * totalWeight - currentEarnedPoints) *
      (100 / ungradedWeight);

    return {
      needed: neededPct,
      feasible: neededPct <= 100 && neededPct >= 0,
      impossible: neededPct > 100,
    };
  }, [categories, assignments, targetGrade]);

  if (!categories || !assignments) return null;

  if (categories.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Add grade categories first to project grades.
      </p>
    );
  }

  if (ungraded.length === 0) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">
          All assignments are graded. Nothing to project.
        </p>
        {currentGrade != null && (
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Current grade
              </span>
              <span
                className={`text-2xl font-semibold tabular-nums ${gradeColor(currentGrade)}`}
              >
                {currentGrade.toFixed(1)}%
              </span>
            </div>
          </Card>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Summary */}
      <div className="grid gap-3 sm:grid-cols-2">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground mb-1">
                Current grade
              </p>
              <p
                className={`text-2xl font-semibold tabular-nums ${currentGrade != null ? gradeColor(currentGrade) : "text-muted-foreground"}`}
              >
                {currentGrade != null
                  ? `${currentGrade.toFixed(1)}%`
                  : "No grades"}
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                <Sparkles className="h-3 w-3" />
                Projected grade
              </p>
              <p
                className={`text-2xl font-semibold tabular-nums ${projectedGrade != null ? gradeColor(projectedGrade) : "text-muted-foreground"}`}
              >
                {projectedGrade != null
                  ? `${projectedGrade.toFixed(1)}%`
                  : "—"}
              </p>
              {totalWeight > 0 && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  Assuming {totalWeight}% of total weight
                </p>
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* Ungraded assignment inputs */}
      <div>
        <h3 className="text-sm font-semibold mb-3">
          Ungraded assignments ({ungraded.length})
        </h3>
        <div className="space-y-2">
          {ungraded.map((a) => (
            <div
              key={a.id}
              className="flex items-center gap-3 rounded-lg border px-3 py-2"
            >
              <span className="flex-1 text-sm font-medium truncate">
                {a.title}
              </span>
              <Input
                type="number"
                step="0.01"
                placeholder="—"
                value={projected[a.id] ?? ""}
                onChange={(e) =>
                  setProjected((prev) => ({
                    ...prev,
                    [a.id]: e.target.value,
                  }))
                }
                className="w-20 text-right tabular-nums"
              />
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                / {a.pointsPossible}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Target grade calculator */}
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Target className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold">What do I need?</h3>
        </div>
        <div className="flex items-end gap-3">
          <div className="flex-1 space-y-1.5">
            <Label htmlFor="target-grade" className="text-xs">
              Target final grade
            </Label>
            <Input
              id="target-grade"
              type="number"
              step="0.1"
              placeholder="e.g. 90"
              value={targetGrade}
              onChange={(e) => setTargetGrade(e.target.value)}
            />
          </div>
          {targetNeeded != null && (
            <div className="flex-1 text-right">
              <p className="text-xs text-muted-foreground mb-1">
                Required avg on remaining
              </p>
              {targetNeeded.impossible ? (
                <p className="text-sm font-medium text-destructive">
                  Not reachable
                </p>
              ) : targetNeeded.needed < 0 ? (
                <p className="text-sm font-medium text-chart-2">
                  Already secured
                </p>
              ) : (
                <p
                  className={`text-2xl font-semibold tabular-nums ${gradeColor(targetNeeded.needed)}`}
                >
                  {targetNeeded.needed.toFixed(1)}%
                </p>
              )}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

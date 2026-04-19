"use client";

import { useGradeCategories } from "@/lib/hooks/use-grade-categories";
import { useAssignments } from "@/lib/hooks/use-assignments";
import { Card } from "@/components/ui/card";

interface GradeCalculatorProps {
  courseId: string;
}

interface Assignment {
  id: string;
  categoryId: string | null;
  pointsEarned: string | null;
  pointsPossible: string | null;
  status: string;
}

interface Category {
  id: string;
  name: string;
  weight: string;
  dropLowestN: number;
}

function computeCategoryGrade(
  assignments: Assignment[],
  dropLowestN: number,
): { earned: number; possible: number; percentage: number | null } {
  const graded = assignments.filter(
    (a) => a.pointsEarned != null && a.pointsPossible != null && Number(a.pointsPossible) > 0,
  );

  if (graded.length === 0) return { earned: 0, possible: 0, percentage: null };

  // Calculate individual percentages for drop-lowest logic
  const withPercentages = graded
    .map((a) => ({
      earned: Number(a.pointsEarned),
      possible: Number(a.pointsPossible),
      percentage: Number(a.pointsEarned) / Number(a.pointsPossible),
    }))
    .sort((a, b) => a.percentage - b.percentage);

  // Drop the lowest N scores
  const kept = withPercentages.slice(Math.min(dropLowestN, withPercentages.length - 1));

  const earned = kept.reduce((sum, a) => sum + a.earned, 0);
  const possible = kept.reduce((sum, a) => sum + a.possible, 0);

  return {
    earned,
    possible,
    percentage: possible > 0 ? (earned / possible) * 100 : null,
  };
}

export function GradeCalculator({ courseId }: GradeCalculatorProps) {
  const { data: categories } = useGradeCategories(courseId);
  const { data: assignments } = useAssignments(courseId);

  if (!categories || !assignments) return null;
  if (categories.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Add grade categories to see grade calculations.
      </p>
    );
  }

  const categoryGrades = categories.map((cat: Category) => {
    const catAssignments = assignments.filter(
      (a: Assignment) => a.categoryId === cat.id,
    );
    const grade = computeCategoryGrade(catAssignments, cat.dropLowestN);
    return { ...cat, ...grade, assignmentCount: catAssignments.length };
  });

  // Compute weighted overall grade
  const totalWeight = categoryGrades.reduce(
    (sum: number, c: { weight: string; percentage: number | null }) =>
      c.percentage != null ? sum + Number(c.weight) : sum,
    0,
  );

  const weightedSum = categoryGrades.reduce(
    (sum: number, c: { weight: string; percentage: number | null }) =>
      c.percentage != null
        ? sum + (Number(c.weight) / 100) * c.percentage
        : sum,
    0,
  );

  const overallGrade =
    totalWeight > 0 ? (weightedSum / totalWeight) * 100 : null;

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {categoryGrades.map(
          (cat: Category & { earned: number; possible: number; percentage: number | null; assignmentCount: number }) => (
            <Card key={cat.id} className="p-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">{cat.name}</h4>
                <span className="text-sm text-muted-foreground">
                  {cat.weight}%
                </span>
              </div>
              {cat.percentage != null ? (
                <div className="mt-2">
                  <p className="text-2xl font-bold">
                    {cat.percentage.toFixed(1)}%
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {cat.earned}/{cat.possible} pts
                    {cat.dropLowestN > 0 && ` (drop ${cat.dropLowestN})`}
                  </p>
                </div>
              ) : (
                <p className="mt-2 text-sm text-muted-foreground">
                  {cat.assignmentCount} assignment{cat.assignmentCount !== 1 ? "s" : ""}, none graded
                </p>
              )}
            </Card>
          ),
        )}
      </div>

      <Card className="p-4">
        <div className="flex items-center justify-between">
          <h4 className="font-medium">Overall Grade</h4>
          {overallGrade != null ? (
            <p className="text-2xl font-bold">{overallGrade.toFixed(1)}%</p>
          ) : (
            <p className="text-muted-foreground">No grades yet</p>
          )}
        </div>
        {overallGrade != null && (
          <p className="text-sm text-muted-foreground">
            Based on {totalWeight}% of total weight graded
          </p>
        )}
      </Card>
    </div>
  );
}

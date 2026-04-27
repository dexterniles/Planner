export function gradeColor(grade: number): string {
  if (grade >= 90) return "text-chart-2";
  if (grade >= 80) return "text-chart-4";
  if (grade >= 70) return "text-chart-3";
  return "text-destructive";
}

export function computeCategoryPercent(
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

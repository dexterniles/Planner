import { db } from "@/lib/db";
import { requireAuthGuard } from "@/lib/auth/require-auth";
import { courses, assignments, gradeCategories } from "@/lib/db/schema";
import { and, eq, inArray } from "drizzle-orm";
import { NextResponse } from "next/server";

interface AssignmentRow {
  id: string;
  categoryId: string | null;
  pointsEarned: string | null;
  pointsPossible: string | null;
}

interface CategoryRow {
  id: string;
  courseId: string;
  weight: string;
  dropLowestN: number;
}

function computeCategoryGrade(
  rows: AssignmentRow[],
  dropLowestN: number,
): { earned: number; possible: number } | null {
  const graded = rows.filter(
    (a) =>
      a.pointsEarned != null &&
      a.pointsPossible != null &&
      Number(a.pointsPossible) > 0,
  );
  if (graded.length === 0) return null;

  const withPct = graded
    .map((a) => ({
      earned: Number(a.pointsEarned),
      possible: Number(a.pointsPossible),
      pct: Number(a.pointsEarned) / Number(a.pointsPossible),
    }))
    .sort((a, b) => a.pct - b.pct);

  const kept = withPct.slice(Math.min(dropLowestN, withPct.length - 1));
  return {
    earned: kept.reduce((s, a) => s + a.earned, 0),
    possible: kept.reduce((s, a) => s + a.possible, 0),
  };
}

export async function GET(request: Request) {
  const auth = await requireAuthGuard(request);
  if (!auth.ok) return auth.response;
  const { userId } = auth;
  const activeCourses = await db
    .select({
      id: courses.id,
      name: courses.name,
      code: courses.code,
      color: courses.color,
    })
    .from(courses)
    .where(and(eq(courses.userId, userId), eq(courses.status, "active")))
    .orderBy(courses.name);

  if (activeCourses.length === 0) {
    return NextResponse.json([]);
  }

  const courseIds = activeCourses.map((c) => c.id);

  const [allCategoryRows, allAssignmentRows] = await Promise.all([
    db
      .select({
        id: gradeCategories.id,
        courseId: gradeCategories.courseId,
        weight: gradeCategories.weight,
        dropLowestN: gradeCategories.dropLowestN,
      })
      .from(gradeCategories)
      .where(inArray(gradeCategories.courseId, courseIds)),
    db
      .select({
        id: assignments.id,
        courseId: assignments.courseId,
        categoryId: assignments.categoryId,
        pointsEarned: assignments.pointsEarned,
        pointsPossible: assignments.pointsPossible,
      })
      .from(assignments)
      .where(inArray(assignments.courseId, courseIds)),
  ]);

  const categoriesByCourse = new Map<string, CategoryRow[]>();
  for (const row of allCategoryRows) {
    const list = categoriesByCourse.get(row.courseId) ?? [];
    list.push(row);
    categoriesByCourse.set(row.courseId, list);
  }

  const assignmentsByCourse = new Map<string, AssignmentRow[]>();
  for (const row of allAssignmentRows) {
    const list = assignmentsByCourse.get(row.courseId) ?? [];
    list.push(row);
    assignmentsByCourse.set(row.courseId, list);
  }

  const results = activeCourses.map((course) => {
    const categoryRows = categoriesByCourse.get(course.id) ?? [];
    const assignmentRows = assignmentsByCourse.get(course.id) ?? [];

    if (categoryRows.length === 0) {
      return {
        courseId: course.id,
        name: course.name,
        code: course.code,
        color: course.color,
        grade: null,
        weightGraded: 0,
      };
    }

    let weightedSum = 0;
    let totalGradedWeight = 0;

    for (const cat of categoryRows) {
      const catAssignments = assignmentRows.filter(
        (a) => a.categoryId === cat.id,
      );
      const grade = computeCategoryGrade(catAssignments, cat.dropLowestN);
      if (grade && grade.possible > 0) {
        const pct = (grade.earned / grade.possible) * 100;
        weightedSum += (Number(cat.weight) / 100) * pct;
        totalGradedWeight += Number(cat.weight);
      }
    }

    return {
      courseId: course.id,
      name: course.name,
      code: course.code,
      color: course.color,
      grade:
        totalGradedWeight > 0 ? (weightedSum / totalGradedWeight) * 100 : null,
      weightGraded: totalGradedWeight,
    };
  });

  return NextResponse.json(results);
}

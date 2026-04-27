import { db } from "@/lib/db";
import { courses, assignments, gradeCategories } from "@/lib/db/schema";
import { and, eq, inArray, sql } from "drizzle-orm";

function startOfWeek(): Date {
  const now = new Date();
  const day = now.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diff);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

export type DashboardStats = {
  activeCourses: number;
  activeProjects: number;
  overdueCount: number;
  hoursThisWeek: number;
};

export async function getDashboardStats(userId: string): Promise<DashboardStats> {
  const weekStart = startOfWeek().toISOString();
  const now = new Date().toISOString();

  const result = await db.execute(sql`
    SELECT
      (SELECT count(*)::int FROM courses WHERE user_id = ${userId} AND status = 'active') AS active_courses,
      (SELECT count(*)::int FROM projects WHERE user_id = ${userId} AND status IN ('planning','active')) AS active_projects,
      (SELECT count(*)::int FROM assignments WHERE user_id = ${userId} AND due_date IS NOT NULL AND due_date < ${now} AND status NOT IN ('submitted','graded')) AS overdue_assignments,
      (SELECT count(*)::int FROM tasks WHERE user_id = ${userId} AND due_date IS NOT NULL AND due_date < ${now} AND status NOT IN ('done','cancelled')) AS overdue_tasks,
      (SELECT COALESCE(SUM(duration_seconds), 0)::int FROM time_logs WHERE user_id = ${userId} AND started_at >= ${weekStart} AND duration_seconds IS NOT NULL) AS week_seconds
  `);

  const row = result[0] as {
    active_courses: number;
    active_projects: number;
    overdue_assignments: number;
    overdue_tasks: number;
    week_seconds: number;
  };

  const hoursThisWeek = row.week_seconds / 3600;

  return {
    activeCourses: row.active_courses,
    activeProjects: row.active_projects,
    overdueCount: row.overdue_assignments + row.overdue_tasks,
    hoursThisWeek: Math.round(hoursThisWeek * 10) / 10,
  };
}

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

export type DashboardGrade = {
  courseId: string;
  name: string;
  code: string | null;
  color: string | null;
  grade: number | null;
  weightGraded: number;
};

export async function getDashboardGrades(
  userId: string,
): Promise<DashboardGrade[]> {
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
    return [];
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

  return activeCourses.map((course) => {
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
}

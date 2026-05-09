import { db } from "@/lib/db";
import {
  workspaces,
  projects,
  courses,
  tasks,
  assignments,
  events,
  bills,
  notes,
  eventCategories,
  billCategories,
  gradeCategories,
} from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";

export async function userOwnsWorkspace(id: string, userId: string) {
  const [row] = await db
    .select({ id: workspaces.id })
    .from(workspaces)
    .where(and(eq(workspaces.id, id), eq(workspaces.userId, userId)));
  return !!row;
}

export async function userOwnsProject(id: string, userId: string) {
  const [row] = await db
    .select({ id: projects.id })
    .from(projects)
    .where(and(eq(projects.id, id), eq(projects.userId, userId)));
  return !!row;
}

export async function userOwnsCourse(id: string, userId: string) {
  const [row] = await db
    .select({ id: courses.id })
    .from(courses)
    .where(and(eq(courses.id, id), eq(courses.userId, userId)));
  return !!row;
}

export async function userOwnsTask(id: string, userId: string) {
  const [row] = await db
    .select({ id: tasks.id })
    .from(tasks)
    .where(and(eq(tasks.id, id), eq(tasks.userId, userId)));
  return !!row;
}

export async function userOwnsAssignment(id: string, userId: string) {
  const [row] = await db
    .select({ id: assignments.id })
    .from(assignments)
    .where(and(eq(assignments.id, id), eq(assignments.userId, userId)));
  return !!row;
}

export async function userOwnsEvent(id: string, userId: string) {
  const [row] = await db
    .select({ id: events.id })
    .from(events)
    .where(and(eq(events.id, id), eq(events.userId, userId)));
  return !!row;
}

export async function userOwnsBill(id: string, userId: string) {
  const [row] = await db
    .select({ id: bills.id })
    .from(bills)
    .where(and(eq(bills.id, id), eq(bills.userId, userId)));
  return !!row;
}

export async function userOwnsNote(id: string, userId: string) {
  const [row] = await db
    .select({ id: notes.id })
    .from(notes)
    .where(and(eq(notes.id, id), eq(notes.userId, userId)));
  return !!row;
}

export async function userOwnsEventCategory(id: string, userId: string) {
  const [row] = await db
    .select({ id: eventCategories.id })
    .from(eventCategories)
    .where(
      and(eq(eventCategories.id, id), eq(eventCategories.userId, userId)),
    );
  return !!row;
}

export async function userOwnsBillCategory(id: string, userId: string) {
  const [row] = await db
    .select({ id: billCategories.id })
    .from(billCategories)
    .where(and(eq(billCategories.id, id), eq(billCategories.userId, userId)));
  return !!row;
}

// gradeCategories has no userId column; ownership is derived via the parent course.
export async function userOwnsGradeCategory(id: string, userId: string) {
  const [row] = await db
    .select({ id: gradeCategories.id })
    .from(gradeCategories)
    .innerJoin(courses, eq(gradeCategories.courseId, courses.id))
    .where(and(eq(gradeCategories.id, id), eq(courses.userId, userId)));
  return !!row;
}

export type LoggableType = "course" | "project" | "assignment" | "task";

export async function userOwnsLoggable(
  type: LoggableType,
  id: string,
  userId: string,
) {
  switch (type) {
    case "course":
      return userOwnsCourse(id, userId);
    case "project":
      return userOwnsProject(id, userId);
    case "assignment":
      return userOwnsAssignment(id, userId);
    case "task":
      return userOwnsTask(id, userId);
  }
}

export type NoteParentType =
  | "course"
  | "project"
  | "assignment"
  | "task"
  | "session"
  | "daily_log"
  | "standalone"
  | "event";

// Returns true for parent types that don't reference an owned table (session/daily_log/standalone).
export async function userOwnsNoteParent(
  type: NoteParentType,
  id: string,
  userId: string,
) {
  switch (type) {
    case "course":
      return userOwnsCourse(id, userId);
    case "project":
      return userOwnsProject(id, userId);
    case "assignment":
      return userOwnsAssignment(id, userId);
    case "task":
      return userOwnsTask(id, userId);
    case "event":
      return userOwnsEvent(id, userId);
    case "session":
    case "daily_log":
    case "standalone":
      return true;
  }
}

export type ResultingItemType =
  | "task"
  | "assignment"
  | "note"
  | "event"
  | "bill"
  | "project";

export async function userOwnsResultingItem(
  type: ResultingItemType,
  id: string,
  userId: string,
) {
  switch (type) {
    case "task":
      return userOwnsTask(id, userId);
    case "assignment":
      return userOwnsAssignment(id, userId);
    case "note":
      return userOwnsNote(id, userId);
    case "event":
      return userOwnsEvent(id, userId);
    case "bill":
      return userOwnsBill(id, userId);
    case "project":
      return userOwnsProject(id, userId);
  }
}

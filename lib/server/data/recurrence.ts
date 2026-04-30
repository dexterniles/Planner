import { db } from "@/lib/db";
import {
  tasks,
  assignments,
  events,
  recurrenceRules,
} from "@/lib/db/schema";
import { and, desc, eq, isNotNull } from "drizzle-orm";

const LOOKAHEAD_DAYS = 14;

type RecurrenceRule = {
  id: string;
  frequency: "daily" | "weekly" | "biweekly" | "monthly" | "custom";
  interval: number;
  daysOfWeek: number[] | null;
  endDate: string | null;
  count: number | null;
};

function nextOccurrence(latest: Date, rule: RecurrenceRule): Date {
  const next = new Date(latest);
  const interval = rule.interval && rule.interval > 0 ? rule.interval : 1;

  if (rule.frequency === "weekly" && rule.daysOfWeek && rule.daysOfWeek.length > 0) {
    // walk forward 1 day at a time until we hit an allowed weekday
    const allowed = new Set(rule.daysOfWeek);
    do {
      next.setDate(next.getDate() + 1);
    } while (!allowed.has(next.getDay()));
    return next;
  }

  if (rule.frequency === "daily") {
    next.setDate(next.getDate() + interval);
  } else if (rule.frequency === "weekly") {
    next.setDate(next.getDate() + 7 * interval);
  } else if (rule.frequency === "biweekly") {
    next.setDate(next.getDate() + 14 * interval);
  } else if (rule.frequency === "monthly") {
    // Pin to the original day of month; if the target month is shorter, clamp to last day.
    const targetDay = next.getDate();
    next.setDate(1);
    next.setMonth(next.getMonth() + interval);
    const lastDayOfTargetMonth = new Date(
      next.getFullYear(),
      next.getMonth() + 1,
      0,
    ).getDate();
    next.setDate(Math.min(targetDay, lastDayOfTargetMonth));
  } else {
    next.setDate(next.getDate() + interval);
  }
  return next;
}

function ruleExpired(rule: RecurrenceRule, now: Date): boolean {
  if (!rule.endDate) return false;
  const [y, m, d] = rule.endDate.split("-").map((s) => parseInt(s, 10));
  const end = new Date(y, m - 1, d, 23, 59, 59, 999);
  return end < now;
}

async function materializeTasks(userId: string, now: Date): Promise<void> {
  const horizon = new Date(now.getTime() + LOOKAHEAD_DAYS * 86400 * 1000);

  const ruleRows = await db
    .selectDistinct({
      id: recurrenceRules.id,
      frequency: recurrenceRules.frequency,
      interval: recurrenceRules.interval,
      daysOfWeek: recurrenceRules.daysOfWeek,
      endDate: recurrenceRules.endDate,
      count: recurrenceRules.count,
    })
    .from(recurrenceRules)
    .innerJoin(tasks, eq(tasks.recurrenceRuleId, recurrenceRules.id))
    .where(and(eq(tasks.userId, userId), isNotNull(tasks.recurrenceRuleId)));

  for (const rule of ruleRows) {
    if (ruleExpired(rule, now)) continue;

    const existing = await db
      .select()
      .from(tasks)
      .where(
        and(eq(tasks.userId, userId), eq(tasks.recurrenceRuleId, rule.id)),
      )
      .orderBy(desc(tasks.dueDate));

    if (rule.count != null && existing.length >= rule.count) continue;

    const template = existing.find((t) => t.dueDate != null) ?? existing[0];
    if (!template || !template.dueDate) continue;

    let cursor = new Date(template.dueDate);
    let remainingSlots =
      rule.count != null ? rule.count - existing.length : Infinity;

    while (remainingSlots > 0) {
      cursor = nextOccurrence(cursor, rule);
      if (cursor > horizon) break;
      if (rule.endDate) {
        const [y, m, d] = rule.endDate.split("-").map((s) => parseInt(s, 10));
        const end = new Date(y, m - 1, d, 23, 59, 59, 999);
        if (cursor > end) break;
      }

      const dup = await db
        .select({ id: tasks.id })
        .from(tasks)
        .where(
          and(
            eq(tasks.userId, userId),
            eq(tasks.recurrenceRuleId, rule.id),
            eq(tasks.dueDate, cursor),
          ),
        );
      if (dup.length > 0) continue;

      await db.insert(tasks).values({
        userId,
        projectId: template.projectId,
        title: template.title,
        description: template.description,
        dueDate: new Date(cursor),
        status: "not_started", // reset state-shaped fields
        priority: template.priority,
        parentTaskId: template.parentTaskId,
        notes: template.notes,
        recurrenceRuleId: rule.id,
      });
      remainingSlots--;
    }
  }
}

async function materializeAssignments(userId: string, now: Date): Promise<void> {
  const horizon = new Date(now.getTime() + LOOKAHEAD_DAYS * 86400 * 1000);

  const ruleRows = await db
    .selectDistinct({
      id: recurrenceRules.id,
      frequency: recurrenceRules.frequency,
      interval: recurrenceRules.interval,
      daysOfWeek: recurrenceRules.daysOfWeek,
      endDate: recurrenceRules.endDate,
      count: recurrenceRules.count,
    })
    .from(recurrenceRules)
    .innerJoin(assignments, eq(assignments.recurrenceRuleId, recurrenceRules.id))
    .where(
      and(eq(assignments.userId, userId), isNotNull(assignments.recurrenceRuleId)),
    );

  for (const rule of ruleRows) {
    if (ruleExpired(rule, now)) continue;

    const existing = await db
      .select()
      .from(assignments)
      .where(
        and(
          eq(assignments.userId, userId),
          eq(assignments.recurrenceRuleId, rule.id),
        ),
      )
      .orderBy(desc(assignments.dueDate));

    if (rule.count != null && existing.length >= rule.count) continue;

    const template = existing.find((t) => t.dueDate != null) ?? existing[0];
    if (!template || !template.dueDate) continue;

    let cursor = new Date(template.dueDate);
    let remainingSlots =
      rule.count != null ? rule.count - existing.length : Infinity;

    while (remainingSlots > 0) {
      cursor = nextOccurrence(cursor, rule);
      if (cursor > horizon) break;
      if (rule.endDate) {
        const [y, m, d] = rule.endDate.split("-").map((s) => parseInt(s, 10));
        const end = new Date(y, m - 1, d, 23, 59, 59, 999);
        if (cursor > end) break;
      }

      const dup = await db
        .select({ id: assignments.id })
        .from(assignments)
        .where(
          and(
            eq(assignments.userId, userId),
            eq(assignments.recurrenceRuleId, rule.id),
            eq(assignments.dueDate, cursor),
          ),
        );
      if (dup.length > 0) continue;

      await db.insert(assignments).values({
        userId,
        courseId: template.courseId,
        title: template.title,
        description: template.description,
        dueDate: new Date(cursor),
        categoryId: template.categoryId,
        status: "not_started", // reset state-shaped fields; clear points
        pointsEarned: null,
        pointsPossible: template.pointsPossible,
        notes: template.notes,
        recurrenceRuleId: rule.id,
      });
      remainingSlots--;
    }
  }
}

async function materializeEvents(userId: string, now: Date): Promise<void> {
  const horizon = new Date(now.getTime() + LOOKAHEAD_DAYS * 86400 * 1000);

  const ruleRows = await db
    .selectDistinct({
      id: recurrenceRules.id,
      frequency: recurrenceRules.frequency,
      interval: recurrenceRules.interval,
      daysOfWeek: recurrenceRules.daysOfWeek,
      endDate: recurrenceRules.endDate,
      count: recurrenceRules.count,
    })
    .from(recurrenceRules)
    .innerJoin(events, eq(events.recurrenceRuleId, recurrenceRules.id))
    .where(and(eq(events.userId, userId), isNotNull(events.recurrenceRuleId)));

  for (const rule of ruleRows) {
    if (ruleExpired(rule, now)) continue;

    const existing = await db
      .select()
      .from(events)
      .where(
        and(eq(events.userId, userId), eq(events.recurrenceRuleId, rule.id)),
      )
      .orderBy(desc(events.startsAt));

    if (rule.count != null && existing.length >= rule.count) continue;

    const template = existing[0];
    if (!template) continue;

    let cursor = new Date(template.startsAt);
    const durationMs = template.endsAt
      ? template.endsAt.getTime() - template.startsAt.getTime()
      : null;
    let remainingSlots =
      rule.count != null ? rule.count - existing.length : Infinity;

    while (remainingSlots > 0) {
      cursor = nextOccurrence(cursor, rule);
      if (cursor > horizon) break;
      if (rule.endDate) {
        const [y, m, d] = rule.endDate.split("-").map((s) => parseInt(s, 10));
        const end = new Date(y, m - 1, d, 23, 59, 59, 999);
        if (cursor > end) break;
      }

      const dup = await db
        .select({ id: events.id })
        .from(events)
        .where(
          and(
            eq(events.userId, userId),
            eq(events.recurrenceRuleId, rule.id),
            eq(events.startsAt, cursor),
          ),
        );
      if (dup.length > 0) continue;

      await db.insert(events).values({
        userId,
        title: template.title,
        description: template.description,
        categoryId: template.categoryId,
        startsAt: new Date(cursor),
        endsAt: durationMs != null ? new Date(cursor.getTime() + durationMs) : null,
        allDay: template.allDay,
        location: template.location,
        url: template.url,
        attendees: template.attendees,
        status: "confirmed", // reset state-shaped fields
        color: template.color,
        recurrenceRuleId: rule.id,
      });
      remainingSlots--;
    }
  }
}

export async function materializeRecurrencesForUser(userId: string): Promise<void> {
  const now = new Date();
  await materializeTasks(userId, now);
  await materializeAssignments(userId, now);
  await materializeEvents(userId, now);
}

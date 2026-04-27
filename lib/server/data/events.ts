import { db } from "@/lib/db";
import { events, eventCategories } from "@/lib/db/schema";
import {
  and,
  asc,
  eq,
  gte,
  isNotNull,
  isNull,
  lt,
  lte,
  ne,
  or,
  type SQL,
} from "drizzle-orm";
import type { EventStatus } from "@/lib/validations/event";

export type EventsFilters = {
  from?: string;
  to?: string;
  categoryId?: string;
  status?: EventStatus;
  limit?: number;
};

export type EventRow = {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  categoryId: string | null;
  categoryName: string | null;
  categoryColor: string | null;
  startsAt: Date;
  endsAt: Date | null;
  allDay: boolean;
  location: string | null;
  url: string | null;
  attendees: string | null;
  status: EventStatus;
  color: string | null;
  recurrenceRuleId: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export async function getEvents(
  userId: string,
  filters: EventsFilters = {},
): Promise<EventRow[]> {
  const { from, to, categoryId, status, limit = 500 } = filters;
  const conditions: SQL[] = [eq(events.userId, userId)];
  if (from) conditions.push(gte(events.startsAt, new Date(from)));
  if (to) conditions.push(lte(events.startsAt, new Date(to)));
  if (categoryId) conditions.push(eq(events.categoryId, categoryId));
  if (status) conditions.push(eq(events.status, status));

  return db
    .select({
      id: events.id,
      userId: events.userId,
      title: events.title,
      description: events.description,
      categoryId: events.categoryId,
      categoryName: eventCategories.name,
      categoryColor: eventCategories.color,
      startsAt: events.startsAt,
      endsAt: events.endsAt,
      allDay: events.allDay,
      location: events.location,
      url: events.url,
      attendees: events.attendees,
      status: events.status,
      color: events.color,
      recurrenceRuleId: events.recurrenceRuleId,
      createdAt: events.createdAt,
      updatedAt: events.updatedAt,
    })
    .from(events)
    .leftJoin(eventCategories, eq(events.categoryId, eventCategories.id))
    .where(and(...conditions))
    .orderBy(asc(events.startsAt))
    .limit(limit);
}

export type UpcomingEventRow = Omit<EventRow, "createdAt" | "updatedAt">;

export async function getUpcomingEvents(
  userId: string,
  limit: number,
): Promise<UpcomingEventRow[]> {
  const now = new Date();
  return db
    .select({
      id: events.id,
      userId: events.userId,
      title: events.title,
      description: events.description,
      categoryId: events.categoryId,
      categoryName: eventCategories.name,
      categoryColor: eventCategories.color,
      startsAt: events.startsAt,
      endsAt: events.endsAt,
      allDay: events.allDay,
      location: events.location,
      url: events.url,
      attendees: events.attendees,
      status: events.status,
      color: events.color,
      recurrenceRuleId: events.recurrenceRuleId,
    })
    .from(events)
    .leftJoin(eventCategories, eq(events.categoryId, eventCategories.id))
    .where(
      and(
        eq(events.userId, userId),
        ne(events.status, "cancelled"),
        or(
          gte(events.startsAt, now),
          and(isNotNull(events.endsAt), gte(events.endsAt, now)),
        ),
      ),
    )
    .orderBy(asc(events.startsAt))
    .limit(limit);
}

export async function getEventsByDate(
  userId: string,
  date: { dayStart: Date; dayEnd: Date },
): Promise<UpcomingEventRow[]> {
  const { dayStart, dayEnd } = date;
  return db
    .select({
      id: events.id,
      userId: events.userId,
      title: events.title,
      description: events.description,
      categoryId: events.categoryId,
      categoryName: eventCategories.name,
      categoryColor: eventCategories.color,
      startsAt: events.startsAt,
      endsAt: events.endsAt,
      allDay: events.allDay,
      location: events.location,
      url: events.url,
      attendees: events.attendees,
      status: events.status,
      color: events.color,
      recurrenceRuleId: events.recurrenceRuleId,
    })
    .from(events)
    .leftJoin(eventCategories, eq(events.categoryId, eventCategories.id))
    .where(
      and(
        eq(events.userId, userId),
        lte(events.startsAt, dayEnd),
        or(
          isNull(events.endsAt),
          and(gte(events.endsAt, dayStart)),
          and(gte(events.startsAt, dayStart), lt(events.startsAt, dayEnd)),
        ),
      ),
    )
    .orderBy(asc(events.startsAt));
}

export type EventCategory = {
  id: string;
  userId: string;
  name: string;
  color: string | null;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
};

export async function getEventCategories(
  userId: string,
): Promise<EventCategory[]> {
  return db
    .select()
    .from(eventCategories)
    .where(eq(eventCategories.userId, userId))
    .orderBy(asc(eventCategories.sortOrder), asc(eventCategories.name));
}

export async function getEventById(
  userId: string,
  id: string,
): Promise<EventRow | null> {
  const [event] = await db
    .select({
      id: events.id,
      userId: events.userId,
      title: events.title,
      description: events.description,
      categoryId: events.categoryId,
      categoryName: eventCategories.name,
      categoryColor: eventCategories.color,
      startsAt: events.startsAt,
      endsAt: events.endsAt,
      allDay: events.allDay,
      location: events.location,
      url: events.url,
      attendees: events.attendees,
      status: events.status,
      color: events.color,
      recurrenceRuleId: events.recurrenceRuleId,
      createdAt: events.createdAt,
      updatedAt: events.updatedAt,
    })
    .from(events)
    .leftJoin(eventCategories, eq(events.categoryId, eventCategories.id))
    .where(and(eq(events.id, id), eq(events.userId, userId)));
  return event ?? null;
}

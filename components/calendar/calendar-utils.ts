import type { EventCategory } from "@/lib/validations/event";

export interface CalendarItem {
  sourceType: "assignment" | "task" | "milestone" | "event" | "bill";
  sourceId: string;
  parentId: string;
  userId: string;
  workspaceId: string | null;
  title: string;
  dueDate: string;
  endDate: string | null;
  allDay: boolean;
  category: string | null;
  status: string;
  color: string | null;
  /** Only present on bill items */
  amount?: string | null;
}

export function getItemLink(item: CalendarItem): string {
  if (item.sourceType === "assignment") return `/academic/${item.parentId}`;
  if (item.sourceType === "event") return `/events/${item.sourceId}`;
  if (item.sourceType === "bill") return `/bills`;
  return `/projects/${item.parentId}`;
}

export const sourceLabels: Record<string, string> = {
  assignment: "Assignment",
  task: "Task",
  milestone: "Milestone",
  event: "Event",
  bill: "Bill",
};

export const statusLabels: Record<string, string> = {
  not_started: "Not Started",
  in_progress: "In Progress",
  submitted: "Submitted",
  graded: "Graded",
  done: "Done",
  cancelled: "Cancelled",
  pending: "Pending",
  confirmed: "Confirmed",
  tentative: "Tentative",
  completed: "Completed",
};

export function formatMonth(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function formatDateISO(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Start of the week (Sunday) for the given date. */
export function startOfWeek(date: Date): Date {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = d.getDay();
  d.setDate(d.getDate() - day);
  return d;
}

/** End of the week (Saturday 23:59:59.999) for the given date. */
export function endOfWeek(date: Date): Date {
  const d = startOfWeek(date);
  d.setDate(d.getDate() + 6);
  d.setHours(23, 59, 59, 999);
  return d;
}

export function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function endOfDay(date: Date): Date {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    23,
    59,
    59,
    999,
  );
}

export function getMonthDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startPad = firstDay.getDay();
  const totalDays = lastDay.getDate();
  const days: (number | null)[] = [];
  for (let i = 0; i < startPad; i++) days.push(null);
  for (let d = 1; d <= totalDays; d++) days.push(d);
  while (days.length % 7 !== 0) days.push(null);
  return days;
}

export function getWeekDays(weekStart: Date): Date[] {
  const days: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    days.push(d);
  }
  return days;
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/**
 * Check whether an item overlaps with the given day.
 * For non-event items, compares dueDate to the day.
 * For events, considers start/end range.
 */
export function itemOverlapsDay(item: CalendarItem, day: Date): boolean {
  const dayStart = startOfDay(day);
  const dayEnd = endOfDay(day);

  if (item.sourceType === "event") {
    const start = new Date(item.dueDate);
    const end = item.endDate ? new Date(item.endDate) : start;
    return start <= dayEnd && end >= dayStart;
  }

  if (!item.dueDate) return false;
  const d = new Date(item.dueDate);
  return d >= dayStart && d <= dayEnd;
}

/**
 * Get the event metadata (icon, colors) for an event item, or null for
 * non-event items.
 */
export { EVENT_CATEGORIES } from "@/components/events/event-categories";
export type { EventCategory };

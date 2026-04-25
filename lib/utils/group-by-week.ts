/**
 * Group a list of dated items into weekly buckets.
 *
 * If a `startDate` is provided, weeks are numbered 1..N counting from that
 * date ("Week 1 of class"). Otherwise the calendar week of each item's date
 * is used ("Week of Apr 21").
 *
 * Items without a date land in a trailing "Unscheduled" group.
 */

export interface WeekGroup<T> {
  /** Stable key for state (collapse, etc.). */
  key: string;
  /** Display label, e.g. "Week 3" or "Week of Apr 21" or "Unscheduled". */
  label: string;
  /** Optional date range subtitle, e.g. "Apr 22 – Apr 28". null when unscheduled. */
  range: string | null;
  /** Inclusive ISO date (YYYY-MM-DD) for the start of the week, or null. */
  weekStart: string | null;
  /** Items in this group, sorted by date ascending. */
  items: T[];
  /** True when this week contains today's date (current week). */
  isCurrent: boolean;
  /** True when the entire week is in the past. */
  isPast: boolean;
}

interface GroupOptions<T> {
  /** Date string (ISO) or null per item. */
  getDate: (item: T) => string | null;
  /** Optional course/project start date used to anchor "Week 1". */
  startDate?: string | null;
}

const MS_PER_DAY = 86_400_000;

function startOfDayLocal(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function startOfCalendarWeek(d: Date): Date {
  // Sunday-anchored, matching the rest of the app's calendar conventions.
  const x = startOfDayLocal(d);
  x.setDate(x.getDate() - x.getDay());
  return x;
}

function fmtDayMonth(d: Date): string {
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function toIsoDate(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function groupByWeek<T>(
  items: T[],
  { getDate, startDate }: GroupOptions<T>,
): WeekGroup<T>[] {
  const today = startOfDayLocal(new Date());
  const courseStart = startDate ? startOfDayLocal(new Date(startDate)) : null;

  const buckets = new Map<string, WeekGroup<T>>();
  const unscheduled: T[] = [];

  for (const item of items) {
    const raw = getDate(item);
    if (!raw) {
      unscheduled.push(item);
      continue;
    }
    const d = startOfDayLocal(new Date(raw));

    let weekStart: Date;
    let label: string;
    if (courseStart) {
      // Week N from course start. Week 1 begins on courseStart.
      const dayDelta = Math.floor((d.getTime() - courseStart.getTime()) / MS_PER_DAY);
      const weekIndex = Math.floor(dayDelta / 7); // 0-based; can be negative for items before start
      weekStart = new Date(courseStart);
      weekStart.setDate(courseStart.getDate() + weekIndex * 7);
      label = `Week ${weekIndex + 1}`;
    } else {
      weekStart = startOfCalendarWeek(d);
      label = `Week of ${fmtDayMonth(weekStart)}`;
    }

    const key = toIsoDate(weekStart);
    let group = buckets.get(key);
    if (!group) {
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      const isCurrent = today >= weekStart && today <= weekEnd;
      const isPast = weekEnd < today;
      group = {
        key,
        label,
        range: `${fmtDayMonth(weekStart)} – ${fmtDayMonth(weekEnd)}`,
        weekStart: key,
        items: [],
        isCurrent,
        isPast,
      };
      buckets.set(key, group);
    }
    group.items.push(item);
  }

  // Sort items within each bucket by their date
  for (const group of buckets.values()) {
    group.items.sort((a, b) => {
      const da = getDate(a);
      const db = getDate(b);
      if (!da) return 1;
      if (!db) return -1;
      return da.localeCompare(db);
    });
  }

  // Sort groups chronologically
  const sorted = Array.from(buckets.values()).sort((a, b) =>
    (a.weekStart ?? "").localeCompare(b.weekStart ?? ""),
  );

  if (unscheduled.length > 0) {
    sorted.push({
      key: "unscheduled",
      label: "Unscheduled",
      range: null,
      weekStart: null,
      items: unscheduled,
      isCurrent: false,
      isPast: false,
    });
  }

  return sorted;
}

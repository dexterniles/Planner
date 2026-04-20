"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCalendarItems } from "@/lib/hooks/use-calendar-items";
import { Skeleton } from "@/components/ui/skeleton";
import {
  EVENT_CATEGORIES,
  formatEventTime,
} from "@/components/events/event-categories";
import type { EventCategory } from "@/lib/validations/event";

interface CalendarItem {
  sourceType: "assignment" | "task" | "milestone" | "event";
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
}

function getItemLink(item: CalendarItem): string {
  if (item.sourceType === "assignment") return `/academic/${item.parentId}`;
  if (item.sourceType === "event") return `/events/${item.sourceId}`;
  return `/projects/${item.parentId}`;
}

const sourceLabels: Record<string, string> = {
  assignment: "Assignment",
  task: "Task",
  milestone: "Milestone",
  event: "Event",
};

const statusLabels: Record<string, string> = {
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

function formatMonth(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function getMonthDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startPad = firstDay.getDay(); // 0=Sun
  const totalDays = lastDay.getDate();

  const days: (number | null)[] = [];
  for (let i = 0; i < startPad; i++) days.push(null);
  for (let d = 1; d <= totalDays; d++) days.push(d);
  while (days.length % 7 !== 0) days.push(null);
  return days;
}

/** Expand a multi-day event into a list of {day, continues} markers */
function getEventDaysInMonth(
  item: CalendarItem,
  year: number,
  month: number,
): Array<{
  day: number;
  isStart: boolean;
  isEnd: boolean;
}> {
  const start = new Date(item.dueDate);
  const end = item.endDate ? new Date(item.endDate) : null;
  const monthStart = new Date(year, month, 1);
  const monthEnd = new Date(year, month + 1, 0);

  const effectiveStart = start > monthStart ? start : monthStart;
  const effectiveEnd = end && end < monthEnd ? end : end ? end : start;
  const finalEnd = effectiveEnd > monthEnd ? monthEnd : effectiveEnd;

  const result: Array<{ day: number; isStart: boolean; isEnd: boolean }> = [];

  // Single-day or single-point events
  if (!end) {
    if (
      start.getFullYear() === year &&
      start.getMonth() === month
    ) {
      result.push({ day: start.getDate(), isStart: true, isEnd: true });
    }
    return result;
  }

  // Multi-day: iterate through each day
  const current = new Date(
    effectiveStart.getFullYear(),
    effectiveStart.getMonth(),
    effectiveStart.getDate(),
  );
  const last = new Date(
    finalEnd.getFullYear(),
    finalEnd.getMonth(),
    finalEnd.getDate(),
  );

  while (current <= last) {
    if (current.getMonth() === month && current.getFullYear() === year) {
      const isStart =
        current.getFullYear() === start.getFullYear() &&
        current.getMonth() === start.getMonth() &&
        current.getDate() === start.getDate();
      const isEnd =
        current.getFullYear() === end.getFullYear() &&
        current.getMonth() === end.getMonth() &&
        current.getDate() === end.getDate();
      result.push({ day: current.getDate(), isStart, isEnd });
    }
    current.setDate(current.getDate() + 1);
  }

  return result;
}

interface DayItem {
  item: CalendarItem;
  /** For events: whether this cell is the event's start day */
  isStart: boolean;
  /** For events: whether this cell is the event's end day */
  isEnd: boolean;
}

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthStr = formatMonth(currentDate);

  const { data: items, isLoading } = useCalendarItems(monthStr);

  const days = getMonthDays(year, month);
  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  // Expand items into per-day entries (events may span multiple days)
  const itemsByDay = useMemo(() => {
    const map = new Map<number, DayItem[]>();
    if (!items) return map;

    for (const item of items as CalendarItem[]) {
      if (item.sourceType === "event") {
        const occurrences = getEventDaysInMonth(item, year, month);
        for (const occ of occurrences) {
          const existing = map.get(occ.day) ?? [];
          existing.push({
            item,
            isStart: occ.isStart,
            isEnd: occ.isEnd,
          });
          map.set(occ.day, existing);
        }
      } else {
        const d = new Date(item.dueDate);
        if (d.getFullYear() === year && d.getMonth() === month) {
          const existing = map.get(d.getDate()) ?? [];
          existing.push({ item, isStart: true, isEnd: true });
          map.set(d.getDate(), existing);
        }
      }
    }
    return map;
  }, [items, year, month]);

  const navigateMonth = (delta: number) => {
    const next = new Date(year, month + delta, 1);
    setCurrentDate(next);
  };

  const today = new Date();
  const isCurrentMonth =
    today.getFullYear() === year && today.getMonth() === month;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Calendar</h1>
        {!isCurrentMonth && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentDate(new Date())}
          >
            Today
          </Button>
        )}
      </div>

      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigateMonth(-1)}
          aria-label="Previous month"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h2 className="text-lg font-semibold min-w-[180px] text-center">
          {currentDate.toLocaleDateString("en-US", {
            month: "long",
            year: "numeric",
          })}
        </h2>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigateMonth(1)}
          aria-label="Next month"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {isLoading ? (
        <Skeleton className="h-[450px] w-full rounded-xl" />
      ) : (
        <div className="rounded-lg border overflow-hidden">
          <div className="grid grid-cols-7">
            {weekDays.map((d) => (
              <div
                key={d}
                className="border-b bg-muted/50 px-2 py-2 text-center text-xs font-medium text-muted-foreground"
              >
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {days.map((day, i) => {
              const isToday = isCurrentMonth && day === today.getDate();
              const dayItems = day ? itemsByDay.get(day) ?? [] : [];

              return (
                <div
                  key={i}
                  className={`min-h-[70px] md:min-h-[100px] border-b border-r p-1 md:p-1.5 ${
                    day ? "bg-background" : "bg-muted/20"
                  }`}
                >
                  {day && (
                    <>
                      <span
                        className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs ${
                          isToday
                            ? "bg-primary text-primary-foreground font-bold"
                            : "text-muted-foreground"
                        }`}
                      >
                        {day}
                      </span>
                      <div className="mt-1 space-y-0.5">
                        {dayItems.slice(0, 3).map((dayItem) => (
                          <DayPill key={`${dayItem.item.sourceType}-${dayItem.item.sourceId}-${day}`} dayItem={dayItem} />
                        ))}
                        {dayItems.length > 3 && (
                          <span className="block px-1 text-[10px] text-muted-foreground">
                            +{dayItems.length - 3} more
                          </span>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {items && items.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-muted-foreground">
            This month · {items.length}
          </h3>
          <div className="space-y-1">
            {(items as CalendarItem[]).map((item) => (
              <ListRow key={`${item.sourceType}-${item.sourceId}`} item={item} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function DayPill({ dayItem }: { dayItem: DayItem }) {
  const { item, isStart, isEnd } = dayItem;
  const isEvent = item.sourceType === "event";
  const isMultiDay = isEvent && item.endDate && !(isStart && isEnd);
  const meta = isEvent && item.category
    ? EVENT_CATEGORIES[item.category as EventCategory]
    : null;
  const Icon = meta?.icon;
  const color = item.color ?? meta?.defaultColor ?? "#888";

  // Build continuation prefix/suffix for multi-day
  const prefix = isMultiDay && !isStart ? "← " : "";
  const suffix = isMultiDay && !isEnd ? " →" : "";

  return (
    <Link
      href={getItemLink(item)}
      className={`flex items-center gap-1 px-1 py-0.5 text-[11px] leading-tight truncate transition-opacity hover:opacity-75 ${
        isEvent
          ? `${isStart ? "rounded-l" : ""} ${isEnd ? "rounded-r" : ""} ${!isStart && !isEnd ? "" : ""} text-white font-medium`
          : "rounded"
      }`}
      style={
        isEvent
          ? { backgroundColor: color }
          : {
              backgroundColor: color ? `${color}20` : undefined,
              borderLeft: `2px solid ${color}`,
            }
      }
      title={`${sourceLabels[item.sourceType]}: ${item.title}`}
    >
      {isEvent && Icon && isStart && (
        <Icon className="h-2.5 w-2.5 shrink-0" />
      )}
      <span className={`truncate ${isEvent ? "italic" : ""}`}>
        {prefix}
        {item.title}
        {suffix}
      </span>
    </Link>
  );
}

function ListRow({ item }: { item: CalendarItem }) {
  const isEvent = item.sourceType === "event";
  const meta = isEvent && item.category
    ? EVENT_CATEGORIES[item.category as EventCategory]
    : null;
  const Icon = meta?.icon;
  const color = item.color ?? meta?.defaultColor ?? null;

  return (
    <Link
      href={getItemLink(item)}
      className="flex items-center gap-3 rounded-md border px-3 py-2 text-sm hover:bg-accent transition-colors"
    >
      {isEvent && Icon ? (
        <div
          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-gradient-to-br ${meta!.gradient}`}
        >
          <Icon className={`h-3 w-3 ${meta!.text}`} />
        </div>
      ) : (
        <div
          className="h-2 w-2 rounded-full"
          style={{ backgroundColor: color ?? "#888" }}
        />
      )}
      <span className="font-medium">{item.title}</span>
      <Badge variant="outline" className="text-xs">
        {sourceLabels[item.sourceType] ?? item.sourceType}
      </Badge>
      <span className="ml-auto text-xs text-muted-foreground">
        {isEvent
          ? formatEventTime(item.dueDate, item.endDate, item.allDay)
          : new Date(item.dueDate).toLocaleDateString()}
      </span>
      <Badge variant="secondary" className="text-xs">
        {statusLabels[item.status] ?? item.status}
      </Badge>
    </Link>
  );
}

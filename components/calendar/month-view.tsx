"use client";

import Link from "next/link";
import { useCalendarItems } from "@/lib/hooks/use-calendar-items";
import { Skeleton } from "@/components/ui/skeleton";
import { EVENT_CATEGORIES } from "@/components/events/event-categories";
import {
  type CalendarItem,
  type EventCategory,
  formatMonth,
  getItemLink,
  getMonthDays,
  sourceLabels,
} from "./calendar-utils";

interface MonthViewProps {
  currentDate: Date;
  onSelectDay: (date: Date) => void;
}

interface DayItem {
  item: CalendarItem;
  isStart: boolean;
  isEnd: boolean;
}

function getEventDaysInMonth(
  item: CalendarItem,
  year: number,
  month: number,
): Array<{ day: number; isStart: boolean; isEnd: boolean }> {
  const start = new Date(item.dueDate);
  const end = item.endDate ? new Date(item.endDate) : null;
  const monthStart = new Date(year, month, 1);
  const monthEnd = new Date(year, month + 1, 0);

  const result: Array<{ day: number; isStart: boolean; isEnd: boolean }> = [];

  if (!end) {
    if (start.getFullYear() === year && start.getMonth() === month) {
      result.push({ day: start.getDate(), isStart: true, isEnd: true });
    }
    return result;
  }

  const effectiveStart = start > monthStart ? start : monthStart;
  const finalEnd = end < monthEnd ? end : monthEnd;
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

export function MonthView({ currentDate, onSelectDay }: MonthViewProps) {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthStr = formatMonth(currentDate);

  const { data: items, isLoading } = useCalendarItems(monthStr);

  const days = getMonthDays(year, month);
  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const weekDaysShort = ["S", "M", "T", "W", "T", "F", "S"];

  const itemsByDay = new Map<number, DayItem[]>();
  if (items) {
    for (const item of items as CalendarItem[]) {
      if (item.sourceType === "event") {
        const occurrences = getEventDaysInMonth(item, year, month);
        for (const occ of occurrences) {
          const existing = itemsByDay.get(occ.day) ?? [];
          existing.push({
            item,
            isStart: occ.isStart,
            isEnd: occ.isEnd,
          });
          itemsByDay.set(occ.day, existing);
        }
      } else {
        const d = new Date(item.dueDate);
        if (d.getFullYear() === year && d.getMonth() === month) {
          const existing = itemsByDay.get(d.getDate()) ?? [];
          existing.push({ item, isStart: true, isEnd: true });
          itemsByDay.set(d.getDate(), existing);
        }
      }
    }
  }

  const today = new Date();
  const isCurrentMonth =
    today.getFullYear() === year && today.getMonth() === month;

  if (isLoading) {
    return <Skeleton className="h-full min-h-[450px] w-full rounded-xl" />;
  }

  return (
    <div className="flex h-full min-h-[500px] flex-col rounded-lg border overflow-hidden">
      <div className="grid grid-cols-7 shrink-0">
        {weekDays.map((d, i) => (
          <div
            key={i}
            className="border-b bg-muted/50 px-1 md:px-2 py-2 text-center text-xs font-medium text-muted-foreground"
          >
            <span className="hidden sm:inline">{d}</span>
            <span className="sm:hidden">{weekDaysShort[i]}</span>
          </div>
        ))}
      </div>
      <div className="grid flex-1 grid-cols-7 auto-rows-fr">
        {days.map((day, i) => {
          const isToday = isCurrentMonth && day === today.getDate();
          const dayItems = day ? itemsByDay.get(day) ?? [] : [];

          if (!day) {
            return (
              <div
                key={i}
                className="min-h-[70px] md:min-h-[90px] border-b border-r bg-muted/20"
              />
            );
          }

          const date = new Date(year, month, day);

          return (
            <button
              key={i}
              onClick={() => onSelectDay(date)}
              className="flex min-h-[70px] md:min-h-[90px] flex-col border-b border-r bg-background p-1 md:p-1.5 text-left transition-colors hover:bg-accent/30 focus:bg-accent/40 focus:outline-none overflow-hidden"
              aria-label={`View events for ${date.toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" })}`}
            >
              <span
                className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs ${
                  isToday
                    ? "bg-primary text-primary-foreground font-bold"
                    : "text-muted-foreground"
                }`}
              >
                {day}
              </span>

              {/* Desktop: full pills */}
              <div className="mt-1 hidden md:block space-y-0.5">
                {dayItems.slice(0, 3).map((dayItem) => (
                  <DayPill
                    key={`${dayItem.item.sourceType}-${dayItem.item.sourceId}-${day}`}
                    dayItem={dayItem}
                  />
                ))}
                {dayItems.length > 3 && (
                  <span className="block px-1 text-[10px] text-muted-foreground">
                    +{dayItems.length - 3} more
                  </span>
                )}
              </div>

              {/* Mobile: color dots only */}
              <div className="mt-1 flex flex-wrap gap-0.5 md:hidden">
                {dayItems.slice(0, 4).map((dayItem, idx) => {
                  const meta =
                    dayItem.item.sourceType === "event" && dayItem.item.category
                      ? EVENT_CATEGORIES[dayItem.item.category as EventCategory]
                      : null;
                  const color =
                    dayItem.item.color ?? meta?.defaultColor ?? "#888";
                  return (
                    <span
                      key={idx}
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ backgroundColor: color }}
                    />
                  );
                })}
                {dayItems.length > 4 && (
                  <span className="text-[9px] leading-[6px] text-muted-foreground">
                    +
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function DayPill({ dayItem }: { dayItem: DayItem }) {
  const { item, isStart, isEnd } = dayItem;
  const isEvent = item.sourceType === "event";
  const isMultiDay = isEvent && item.endDate && !(isStart && isEnd);
  const meta =
    isEvent && item.category
      ? EVENT_CATEGORIES[item.category as EventCategory]
      : null;
  const Icon = meta?.icon;
  const color = item.color ?? meta?.defaultColor ?? "#888";

  const prefix = isMultiDay && !isStart ? "← " : "";
  const suffix = isMultiDay && !isEnd ? " →" : "";

  return (
    <Link
      href={getItemLink(item)}
      onClick={(e) => e.stopPropagation()}
      className={`flex items-center gap-1 px-1 py-0.5 text-[11px] leading-tight truncate transition-opacity hover:opacity-75 ${
        isEvent
          ? `${isStart ? "rounded-l" : ""} ${isEnd ? "rounded-r" : ""} text-white font-medium`
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

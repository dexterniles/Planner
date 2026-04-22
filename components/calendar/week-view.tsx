"use client";

import Link from "next/link";
import { useCalendarItemsRange } from "@/lib/hooks/use-calendar-items";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { EVENT_CATEGORIES } from "@/components/events/event-categories";
import {
  type CalendarItem,
  type EventCategory,
  endOfWeek,
  getWeekDays,
  getItemLink,
  isSameDay,
  itemOverlapsDay,
  sourceLabels,
  startOfWeek,
} from "./calendar-utils";

interface WeekViewProps {
  currentDate: Date;
  onSelectDay: (date: Date) => void;
}

export function WeekView({ currentDate, onSelectDay }: WeekViewProps) {
  const weekStart = startOfWeek(currentDate);
  const weekEnd = endOfWeek(currentDate);
  const days = getWeekDays(weekStart);

  const { data: items, isLoading } = useCalendarItemsRange(
    weekStart.toISOString(),
    weekEnd.toISOString(),
  );

  const today = new Date();

  if (isLoading) {
    return (
      <div className="grid h-full gap-3 md:grid-cols-7">
        {days.map((_, i) => (
          <Skeleton key={i} className="h-48 md:h-full w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-2 md:grid-cols-7 md:h-full md:overflow-hidden">
      {days.map((day) => {
        const isToday = isSameDay(day, today);
        const dayItems = ((items ?? []) as CalendarItem[]).filter((item) =>
          itemOverlapsDay(item, day),
        );

        return (
          <div
            key={day.toISOString()}
            className={`flex flex-col rounded-xl border bg-card p-3 shadow-md transition-colors md:min-h-0 md:overflow-hidden ${
              isToday ? "border-primary/40 ring-1 ring-primary/15" : "border-border/60"
            }`}
          >
            <button
              onClick={() => onSelectDay(day)}
              className="mb-3 w-full shrink-0 border-b border-border/60 pb-2 text-left transition-colors"
              aria-label={`Switch to day view for ${day.toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" })}`}
            >
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-[10.5px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
                  {day.toLocaleDateString([], { weekday: "short" })}
                </span>
                <span
                  className={`font-serif text-[22px] leading-none tabular-nums ${
                    isToday ? "text-primary" : "text-foreground"
                  }`}
                >
                  {day.getDate()}
                </span>
              </div>
            </button>

            {dayItems.length === 0 ? (
              <p className="py-1 text-[11px] text-muted-foreground">—</p>
            ) : (
              <div className="flex-1 space-y-1 md:overflow-y-auto md:min-h-0">
                {dayItems.map((item) => (
                  <WeekItemCard
                    key={`${item.sourceType}-${item.sourceId}`}
                    item={item}
                    day={day}
                  />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function WeekItemCard({ item, day }: { item: CalendarItem; day: Date }) {
  const isEvent = item.sourceType === "event";
  const meta =
    isEvent && item.category
      ? EVENT_CATEGORIES[item.category as EventCategory]
      : null;
  const color = item.color ?? meta?.defaultColor ?? "#888";

  const start = new Date(item.dueDate);
  const end = item.endDate ? new Date(item.endDate) : null;
  const isStart = !end || isSameDay(start, day);
  const isEnd = !end || isSameDay(end, day);
  const showPrefix = isEvent && !isStart;
  const showSuffix = isEvent && !isEnd;

  const timeLabel =
    isEvent && !item.allDay && isStart
      ? start.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
      : null;

  return (
    <Link
      href={getItemLink(item)}
      className="group block rounded-sm py-[3px] pl-2 pr-2 transition-colors hover:bg-accent/50"
      style={{
        borderLeft: `2px solid ${color}`,
        backgroundColor: `${color}12`,
      }}
      title={`${sourceLabels[item.sourceType]}: ${item.title}`}
    >
      <p className={`text-[12px] leading-snug font-medium text-foreground line-clamp-2 ${isEvent ? "italic" : ""}`}>
        {showPrefix && "← "}
        {item.title}
        {showSuffix && " →"}
      </p>
      {timeLabel && (
        <p className="mt-0.5 font-mono text-[10.5px] text-muted-foreground tabular-nums">
          {timeLabel}
        </p>
      )}
    </Link>
  );
}

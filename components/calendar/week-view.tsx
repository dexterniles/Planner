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
      <div className="grid gap-3 md:grid-cols-7">
        {days.map((_, i) => (
          <Skeleton key={i} className="h-48 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-2 md:grid-cols-7">
      {days.map((day) => {
        const isToday = isSameDay(day, today);
        const dayItems = ((items ?? []) as CalendarItem[]).filter((item) =>
          itemOverlapsDay(item, day),
        );

        return (
          <div
            key={day.toISOString()}
            className={`rounded-xl border bg-card p-3 transition-colors ${
              isToday
                ? "border-primary/50 ring-1 ring-primary/20 shadow-sm"
                : "border-border/60"
            }`}
          >
            <button
              onClick={() => onSelectDay(day)}
              className="mb-2 w-full text-left transition-colors"
              aria-label={`Switch to day view for ${day.toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" })}`}
            >
              <div className="flex items-baseline justify-between gap-2">
                <span
                  className={`text-xs font-medium uppercase tracking-wide ${
                    isToday ? "text-primary" : "text-muted-foreground"
                  }`}
                >
                  {day.toLocaleDateString([], { weekday: "short" })}
                </span>
                <span
                  className={`text-lg font-semibold tabular-nums ${
                    isToday ? "text-primary" : ""
                  }`}
                >
                  {day.getDate()}
                </span>
              </div>
            </button>

            {dayItems.length === 0 ? (
              <p className="py-2 text-center text-[11px] text-muted-foreground">
                —
              </p>
            ) : (
              <div className="space-y-1">
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
  const Icon = meta?.icon;
  const color = item.color ?? meta?.defaultColor ?? "#888";

  // For multi-day events, show continuation arrows
  const start = new Date(item.dueDate);
  const end = item.endDate ? new Date(item.endDate) : null;
  const isStart = !end || isSameDay(start, day);
  const isEnd = !end || isSameDay(end, day);
  const showPrefix = isEvent && !isStart;
  const showSuffix = isEvent && !isEnd;

  // Time label for timed events
  const timeLabel =
    isEvent && !item.allDay && isStart
      ? start.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
      : null;

  return (
    <Link
      href={getItemLink(item)}
      className="group block rounded-lg px-2 py-1.5 transition-colors hover:bg-accent/60"
      title={`${sourceLabels[item.sourceType]}: ${item.title}`}
    >
      <div className="flex items-start gap-2">
        {/* Marker: icon badge for events, dot for other items */}
        {isEvent && Icon ? (
          <div
            className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md"
            style={{
              backgroundImage: `linear-gradient(135deg, ${color}35, ${color}12)`,
            }}
          >
            <Icon className="h-3 w-3" style={{ color }} />
          </div>
        ) : (
          <span
            className="mt-[5px] h-2 w-2 shrink-0 rounded-full"
            style={{ backgroundColor: color }}
            aria-hidden="true"
          />
        )}

        {/* Text */}
        <div className="min-w-0 flex-1">
          <p className="text-[13px] leading-snug font-medium text-foreground line-clamp-2">
            {showPrefix && "← "}
            {item.title}
            {showSuffix && " →"}
          </p>
          {timeLabel && (
            <p className="mt-0.5 text-[11px] text-muted-foreground tabular-nums">
              {timeLabel}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}

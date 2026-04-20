"use client";

import Link from "next/link";
import { useCalendarItemsRange } from "@/lib/hooks/use-calendar-items";
import { Skeleton } from "@/components/ui/skeleton";
import { EVENT_CATEGORIES } from "@/components/events/event-categories";
import {
  type CalendarItem,
  type EventCategory,
  endOfDay,
  getItemLink,
  isSameDay,
  itemOverlapsDay,
  sourceLabels,
  startOfDay,
} from "./calendar-utils";

interface DayViewProps {
  currentDate: Date;
}

const HOUR_HEIGHT = 64; // px per hour
const START_HOUR = 6; // 6am
const END_HOUR = 24; // 12am (shows 6am–11pm with 00:00 boundary)
const TOTAL_HOURS = END_HOUR - START_HOUR;

interface TimedEvent {
  item: CalendarItem;
  topPx: number;
  heightPx: number;
  column: number;
  columnCount: number;
}

export function DayView({ currentDate }: DayViewProps) {
  const dayStart = startOfDay(currentDate);
  const dayEnd = endOfDay(currentDate);

  const { data: items, isLoading } = useCalendarItemsRange(
    dayStart.toISOString(),
    dayEnd.toISOString(),
  );

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full rounded-lg" />
        <Skeleton className="h-[800px] w-full rounded-lg" />
      </div>
    );
  }

  const dayItems = ((items ?? []) as CalendarItem[]).filter((item) =>
    itemOverlapsDay(item, currentDate),
  );

  // Split into all-day (top row) and timed (timeline)
  const allDayItems: CalendarItem[] = [];
  const timedItems: CalendarItem[] = [];

  for (const item of dayItems) {
    if (item.sourceType !== "event") {
      // Assignments/tasks/milestones: if they have a time component, show on timeline.
      // If they're at 00:00 or near (likely date-only), show in all-day.
      const d = new Date(item.dueDate);
      if (d.getHours() === 0 && d.getMinutes() === 0) {
        allDayItems.push(item);
      } else {
        timedItems.push(item);
      }
    } else if (item.allDay) {
      allDayItems.push(item);
    } else {
      // Timed event. If it spans multiple days and doesn't start today, it's
      // effectively all-day-ish for this day — treat as all-day row.
      const start = new Date(item.dueDate);
      if (!isSameDay(start, currentDate)) {
        allDayItems.push(item);
      } else {
        timedItems.push(item);
      }
    }
  }

  // Layout timed events with overlap handling (simple side-by-side split)
  const laidOut = layoutTimedEvents(timedItems, currentDate);

  return (
    <div className="flex h-full flex-col gap-3">
      {/* All-day row */}
      {allDayItems.length > 0 && (
        <div className="rounded-xl border bg-card p-3 shadow-sm shrink-0">
          <p className="mb-2 text-[10px] uppercase tracking-wide font-medium text-muted-foreground">
            All day · {allDayItems.length}
          </p>
          <div className="space-y-1">
            {allDayItems.map((item) => (
              <AllDayRow
                key={`${item.sourceType}-${item.sourceId}`}
                item={item}
                day={currentDate}
              />
            ))}
          </div>
        </div>
      )}

      {/* Hourly timeline */}
      <div className="flex-1 min-h-0 overflow-y-auto rounded-xl border bg-card shadow-sm">
        <div className="flex" style={{ height: TOTAL_HOURS * HOUR_HEIGHT }}>
          {/* Hour labels column */}
          <div className="relative w-14 shrink-0 border-r border-border/60">
            {Array.from({ length: TOTAL_HOURS }).map((_, i) => {
              const hour = START_HOUR + i;
              const label = formatHourLabel(hour);
              return (
                <div
                  key={i}
                  className="absolute left-0 right-0 -translate-y-1/2 pr-2 text-right text-[10px] text-muted-foreground"
                  style={{ top: i * HOUR_HEIGHT }}
                >
                  {label}
                </div>
              );
            })}
          </div>

          {/* Timeline */}
          <div className="relative flex-1">
            {/* Hour grid lines */}
            {Array.from({ length: TOTAL_HOURS }).map((_, i) => (
              <div
                key={i}
                className="absolute left-0 right-0 border-t border-border/40"
                style={{ top: i * HOUR_HEIGHT }}
              />
            ))}

            {/* "Now" indicator */}
            {isSameDay(currentDate, new Date()) && <NowIndicator />}

            {/* Events */}
            {laidOut.map(({ item, topPx, heightPx, column, columnCount }) => (
              <TimedEventCard
                key={`${item.sourceType}-${item.sourceId}`}
                item={item}
                topPx={topPx}
                heightPx={heightPx}
                column={column}
                columnCount={columnCount}
              />
            ))}

            {laidOut.length === 0 && allDayItems.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center">
                <p className="text-sm text-muted-foreground">
                  Nothing scheduled today.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function formatHourLabel(hour: number): string {
  if (hour === 0 || hour === 24) return "12a";
  if (hour === 12) return "12p";
  if (hour < 12) return `${hour}a`;
  return `${hour - 12}p`;
}

function NowIndicator() {
  const now = new Date();
  const minutesFromStart =
    (now.getHours() - START_HOUR) * 60 + now.getMinutes();
  if (minutesFromStart < 0 || minutesFromStart > TOTAL_HOURS * 60) return null;

  const topPx = (minutesFromStart / 60) * HOUR_HEIGHT;

  return (
    <>
      <div
        className="absolute left-0 right-0 z-10 border-t-2 border-primary"
        style={{ top: topPx }}
      />
      <div
        className="absolute left-0 z-10 h-2.5 w-2.5 -translate-x-1 -translate-y-1/2 rounded-full bg-primary shadow-md"
        style={{ top: topPx }}
      />
    </>
  );
}

function TimedEventCard({
  item,
  topPx,
  heightPx,
  column,
  columnCount,
}: {
  item: CalendarItem;
  topPx: number;
  heightPx: number;
  column: number;
  columnCount: number;
}) {
  const isEvent = item.sourceType === "event";
  const meta =
    isEvent && item.category
      ? EVENT_CATEGORIES[item.category as EventCategory]
      : null;
  const Icon = meta?.icon;
  const color = item.color ?? meta?.defaultColor ?? "#888";

  const widthPct = 100 / columnCount;
  const leftPct = column * widthPct;

  const start = new Date(item.dueDate);
  const end = item.endDate ? new Date(item.endDate) : null;
  const timeLabel = end
    ? `${start.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })} – ${end.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`
    : start.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

  return (
    <Link
      href={getItemLink(item)}
      className={`absolute overflow-hidden rounded-md border-l-[3px] p-1.5 text-[11px] transition-all hover:shadow-md ${
        isEvent ? "text-white" : "text-foreground"
      }`}
      style={{
        top: topPx,
        height: Math.max(heightPx - 2, 20),
        left: `calc(${leftPct}% + 4px)`,
        width: `calc(${widthPct}% - 8px)`,
        backgroundColor: isEvent ? color : `${color}22`,
        borderLeftColor: color,
      }}
      title={`${sourceLabels[item.sourceType]}: ${item.title} · ${timeLabel}`}
    >
      <div className="flex items-start gap-1">
        {Icon && isEvent && <Icon className="mt-0.5 h-2.5 w-2.5 shrink-0" />}
        <div className="min-w-0 flex-1 leading-tight">
          <p
            className={`truncate font-medium ${isEvent ? "italic" : ""}`}
          >
            {item.title}
          </p>
          <p
            className={`truncate text-[10px] ${isEvent ? "text-white/80" : "text-muted-foreground"}`}
          >
            {timeLabel}
          </p>
        </div>
      </div>
    </Link>
  );
}

function AllDayRow({ item, day }: { item: CalendarItem; day: Date }) {
  const isEvent = item.sourceType === "event";
  const meta =
    isEvent && item.category
      ? EVENT_CATEGORIES[item.category as EventCategory]
      : null;
  const Icon = meta?.icon;
  const color = item.color ?? meta?.defaultColor ?? "#888";

  // Multi-day continuation indicators
  const start = new Date(item.dueDate);
  const end = item.endDate ? new Date(item.endDate) : null;
  const isStart = !end || isSameDay(start, day);
  const isEnd = !end || isSameDay(end, day);
  const showPrefix = isEvent && !isStart;
  const showSuffix = isEvent && !isEnd;

  return (
    <Link
      href={getItemLink(item)}
      className="group flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition-colors hover:bg-accent"
      style={{ borderLeft: `2px solid ${color}` }}
    >
      {Icon && (
        <div
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-gradient-to-br"
          style={{
            backgroundImage: `linear-gradient(to bottom right, ${color}30, ${color}10)`,
          }}
        >
          <Icon className="h-3 w-3" style={{ color: meta?.defaultColor }} />
        </div>
      )}
      <span className="flex-1 font-medium truncate">
        {showPrefix && "← "}
        {item.title}
        {showSuffix && " →"}
      </span>
      <span className="text-xs text-muted-foreground capitalize">
        {item.sourceType}
      </span>
    </Link>
  );
}

/**
 * Position timed events with simple overlap handling — events that overlap
 * in time get split into side-by-side columns.
 */
function layoutTimedEvents(
  items: CalendarItem[],
  day: Date,
): TimedEvent[] {
  const dayStart = startOfDay(day);

  // Compute each event's top + height first
  const positioned = items
    .map((item) => {
      const start = new Date(item.dueDate);
      const end = item.endDate ? new Date(item.endDate) : null;

      // Clamp to visible hours
      const visibleStart = new Date(dayStart);
      visibleStart.setHours(START_HOUR, 0, 0, 0);
      const visibleEnd = new Date(dayStart);
      visibleEnd.setHours(END_HOUR, 0, 0, 0);

      const effStart = start < visibleStart ? visibleStart : start;
      const effEnd = end
        ? end > visibleEnd
          ? visibleEnd
          : end
        : // Single-point event → give it 45 min height
          new Date(effStart.getTime() + 45 * 60_000);

      const minutesFromStart =
        (effStart.getHours() - START_HOUR) * 60 + effStart.getMinutes();
      const topPx = (minutesFromStart / 60) * HOUR_HEIGHT;

      const durationMinutes =
        (effEnd.getTime() - effStart.getTime()) / 60_000;
      const heightPx = Math.max(
        (durationMinutes / 60) * HOUR_HEIGHT,
        22,
      );

      return { item, topPx, heightPx, start: effStart, end: effEnd };
    })
    .sort((a, b) => a.topPx - b.topPx);

  // Naive overlap clustering: events that overlap in time share column space
  const clusters: Array<typeof positioned> = [];
  for (const ev of positioned) {
    const cluster = clusters.find((c) =>
      c.some((e) => ev.start < e.end && ev.end > e.start),
    );
    if (cluster) {
      cluster.push(ev);
    } else {
      clusters.push([ev]);
    }
  }

  const result: TimedEvent[] = [];
  for (const cluster of clusters) {
    const columnCount = cluster.length;
    cluster.forEach((ev, i) => {
      result.push({
        item: ev.item,
        topPx: ev.topPx,
        heightPx: ev.heightPx,
        column: i,
        columnCount,
      });
    });
  }
  return result;
}

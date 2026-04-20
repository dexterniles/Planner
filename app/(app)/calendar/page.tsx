"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCalendarItems } from "@/lib/hooks/use-calendar-items";
import { Skeleton } from "@/components/ui/skeleton";

interface CalendarItem {
  sourceType: string;
  sourceId: string;
  parentId: string;
  userId: string;
  workspaceId: string;
  title: string;
  dueDate: string;
  status: string;
  color: string | null;
}

function getItemLink(item: CalendarItem): string {
  if (item.sourceType === "assignment") {
    return `/academic/${item.parentId}`;
  }
  return `/projects/${item.parentId}`;
}

const sourceLabels: Record<string, string> = {
  assignment: "Assignment",
  task: "Task",
  milestone: "Milestone",
};

const statusLabels: Record<string, string> = {
  not_started: "Not Started",
  in_progress: "In Progress",
  submitted: "Submitted",
  graded: "Graded",
  done: "Done",
  cancelled: "Cancelled",
  pending: "Pending",
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
  // Pad end to fill last row
  while (days.length % 7 !== 0) days.push(null);
  return days;
}

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthStr = formatMonth(currentDate);

  const { data: items, isLoading } = useCalendarItems(monthStr);

  const days = getMonthDays(year, month);
  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  // Group items by day
  const itemsByDay = new Map<number, CalendarItem[]>();
  if (items) {
    for (const item of items) {
      const d = new Date(item.dueDate).getDate();
      const existing = itemsByDay.get(d) ?? [];
      existing.push(item);
      itemsByDay.set(d, existing);
    }
  }

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
        <Button variant="ghost" size="icon" onClick={() => navigateMonth(-1)}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h2 className="text-lg font-semibold min-w-[180px] text-center">
          {currentDate.toLocaleDateString("en-US", {
            month: "long",
            year: "numeric",
          })}
        </h2>
        <Button variant="ghost" size="icon" onClick={() => navigateMonth(1)}>
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
              const isToday =
                isCurrentMonth && day === today.getDate();
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
                        {dayItems.slice(0, 3).map((item) => (
                          <Link
                            key={`${item.sourceType}-${item.sourceId}`}
                            href={getItemLink(item)}
                            className="flex items-center gap-1 rounded px-1 py-0.5 text-[11px] leading-tight truncate hover:opacity-75 transition-opacity"
                            style={{
                              backgroundColor: item.color
                                ? `${item.color}20`
                                : undefined,
                              borderLeft: `2px solid ${item.color ?? "#888"}`,
                            }}
                            title={`${sourceLabels[item.sourceType]}: ${item.title}`}
                          >
                            <span className="truncate">{item.title}</span>
                          </Link>
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
            This month ({items.length} items)
          </h3>
          <div className="space-y-1">
            {items.map((item: CalendarItem) => (
              <Link
                key={`${item.sourceType}-${item.sourceId}`}
                href={getItemLink(item)}
                className="flex items-center gap-3 rounded-md border px-3 py-2 text-sm hover:bg-accent transition-colors"
              >
                <div
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: item.color ?? "#888" }}
                />
                <span className="font-medium">{item.title}</span>
                <Badge variant="outline" className="text-xs">
                  {sourceLabels[item.sourceType] ?? item.sourceType}
                </Badge>
                <span className="ml-auto text-xs text-muted-foreground">
                  {new Date(item.dueDate).toLocaleDateString()}
                </span>
                <Badge variant="secondary" className="text-xs">
                  {statusLabels[item.status] ?? item.status}
                </Badge>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

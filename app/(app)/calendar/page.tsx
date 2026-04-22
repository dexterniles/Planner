"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { MonthView } from "@/components/calendar/month-view";
import { WeekView } from "@/components/calendar/week-view";
import { DayView } from "@/components/calendar/day-view";
import {
  endOfWeek,
  isSameDay,
  startOfWeek,
} from "@/components/calendar/calendar-utils";

type View = "month" | "week" | "day";
const STORAGE_KEY = "planner:calendar-view";

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setViewState] = useState<View>("month");
  const [ready, setReady] = useState(false);

  // Hydrate from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === "month" || stored === "week" || stored === "day") {
        setViewState(stored);
      }
    } catch {
      // ignore
    }
    setReady(true);
  }, []);

  const setView = useCallback((next: View) => {
    setViewState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // ignore
    }
  }, []);

  const navigate = useCallback(
    (delta: number) => {
      const next = new Date(currentDate);
      if (view === "month") {
        next.setMonth(next.getMonth() + delta);
      } else if (view === "week") {
        next.setDate(next.getDate() + delta * 7);
      } else {
        next.setDate(next.getDate() + delta);
      }
      setCurrentDate(next);
    },
    [currentDate, view],
  );

  // Keyboard navigation: left/right arrows when not in input
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }
      if (e.key === "ArrowLeft") {
        navigate(-1);
      } else if (e.key === "ArrowRight") {
        navigate(1);
      } else if (e.key === "t" || e.key === "T") {
        setCurrentDate(new Date());
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [navigate]);

  const selectDay = useCallback(
    (date: Date) => {
      setCurrentDate(date);
      setView("day");
    },
    [setView],
  );

  const today = new Date();
  const isOnToday = () => {
    if (view === "month") {
      return (
        currentDate.getFullYear() === today.getFullYear() &&
        currentDate.getMonth() === today.getMonth()
      );
    }
    if (view === "week") {
      const ws = startOfWeek(currentDate);
      const we = endOfWeek(currentDate);
      return today >= ws && today <= we;
    }
    return isSameDay(currentDate, today);
  };

  // Format the current title based on view
  const renderTitle = () => {
    if (view === "month") {
      return currentDate.toLocaleDateString([], {
        month: "long",
        year: "numeric",
      });
    }
    if (view === "week") {
      const ws = startOfWeek(currentDate);
      const we = endOfWeek(currentDate);
      const sameMonth = ws.getMonth() === we.getMonth();
      const sameYear = ws.getFullYear() === we.getFullYear();
      const opts: Intl.DateTimeFormatOptions = {
        month: "short",
        day: "numeric",
      };
      if (sameMonth && sameYear) {
        return `${ws.toLocaleDateString([], { month: "short", day: "numeric" })} – ${we.getDate()}, ${we.getFullYear()}`;
      }
      return `${ws.toLocaleDateString([], opts)} – ${we.toLocaleDateString([], opts)}, ${we.getFullYear()}`;
    }
    return currentDate.toLocaleDateString([], {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="flex h-full flex-col gap-4">
      {/* Header: title + view switcher + Today */}
      <div className="flex flex-col gap-3 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between shrink-0">
        <h1 className="font-serif text-[26px] md:text-[34px] font-medium leading-tight tracking-tight">
          Calendar
        </h1>
        <div className="flex items-center gap-2">
          <ViewSwitcher view={view} onChange={setView} />
          {!isOnToday() && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentDate(new Date())}
            >
              Today
            </Button>
          )}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center gap-3 shrink-0">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(-1)}
          aria-label={`Previous ${view}`}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h2 className="flex-1 text-center font-serif text-[22px] font-medium tracking-tight sm:flex-none sm:min-w-[260px]">
          {renderTitle()}
        </h2>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(1)}
          aria-label={`Next ${view}`}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* View content fills remaining height; key forces remount for fade */}
      <div
        key={view}
        className={`flex-1 min-h-0 ${ready ? "page-transition" : ""}`}
      >
        {view === "month" && (
          <MonthView currentDate={currentDate} onSelectDay={selectDay} />
        )}
        {view === "week" && (
          <WeekView currentDate={currentDate} onSelectDay={selectDay} />
        )}
        {view === "day" && <DayView currentDate={currentDate} />}
      </div>
    </div>
  );
}

function ViewSwitcher({
  view,
  onChange,
}: {
  view: View;
  onChange: (v: View) => void;
}) {
  const views: { value: View; label: string }[] = [
    { value: "day", label: "Day" },
    { value: "week", label: "Week" },
    { value: "month", label: "Month" },
  ];

  return (
    <div className="inline-flex rounded-md bg-card border border-border p-[3px] shadow-sm gap-[2px]">
      {views.map((v) => (
        <button
          key={v.value}
          onClick={() => onChange(v.value)}
          className={cn(
            "px-3 py-1 text-[12.5px] font-medium rounded-[5px] transition-colors duration-150",
            view === v.value
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {v.label}
        </button>
      ))}
    </div>
  );
}

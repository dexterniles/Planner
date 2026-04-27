"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
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
const VIEWS: View[] = ["month", "week", "day"];
const STORAGE_KEY = "planner:calendar-view";

function toIsoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function parseUrlDate(value: string | null): Date {
  if (value && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const parsed = new Date(value + "T12:00:00");
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  return new Date();
}

export function CalendarPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const rawView = searchParams.get("view");
  const view: View = VIEWS.includes(rawView as View)
    ? (rawView as View)
    : "month";
  const currentDate = parseUrlDate(searchParams.get("date"));
  const [ready, setReady] = useState(false);

  const updateUrl = useCallback(
    (next: { view?: View | null; date?: string | null }) => {
      const params = new URLSearchParams(searchParams);
      if (next.view !== undefined) {
        if (next.view === null || next.view === "month") params.delete("view");
        else params.set("view", next.view);
      }
      if (next.date !== undefined) {
        if (next.date === null) params.delete("date");
        else params.set("date", next.date);
      }
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  // localStorage hydration: if URL has no view param, fall back to saved preference.
  useEffect(() => {
    if (rawView === null) {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored === "week" || stored === "day") {
          updateUrl({ view: stored });
        }
      } catch {
        // localStorage unavailable — ignore
      }
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect -- gate page-transition class until after localStorage hydration
    setReady(true);
  }, [rawView, updateUrl]);

  const setView = useCallback(
    (next: View) => {
      try {
        localStorage.setItem(STORAGE_KEY, next);
      } catch {
        // ignore
      }
      updateUrl({ view: next });
    },
    [updateUrl],
  );

  const setCurrentDate = useCallback(
    (next: Date) => {
      const today = new Date();
      const isToday = isSameDay(next, today);
      updateUrl({ date: isToday ? null : toIsoDate(next) });
    },
    [updateUrl],
  );

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
    [currentDate, view, setCurrentDate],
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
  }, [navigate, setCurrentDate]);

  const selectDay = useCallback(
    (date: Date) => {
      try {
        localStorage.setItem(STORAGE_KEY, "day");
      } catch {
        // ignore
      }
      const today = new Date();
      const isToday = isSameDay(date, today);
      updateUrl({
        view: "day",
        date: isToday ? null : toIsoDate(date),
      });
    },
    [updateUrl],
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

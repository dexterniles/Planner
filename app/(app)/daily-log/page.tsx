"use client";

import { useState, useRef, useCallback } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { useDailyLog, useUpsertDailyLog } from "@/lib/hooks/use-daily-log";
import { useEventsByDate } from "@/lib/hooks/use-events";
import { Skeleton } from "@/components/ui/skeleton";
import {
  EVENT_CATEGORIES,
  formatEventTime,
} from "@/components/events/event-categories";
import type { EventCategory, EventStatus } from "@/lib/validations/event";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/page-header";

interface DayEvent {
  id: string;
  title: string;
  category: EventCategory;
  startsAt: string;
  endsAt: string | null;
  allDay: boolean;
  location: string | null;
  status: EventStatus;
  color: string | null;
}

function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

function formatDisplayDate(dateStr: string): string {
  const date = new Date(dateStr + "T12:00:00");
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

const MOOD_OPTIONS = ["Great", "Good", "Okay", "Tired", "Stressed", "Bad"];

export default function DailyLogPage() {
  const [selectedDate, setSelectedDate] = useState(formatDate(new Date()));
  const [content, setContent] = useState("");
  const [mood, setMood] = useState("");
  const [isDirty, setIsDirty] = useState(false);

  const { data: log, isLoading } = useDailyLog(selectedDate);
  const { data: dayEvents } = useEventsByDate(selectedDate);
  const upsertLog = useUpsertDailyLog();
  const lastSyncedRef = useRef<string | null>(null);

  // Sync from server data without useEffect setState
  const logKey = log?.id ?? `empty-${selectedDate}`;
  if (lastSyncedRef.current !== logKey) {
    lastSyncedRef.current = logKey;
    if (log) {
      setContent(log.content ?? "");
      setMood(log.mood ?? "");
    } else if (!isLoading) {
      setContent("");
      setMood("");
    }
    setIsDirty(false);
  }

  const handleSave = useCallback(async () => {
    try {
      await upsertLog.mutateAsync({
        logDate: selectedDate,
        content: content || null,
        mood: mood || null,
      });
      setIsDirty(false);
      toast.success("Log saved");
    } catch {
      toast.error("Failed to save log");
    }
  }, [upsertLog, selectedDate, content, mood]);

  const navigateDay = (delta: number) => {
    const date = new Date(selectedDate + "T12:00:00");
    date.setDate(date.getDate() + delta);
    setSelectedDate(formatDate(date));
  };

  const isToday = selectedDate === formatDate(new Date());

  return (
    <div>
      <PageHeader
        title="Daily Log"
        actions={
          <Button
            onClick={handleSave}
            disabled={!isDirty || upsertLog.isPending}
          >
            <Save className="mr-1.5 h-4 w-4" />
            {upsertLog.isPending ? "Saving..." : "Save"}
          </Button>
        }
      />

      <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigateDay(-1)}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="text-center">
          <p className="font-serif text-[20px] md:text-[22px] font-medium leading-tight tracking-tight">
            {formatDisplayDate(selectedDate)}
          </p>
          {isToday && (
            <p className="text-[10.5px] font-medium uppercase tracking-[0.12em] text-primary">
              Today
            </p>
          )}
        </div>
        <Button variant="ghost" size="icon" onClick={() => navigateDay(1)}>
          <ChevronRight className="h-4 w-4" />
        </Button>
        {!isToday && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSelectedDate(formatDate(new Date()))}
          >
            Today
          </Button>
        )}
      </div>

      {dayEvents && dayEvents.length > 0 && (
        <Card className="p-4">
          <p className="mb-3 text-[10.5px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
            Events on this day
          </p>
          <div className="flex flex-wrap gap-2">
            {(dayEvents as DayEvent[]).map((ev) => {
              const meta =
                EVENT_CATEGORIES[ev.category] ?? EVENT_CATEGORIES.other;
              const Icon = meta.icon;
              const color = ev.color ?? meta.defaultColor;
              return (
                <Link
                  key={ev.id}
                  href={`/events/${ev.id}`}
                  className="flex items-center gap-2 rounded-sm py-1 pl-2 pr-3 text-[13px] transition-colors hover:bg-accent/50"
                  style={{
                    borderLeft: `2px solid ${color}`,
                    backgroundColor: `${color}12`,
                  }}
                >
                  <Icon
                    className="h-3 w-3 shrink-0"
                    style={{ color }}
                    strokeWidth={1.75}
                  />
                  <span className="font-medium italic">{ev.title}</span>
                  <span className="font-mono text-[11px] text-muted-foreground tabular-nums">
                    {formatEventTime(ev.startsAt, ev.endsAt, ev.allDay)}
                  </span>
                </Link>
              );
            })}
          </div>
        </Card>
      )}

      {isLoading ? (
        <div className="grid gap-6 lg:grid-cols-[1fr_250px]">
          <Skeleton className="h-[360px] w-full rounded-lg" />
          <div className="space-y-4">
            <Skeleton className="h-[140px] w-full rounded-xl" />
            <Skeleton className="h-[80px] w-full rounded-xl" />
          </div>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1fr_250px]">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label
                htmlFor="log-content"
                className="text-[10.5px] font-medium uppercase tracking-[0.12em] text-muted-foreground"
              >
                Journal entry
              </Label>
              <textarea
                id="log-content"
                value={content}
                onChange={(e) => {
                  setContent(e.target.value);
                  setIsDirty(true);
                }}
                placeholder="What happened today?"
                rows={16}
                className="w-full resize-y rounded-md border border-border/60 bg-card font-serif text-[16px] leading-[28px] text-foreground shadow-sm outline-none transition-[border-color,box-shadow] duration-150 ease-out placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40 min-h-[420px] px-5 py-[14px]"
                style={{
                  backgroundImage:
                    "repeating-linear-gradient(to bottom, transparent 0, transparent 27px, var(--border) 27px, var(--border) 28px)",
                }}
              />
            </div>
          </div>

          <div className="space-y-4">
            <Card className="p-4">
              <Label className="mb-3 block text-[10.5px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
                Mood
              </Label>
              <div className="flex flex-wrap gap-2">
                {MOOD_OPTIONS.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => {
                      setMood(mood === m ? "" : m);
                      setIsDirty(true);
                    }}
                    className={`rounded-full border px-3.5 py-1 font-serif text-[14px] transition-colors ${
                      mood === m
                        ? "border-foreground bg-foreground text-background"
                        : "border-border bg-card text-muted-foreground hover:border-muted-foreground/40 hover:text-foreground"
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
              {mood && (
                <div className="mt-3">
                  <Label htmlFor="custom-mood" className="text-xs">
                    Or type your own
                  </Label>
                  <Input
                    id="custom-mood"
                    value={mood}
                    onChange={(e) => {
                      setMood(e.target.value);
                      setIsDirty(true);
                    }}
                    className="mt-1"
                    maxLength={50}
                  />
                </div>
              )}
            </Card>

            <Card className="p-4">
              <Label className="mb-2 block text-xs text-muted-foreground">
                Date
              </Label>
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            </Card>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}

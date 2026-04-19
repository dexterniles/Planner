"use client";

import { useState, useRef, useCallback } from "react";
import { ChevronLeft, ChevronRight, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { useDailyLog, useUpsertDailyLog } from "@/lib/hooks/use-daily-log";
import { toast } from "sonner";

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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Daily Log</h1>
        <Button
          onClick={handleSave}
          disabled={!isDirty || upsertLog.isPending}
        >
          <Save className="mr-1.5 h-4 w-4" />
          {upsertLog.isPending ? "Saving..." : "Save"}
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigateDay(-1)}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="text-center">
          <p className="text-lg font-medium">
            {formatDisplayDate(selectedDate)}
          </p>
          {isToday && (
            <p className="text-xs text-muted-foreground">Today</p>
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

      {isLoading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1fr_250px]">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="log-content">Journal Entry</Label>
              <Textarea
                id="log-content"
                value={content}
                onChange={(e) => {
                  setContent(e.target.value);
                  setIsDirty(true);
                }}
                placeholder="How was your day? What did you work on? What's on your mind?"
                rows={16}
                className="resize-y font-mono text-sm"
              />
            </div>
          </div>

          <div className="space-y-4">
            <Card className="p-4">
              <Label className="mb-3 block">Mood</Label>
              <div className="flex flex-wrap gap-2">
                {MOOD_OPTIONS.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => {
                      setMood(mood === m ? "" : m);
                      setIsDirty(true);
                    }}
                    className={`rounded-full px-3 py-1 text-sm border transition-colors ${
                      mood === m
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background border-border hover:bg-accent"
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
  );
}

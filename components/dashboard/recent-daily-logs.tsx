"use client";

import Link from "next/link";
import { BookOpen } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useRecentDailyLogs } from "@/lib/hooks/use-dashboard";

interface DailyLog {
  id: string;
  logDate: string;
  content: string | null;
  mood: string | null;
}

function formatLongDate(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

export function RecentDailyLogs() {
  const { data: logs } = useRecentDailyLogs();
  const recent = (logs ?? []).slice(0, 3) as DailyLog[];
  const latest = recent[0];

  return (
    <Card className="p-5">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-serif text-[18px] font-medium leading-none tracking-tight">
          Recent log
        </h2>
        <div className="flex items-center gap-3">
          <BookOpen className="h-4 w-4 text-muted-foreground" strokeWidth={1.75} />
          <Link
            href="/daily-log"
            className="text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            Open
          </Link>
        </div>
      </div>

      {recent.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No entries yet.{" "}
          <Link href="/daily-log" className="underline underline-offset-2">
            Write one
          </Link>
          .
        </p>
      ) : (
        <div className="space-y-4">
          {/* Hero: latest entry as an editorial blockquote */}
          {latest && (
            <Link href="/daily-log" className="block group">
              <p className="text-[10.5px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
                {formatLongDate(latest.logDate)}
              </p>
              {latest.content ? (
                <p className="mt-1 font-serif text-[16px] leading-[1.55] text-foreground line-clamp-3">
                  &ldquo;{latest.content}&rdquo;
                </p>
              ) : (
                <p className="mt-1 text-sm text-muted-foreground italic">
                  (no note)
                </p>
              )}
              {latest.mood && (
                <div className="mt-3 flex items-center gap-3">
                  <span className="text-[10.5px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
                    Mood
                  </span>
                  <span className="font-serif text-[15px]">{latest.mood}</span>
                </div>
              )}
            </Link>
          )}

          {/* Previous entries list */}
          {recent.length > 1 && (
            <div className="border-t border-border/60 pt-3">
              {recent.slice(1).map((log) => (
                <Link
                  key={log.id}
                  href="/daily-log"
                  className="flex items-baseline gap-3 rounded-md px-1 py-1.5 text-sm transition-colors hover:bg-accent/40"
                >
                  <span className="shrink-0 font-mono text-[11px] text-muted-foreground w-20">
                    {new Date(log.logDate + "T12:00:00").toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                  <span className="truncate text-muted-foreground">
                    {log.content || "(no note)"}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

"use client";

import Link from "next/link";
import { BookOpen } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useRecentDailyLogs } from "@/lib/hooks/use-dashboard";

interface DailyLog {
  id: string;
  logDate: string;
  content: string | null;
  mood: string | null;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + "T12:00:00");
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const days = Math.round((today.getTime() - target.getTime()) / 86400000);

  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function RecentDailyLogs() {
  const { data: logs } = useRecentDailyLogs();

  const recentLogs = (logs ?? []).slice(0, 3);

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-muted-foreground" />
          <h2 className="font-semibold">Recent Daily Logs</h2>
        </div>
        <Link
          href="/daily-log"
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          View all
        </Link>
      </div>
      {recentLogs.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No entries yet.{" "}
          <Link href="/daily-log" className="underline">
            Write one
          </Link>
          .
        </p>
      ) : (
        <div className="space-y-2">
          {recentLogs.map((log: DailyLog) => (
            <Link
              key={log.id}
              href="/daily-log"
              className="block rounded-md px-2 py-2 hover:bg-accent transition-colors"
            >
              <div className="flex items-center gap-2 mb-1">
                <p className="text-sm font-medium">
                  {formatDate(log.logDate)}
                </p>
                {log.mood && (
                  <Badge variant="secondary" className="text-xs">
                    {log.mood}
                  </Badge>
                )}
              </div>
              {log.content && (
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {log.content}
                </p>
              )}
            </Link>
          ))}
        </div>
      )}
    </Card>
  );
}

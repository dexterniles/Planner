"use client";

import { Clock, Timer, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTimeLogs, useDeleteTimeLog } from "@/lib/hooks/use-time-logs";
import { toast } from "sonner";

interface TimeLogHistoryProps {
  loggableType: string;
  loggableId: string;
}

interface TimeLog {
  id: string;
  startedAt: string;
  endedAt: string | null;
  durationSeconds: number | null;
  wasPomodoro: boolean;
  pomodoroIntervalMinutes: number | null;
  notes: string | null;
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

export function TimeLogHistory({
  loggableType,
  loggableId,
}: TimeLogHistoryProps) {
  const { data: logs, isLoading } = useTimeLogs(loggableType, loggableId);
  const deleteLog = useDeleteTimeLog();

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this time entry?")) return;
    try {
      await deleteLog.mutateAsync(id);
      toast.success("Entry deleted");
    } catch {
      toast.error("Failed to delete entry");
    }
  };

  if (isLoading) return <p className="text-muted-foreground">Loading...</p>;

  const completedLogs = (logs ?? []).filter((l: TimeLog) => l.endedAt);
  const totalSeconds = completedLogs.reduce(
    (sum: number, l: TimeLog) => sum + (l.durationSeconds ?? 0),
    0,
  );

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="font-serif text-[20px] font-medium leading-tight tracking-tight">Time Logged</h3>
          {completedLogs.length > 0 && (
            <p className="text-sm text-muted-foreground">
              Total: {formatDuration(totalSeconds)} across{" "}
              {completedLogs.length} session{completedLogs.length !== 1 ? "s" : ""}
            </p>
          )}
        </div>
      </div>

      {completedLogs.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No time logged yet. Use the Timer button above to start tracking.
        </p>
      ) : (
        <div className="space-y-2">
          {completedLogs.map((log: TimeLog) => (
            <div
              key={log.id}
              className="group flex items-center gap-3 rounded-lg border px-4 py-3"
            >
              {log.wasPomodoro ? (
                <Timer className="h-4 w-4 text-primary" />
              ) : (
                <Clock className="h-4 w-4 text-muted-foreground" />
              )}
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium font-mono tabular-nums">
                    {formatDuration(log.durationSeconds ?? 0)}
                  </span>
                  {log.wasPomodoro && (
                    <span className="text-xs text-primary">Pomodoro</span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>
                    {new Date(log.startedAt).toLocaleDateString()}{" "}
                    {new Date(log.startedAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                    {" — "}
                    {new Date(log.endedAt!).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                {log.notes && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {log.notes}
                  </p>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon-sm"
                className="text-destructive md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100 transition-opacity"
                onClick={() => handleDelete(log.id)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

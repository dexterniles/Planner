"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Play, Square, Timer, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  useActiveTimer,
  useStartTimer,
  useStopTimer,
} from "@/lib/hooks/use-time-logs";
import { formatDuration } from "@/lib/utils";
import { toast } from "sonner";

export const POMODORO_STORAGE_KEY = "planner:pomodoro-minutes";
export const POMODORO_DEFAULT_MINUTES = 25;
export const POMODORO_MIN_MINUTES = 1;
export const POMODORO_MAX_MINUTES = 120;

function readPomodoroMinutes(): number {
  if (typeof window === "undefined") return POMODORO_DEFAULT_MINUTES;
  const raw = window.localStorage.getItem(POMODORO_STORAGE_KEY);
  if (!raw) return POMODORO_DEFAULT_MINUTES;
  const n = parseInt(raw, 10);
  if (!Number.isFinite(n)) return POMODORO_DEFAULT_MINUTES;
  return Math.min(POMODORO_MAX_MINUTES, Math.max(POMODORO_MIN_MINUTES, n));
}

export function ActiveTimer() {
  const { data: activeLog } = useActiveTimer();
  const stopTimer = useStopTimer();
  const [elapsed, setElapsed] = useState(0);
  const [pomodoroRemaining, setPomodoroRemaining] = useState<number | null>(null);
  const firedRef = useRef(false);

  useEffect(() => {
    firedRef.current = false;

    if (!activeLog) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reset interval-driven mirror state when source clears
      setElapsed(0);
      setPomodoroRemaining(null);
      return;
    }

    let interval: ReturnType<typeof setInterval> | null = null;

    const update = () => {
      const started = new Date(activeLog.startedAt).getTime();
      const now = Date.now();
      const secs = Math.floor((now - started) / 1000);
      setElapsed(secs);

      if (activeLog.wasPomodoro && activeLog.pomodoroIntervalMinutes) {
        const target = activeLog.pomodoroIntervalMinutes * 60;
        const remaining = target - secs;
        setPomodoroRemaining(remaining);

        if (remaining <= 0 && interval) {
          clearInterval(interval);
          interval = null;
        }
      } else {
        setPomodoroRemaining(null);
      }
    };

    update();
    interval = setInterval(update, 1000);
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [activeLog]);

  const handleStop = useCallback(async () => {
    if (!activeLog) return;
    try {
      await stopTimer.mutateAsync({ id: activeLog.id });
      toast.success(`Timer stopped — ${formatDuration(elapsed)}`);
    } catch {
      toast.error("Failed to stop timer");
    }
  }, [activeLog, stopTimer, elapsed]);

  useEffect(() => {
    if (
      !firedRef.current &&
      pomodoroRemaining !== null &&
      pomodoroRemaining <= 0 &&
      activeLog
    ) {
      firedRef.current = true;
      toast.success("Pomodoro complete!", { duration: 5000 });
      stopTimer.mutate({ id: activeLog.id });
    }
  }, [pomodoroRemaining, activeLog, stopTimer]);

  if (!activeLog) return null;

  const isPomodoro = activeLog.wasPomodoro && activeLog.pomodoroIntervalMinutes;
  const displayTime = isPomodoro && pomodoroRemaining !== null && pomodoroRemaining > 0
    ? formatDuration(pomodoroRemaining)
    : formatDuration(elapsed);

  return (
    <div className="flex items-center gap-1">
      <div className="flex items-center gap-2 rounded-full border border-border bg-card py-1 pl-2.5 pr-3 shadow-sm">
        {isPomodoro ? (
          <Timer className="h-3 w-3 text-primary animate-pulse" strokeWidth={2} />
        ) : (
          <span
            className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary ring-[3px] ring-primary/20 animate-pulse"
            aria-hidden="true"
          />
        )}
        <span className="font-mono text-[12px] font-medium tabular-nums text-muted-foreground">
          {displayTime}
        </span>
      </div>
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={handleStop}
        title="Stop timer"
        className="text-destructive"
      >
        <Square className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}

interface TimerStartButtonProps {
  loggableType: "course" | "project" | "assignment" | "task";
  loggableId: string;
  label?: string;
  size?: "sm" | "default";
}

export function TimerStartButton({
  loggableType,
  loggableId,
  label,
  size = "sm",
}: TimerStartButtonProps) {
  const { data: activeLog } = useActiveTimer();
  const startTimer = useStartTimer();
  const stopTimer = useStopTimer();
  const [showOptions, setShowOptions] = useState(false);
  const [pomodoroMinutes, setPomodoroMinutes] = useState(
    POMODORO_DEFAULT_MINUTES,
  );

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- read localStorage after hydration
    setPomodoroMinutes(readPomodoroMinutes());
  }, []);

  const isRunningHere =
    activeLog &&
    activeLog.loggableType === loggableType &&
    activeLog.loggableId === loggableId;

  const handleStart = async (pomodoro: boolean) => {
    const minutes = pomodoro ? readPomodoroMinutes() : null;
    try {
      await startTimer.mutateAsync({
        loggableType,
        loggableId,
        wasPomodoro: pomodoro,
        pomodoroIntervalMinutes: minutes,
      });
      setShowOptions(false);
      toast.success(
        pomodoro ? `Pomodoro started (${minutes} min)` : "Timer started",
      );
    } catch {
      toast.error("Failed to start timer");
    }
  };

  const handleStop = async () => {
    if (!activeLog) return;
    try {
      await stopTimer.mutateAsync({ id: activeLog.id });
      toast.success("Timer stopped");
    } catch {
      toast.error("Failed to stop timer");
    }
  };

  if (isRunningHere) {
    return (
      <Button
        variant="destructive"
        size={size}
        onClick={handleStop}
      >
        <Square className="mr-1.5 h-3.5 w-3.5" />
        Stop
      </Button>
    );
  }

  return (
    <div className="relative">
      <Button
        variant="outline"
        size={size}
        onClick={() => setShowOptions(!showOptions)}
        disabled={startTimer.isPending}
      >
        <Play className="mr-1.5 h-3.5 w-3.5" />
        {label ?? "Timer"}
      </Button>
      {showOptions && (
        <Card className="absolute right-0 top-full z-50 mt-1 w-44 p-1.5 space-y-0.5">
          <button
            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-accent transition-colors"
            onClick={() => handleStart(false)}
          >
            <Clock className="h-3.5 w-3.5" />
            Stopwatch
          </button>
          <button
            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-accent transition-colors"
            onClick={() => handleStart(true)}
          >
            <Timer className="h-3.5 w-3.5" />
            Pomodoro ({pomodoroMinutes} min)
          </button>
        </Card>
      )}
    </div>
  );
}

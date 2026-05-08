"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { useUpcomingEvents } from "@/lib/hooks/use-events";
import { formatEventWhen } from "@/components/events/event-categories";
import type { EventStatus } from "@/lib/validations/event";
import { cn } from "@/lib/utils";

interface EventRow {
  id: string;
  title: string;
  startsAt: string;
  endsAt: string | null;
  allDay: boolean;
  location: string | null;
  status: EventStatus;
  color: string | null;
}

function compactDateLabel(iso: string, allDay: boolean): string {
  const d = new Date(iso);
  const weekday = d.toLocaleDateString("en-US", { weekday: "short" });
  if (allDay) return weekday;
  const time = d.toLocaleTimeString([], {
    hour: "numeric",
    minute: d.getMinutes() === 0 ? undefined : "2-digit",
  });
  return `${weekday} ${time}`;
}

export function UpcomingEvents() {
  const { data: events } = useUpcomingEvents(5);
  const rows = (events ?? []) as EventRow[];

  if (rows.length === 0) {
    return (
      <p className="text-[12.5px] text-muted-foreground">
        No plans on the horizon.
      </p>
    );
  }

  return (
    <div className="space-y-0">
      {rows.map((ev) => {
        const isTentative = ev.status === "tentative";
        return (
          <Link
            key={ev.id}
            href={`/events/${ev.id}`}
            className={cn(
              "flex items-start gap-2 rounded-md px-1 py-1.5 transition-colors hover:bg-muted/50",
              isTentative && "opacity-75",
            )}
          >
            <span className="mt-0.5 inline-block w-[58px] shrink-0 text-[11.5px] tabular-nums text-muted-foreground">
              {compactDateLabel(ev.startsAt, ev.allDay)}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <p className="truncate text-[13px] font-medium">{ev.title}</p>
                {isTentative && (
                  <Badge
                    variant="outline"
                    className="h-3.5 py-0 px-1 text-[9px] uppercase tracking-[0.08em]"
                  >
                    Tentative
                  </Badge>
                )}
              </div>
              {(ev.location || !ev.allDay) && (
                <p className="text-[11.5px] text-muted-foreground truncate">
                  {ev.allDay && !ev.endsAt
                    ? formatEventWhen(ev.startsAt).split(" ")[0]
                    : formatEventWhen(ev.startsAt)}
                  {ev.location ? ` · ${ev.location}` : ""}
                </p>
              )}
            </div>
          </Link>
        );
      })}
    </div>
  );
}

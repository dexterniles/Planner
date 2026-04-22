"use client";

import Link from "next/link";
import { PartyPopper } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useUpcomingEvents } from "@/lib/hooks/use-events";
import { formatEventWhen } from "@/components/events/event-categories";
import type { EventCategory, EventStatus } from "@/lib/validations/event";

interface EventRow {
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

export function UpcomingEvents() {
  const { data: events } = useUpcomingEvents(5);
  const rows = (events ?? []) as EventRow[];

  return (
    <Card className="p-5">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-baseline gap-2">
          <h2 className="font-serif text-[18px] font-medium leading-none tracking-tight">
            Coming up
          </h2>
          {rows.length > 0 && (
            <span className="font-mono text-[12px] text-muted-foreground">
              {rows.length}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <PartyPopper className="h-4 w-4 text-muted-foreground" strokeWidth={1.75} />
          <Link
            href="/events"
            className="text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            All events
          </Link>
        </div>
      </div>

      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No plans on the horizon. Add one when something comes up.
        </p>
      ) : (
        <div>
          {rows.map((ev, idx) => {
            const isTentative = ev.status === "tentative";
            const start = new Date(ev.startsAt);
            return (
              <Link
                key={ev.id}
                href={`/events/${ev.id}`}
                className={`flex items-center gap-3 rounded-md px-2 py-2 transition-colors hover:bg-accent/60 ${
                  idx > 0 ? "border-t border-border/60" : ""
                } ${isTentative ? "opacity-75" : ""}`}
              >
                <div className="w-11 shrink-0 text-center">
                  <div className="font-serif text-[20px] leading-none tabular-nums">
                    {start.getDate()}
                  </div>
                  <div className="mt-0.5 text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground">
                    {start.toLocaleDateString("en-US", { month: "short" })}
                  </div>
                </div>
                <span
                  className="h-7 w-px shrink-0 bg-border"
                  aria-hidden="true"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <p className="truncate text-sm font-medium">{ev.title}</p>
                    {isTentative && (
                      <Badge
                        variant="outline"
                        className="h-4 py-0 text-[9px] uppercase tracking-wide"
                      >
                        Tentative
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {ev.allDay && !ev.endsAt
                      ? formatEventWhen(ev.startsAt).split(" ")[0]
                      : formatEventWhen(ev.startsAt)}
                    {ev.location ? ` · ${ev.location}` : ""}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </Card>
  );
}

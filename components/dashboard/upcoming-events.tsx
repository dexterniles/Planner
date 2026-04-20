"use client";

import Link from "next/link";
import { MapPin, PartyPopper } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useUpcomingEvents } from "@/lib/hooks/use-events";
import {
  EVENT_CATEGORIES,
  formatEventWhen,
} from "@/components/events/event-categories";
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

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <PartyPopper className="h-4 w-4 text-muted-foreground" />
          <h2 className="font-semibold">Upcoming Events</h2>
        </div>
        <Link
          href="/events"
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          View all
        </Link>
      </div>

      {!events || events.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No plans on the horizon. Add one when something comes up.
        </p>
      ) : (
        <div className="space-y-1">
          {(events as EventRow[]).map((ev) => {
            const meta = EVENT_CATEGORIES[ev.category] ?? EVENT_CATEGORIES.other;
            const Icon = meta.icon;
            const isTentative = ev.status === "tentative";

            return (
              <Link
                key={ev.id}
                href={`/events/${ev.id}`}
                className={`flex items-center gap-3 rounded-md px-2 py-2 transition-colors hover:bg-accent ${
                  isTentative ? "opacity-75" : ""
                }`}
              >
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${meta.gradient}`}
                >
                  <Icon className={`h-3.5 w-3.5 ${meta.text}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-medium truncate">{ev.title}</p>
                    {isTentative && (
                      <Badge
                        variant="outline"
                        className="text-[9px] uppercase tracking-wide py-0 h-4"
                      >
                        Tentative
                      </Badge>
                    )}
                  </div>
                  {ev.location && (
                    <p className="flex items-center gap-1 text-xs text-muted-foreground truncate">
                      <MapPin className="h-3 w-3 shrink-0" />
                      {ev.location}
                    </p>
                  )}
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {ev.allDay && !ev.endsAt
                    ? formatEventWhen(ev.startsAt).split(" ")[0]
                    : formatEventWhen(ev.startsAt)}
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </Card>
  );
}

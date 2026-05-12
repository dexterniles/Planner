"use client";

import { use, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CalendarDays,
  ExternalLink,
  MapPin,
  Pencil,
  Repeat,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/layout/page-header";
import { SectionHeader } from "@/components/ui/section-header";
import { useEvent } from "@/lib/hooks/use-events";
import {
  STATUS_LABELS,
  formatEventTime,
  getEventCategoryMeta,
} from "@/components/events/event-categories";
import { EventDialog } from "@/components/events/event-dialog";
import { NotesList } from "@/components/notes-list";
import type { EventStatus } from "@/lib/validations/event";

const statusVariants: Record<
  EventStatus,
  "default" | "secondary" | "destructive" | "outline"
> = {
  confirmed: "default",
  tentative: "outline",
  cancelled: "destructive",
  completed: "secondary",
};

export default function EventDetailPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = use(params);
  const { data: event, isLoading } = useEvent(eventId);
  const [editOpen, setEditOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-2/3" />
        <Skeleton className="h-32 w-full rounded-md" />
      </div>
    );
  }

  if (!event) {
    return (
      <div>
        <p className="text-[13px] text-muted-foreground">Event not found.</p>
        <Link href="/events">
          <Button variant="outline" size="sm" className="mt-4">
            Back to Events
          </Button>
        </Link>
      </div>
    );
  }

  const meta = getEventCategoryMeta(event.categoryName, event.categoryColor);
  const Icon = meta.icon;
  const accent = event.color ?? event.categoryColor ?? meta.defaultColor;
  const status = (event.status ?? "confirmed") as EventStatus;

  const start = new Date(event.startsAt);
  const dayNumber = start.getDate();
  const monthLabel = start.toLocaleDateString("en-US", { month: "short" });

  return (
    <div>
      <Link
        href="/events"
        className="mb-3 inline-flex items-center gap-1.5 text-[11.5px] text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-3 w-3" strokeWidth={1.75} />
        Events
      </Link>

      <PageHeader
        title={event.title}
        subtitle={formatEventTime(event.startsAt, event.endsAt, event.allDay)}
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={() => setEditOpen(true)}
          >
            <Pencil className="mr-1.5 h-3 w-3" />
            Edit
          </Button>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div
          className="flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-md border-l-2 bg-muted/30 px-1 text-center"
          style={{ borderLeftColor: accent }}
          aria-hidden="true"
        >
          <span className="text-[14px] font-medium leading-none tabular-nums">
            {dayNumber}
          </span>
          <span className="mt-0.5 text-[9px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
            {monthLabel}
          </span>
        </div>
        {status !== "confirmed" && (
          <Badge
            variant={statusVariants[status] ?? "outline"}
            className="text-[10px] uppercase tracking-[0.08em]"
          >
            {STATUS_LABELS[status] ?? status}
          </Badge>
        )}
        {event.recurrenceRuleId && (
          <Badge
            variant="outline"
            className="gap-1 text-[10px] uppercase tracking-[0.08em]"
          >
            <Repeat className="h-3 w-3" strokeWidth={1.75} />
            Recurring
          </Badge>
        )}
        {event.categoryName && (
          <span className="flex items-center gap-1 text-[11.5px] text-muted-foreground">
            <Icon
              className="h-3 w-3"
              strokeWidth={1.75}
              style={{ color: accent }}
            />
            {event.categoryName}
          </span>
        )}
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11.5px] text-muted-foreground">
        <span className="flex items-center gap-1">
          <CalendarDays className="h-3 w-3" strokeWidth={1.75} />
          {formatEventTime(event.startsAt, event.endsAt, event.allDay)}
        </span>
        {event.location && (
          <span className="flex items-center gap-1">
            <MapPin className="h-3 w-3" strokeWidth={1.75} />
            {event.location}
          </span>
        )}
        {event.attendees && (
          <span className="flex items-center gap-1">
            <Users className="h-3 w-3" strokeWidth={1.75} />
            {event.attendees}
          </span>
        )}
        {event.url && (
          <a
            href={event.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 underline-offset-2 hover:text-foreground hover:underline"
          >
            <ExternalLink className="h-3 w-3" strokeWidth={1.75} />
            Open link
          </a>
        )}
      </div>

      {event.description && (
        <p className="mb-6 text-[13px] leading-relaxed text-foreground/90">
          {event.description}
        </p>
      )}

      <SectionHeader label="NOTES" />
      <NotesList parentType="event" parentId={eventId} />

      <EventDialog open={editOpen} onOpenChange={setEditOpen} event={event} />
    </div>
  );
}

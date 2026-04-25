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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
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
      <div className="space-y-6">
        <div className="flex items-start gap-4">
          <Skeleton className="h-8 w-8 rounded-lg" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-7 w-64" />
            <Skeleton className="h-4 w-96" />
          </div>
        </div>
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-9 w-40 rounded-lg" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!event) {
    return (
      <div>
        <p className="text-muted-foreground">Event not found.</p>
        <Link href="/events">
          <Button variant="outline" className="mt-4">
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
        className="mb-3 inline-flex items-center gap-1.5 text-[12.5px] text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.75} />
        Events
      </Link>

      <div className="mb-7 border-b border-border pb-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between md:gap-6">
          <div className="flex min-w-0 flex-1 items-start gap-4">
            <div
              className="flex shrink-0 flex-col items-center justify-center rounded-md border-l-2 bg-card px-3 py-1.5 text-center"
              style={{ borderLeftColor: accent }}
            >
              <div className="font-serif text-[28px] leading-none tabular-nums">
                {dayNumber}
              </div>
              <div className="mt-1 text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground">
                {monthLabel}
              </div>
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-3">
                <div
                  className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md"
                  style={{ backgroundColor: `${accent}20` }}
                >
                  <Icon className="h-3 w-3" style={{ color: accent }} />
                </div>
                <h1 className="font-serif text-[24px] md:text-[30px] font-medium leading-tight tracking-tight">
                  {event.title}
                </h1>
                <Badge variant={statusVariants[status] ?? "outline"} className="text-[10.5px]">
                  {STATUS_LABELS[status] ?? status}
                </Badge>
                {event.recurrenceRuleId && (
                  <Badge variant="outline" className="gap-1 text-[10.5px]">
                    <Repeat className="h-3 w-3" />
                    Recurring
                  </Badge>
                )}
              </div>

              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <CalendarDays className="h-3.5 w-3.5" strokeWidth={1.75} />
                  {formatEventTime(event.startsAt, event.endsAt, event.allDay)}
                </span>
                {event.location && (
                  <span className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5" strokeWidth={1.75} />
                    {event.location}
                  </span>
                )}
                {event.attendees && (
                  <span className="flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5" strokeWidth={1.75} />
                    {event.attendees}
                  </span>
                )}
                {event.url && (
                  <a
                    href={event.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 underline-offset-2 hover:text-foreground hover:underline"
                  >
                    <ExternalLink className="h-3.5 w-3.5" strokeWidth={1.75} />
                    Open link
                  </a>
                )}
              </div>

              {event.description && (
                <p className="mt-3 font-serif text-[15px] leading-relaxed text-foreground/90">
                  {event.description}
                </p>
              )}
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setEditOpen(true)}
            className="shrink-0 self-start"
          >
            <Pencil className="mr-1.5 h-3.5 w-3.5" />
            Edit
          </Button>
        </div>
      </div>

      <Tabs defaultValue="notes">
        <TabsList>
          <TabsTrigger value="notes">Notes</TabsTrigger>
        </TabsList>

        <TabsContent value="notes" className="mt-4">
          <NotesList parentType="event" parentId={eventId} />
        </TabsContent>
      </Tabs>

      <EventDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        event={event}
      />
    </div>
  );
}

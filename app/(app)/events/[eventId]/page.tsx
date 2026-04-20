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
  EVENT_CATEGORIES,
  STATUS_LABELS,
  formatEventTime,
} from "@/components/events/event-categories";
import { EventDialog } from "@/components/events/event-dialog";
import { NotesList } from "@/components/notes-list";
import type { EventCategory, EventStatus } from "@/lib/validations/event";

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

  const category = (event.category ?? "other") as EventCategory;
  const meta = EVENT_CATEGORIES[category] ?? EVENT_CATEGORIES.other;
  const Icon = meta.icon;
  const accent = event.color ?? meta.defaultColor;
  const status = (event.status ?? "confirmed") as EventStatus;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Link href="/events">
          <Button variant="ghost" size="icon" aria-label="Back to events">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 md:gap-3">
            <div
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${meta.gradient}`}
            >
              <Icon className={`h-4 w-4 ${meta.text}`} />
            </div>
            <h1 className="text-xl md:text-2xl font-bold">{event.title}</h1>
            <Badge variant={statusVariants[status] ?? "outline"}>
              {STATUS_LABELS[status] ?? status}
            </Badge>
            {event.recurrenceRuleId && (
              <Badge variant="outline" className="gap-1 text-xs">
                <Repeat className="h-3 w-3" />
                Recurring
              </Badge>
            )}
            <div
              className="h-3 w-3 rounded-full shrink-0"
              style={{ backgroundColor: accent }}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditOpen(true)}
              className="ml-auto"
            >
              <Pencil className="mr-1.5 h-3.5 w-3.5" />
              Edit
            </Button>
          </div>

          {/* Quick info strip */}
          <div className="mt-3 flex flex-wrap gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <CalendarDays className="h-3.5 w-3.5" />
              {formatEventTime(event.startsAt, event.endsAt, event.allDay)}
            </span>
            {event.location && (
              <span className="flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" />
                {event.location}
              </span>
            )}
            {event.attendees && (
              <span className="flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5" />
                {event.attendees}
              </span>
            )}
            {event.url && (
              <a
                href={event.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 hover:text-foreground transition-colors"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Open link
              </a>
            )}
          </div>

          {event.description && (
            <p className="mt-3 text-sm leading-relaxed text-foreground/90">
              {event.description}
            </p>
          )}
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

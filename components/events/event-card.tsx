"use client";

import {
  ExternalLink,
  MapPin,
  Pencil,
  Repeat,
  Trash2,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useDeleteEvent } from "@/lib/hooks/use-events";
import {
  EVENT_CATEGORIES,
  STATUS_LABELS,
  formatEventTime,
} from "./event-categories";
import type { EventCategory, EventStatus } from "@/lib/validations/event";
import { toast } from "sonner";

export interface EventCardData {
  id: string;
  title: string;
  description: string | null;
  category: EventCategory;
  startsAt: string;
  endsAt: string | null;
  allDay: boolean;
  location: string | null;
  url: string | null;
  attendees: string | null;
  status: EventStatus;
  color: string | null;
  recurrenceRuleId: string | null;
}

interface EventCardProps {
  event: EventCardData;
  onEdit: () => void;
}

const statusVariants: Record<
  EventStatus,
  "default" | "secondary" | "destructive" | "outline"
> = {
  confirmed: "default",
  tentative: "outline",
  cancelled: "destructive",
  completed: "secondary",
};

export function EventCard({ event, onEdit }: EventCardProps) {
  const deleteEvent = useDeleteEvent();
  const meta = EVENT_CATEGORIES[event.category] ?? EVENT_CATEGORIES.other;
  const Icon = meta.icon;

  const isTentative = event.status === "tentative";
  const isCancelled = event.status === "cancelled";
  const isCompleted = event.status === "completed";
  const accent = event.color ?? meta.defaultColor;

  const handleDelete = async () => {
    if (!confirm("Delete this event?")) return;
    try {
      await deleteEvent.mutateAsync(event.id);
      toast.success("Event deleted");
    } catch {
      toast.error("Failed to delete event");
    }
  };

  return (
    <div
      className={`group relative overflow-hidden rounded-xl border bg-card shadow-sm transition-all ${
        isTentative
          ? "border-dashed border-border/80 opacity-75"
          : "border-border/60"
      } ${isCancelled || isCompleted ? "opacity-60" : ""}`}
    >
      {/* Left accent bar */}
      <div
        className="absolute inset-y-0 left-0 w-1"
        style={{ backgroundColor: accent }}
      />

      <div className="flex items-start gap-3 p-4 pl-5">
        {/* Category icon */}
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${meta.gradient}`}
        >
          <Icon className={`h-4 w-4 ${meta.text}`} />
        </div>

        {/* Main content */}
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3
              className={`font-semibold leading-tight ${isCompleted ? "line-through" : ""}`}
            >
              {event.title}
            </h3>
            {event.recurrenceRuleId && (
              <Repeat className="h-3 w-3 text-primary shrink-0" />
            )}
            {isTentative && (
              <Badge variant="outline" className="text-[10px] uppercase tracking-wide">
                Tentative
              </Badge>
            )}
            {isCancelled && (
              <Badge variant="destructive" className="text-[10px] uppercase tracking-wide">
                Cancelled
              </Badge>
            )}
            {isCompleted && (
              <Badge variant="secondary" className="text-[10px] uppercase tracking-wide">
                Done
              </Badge>
            )}
          </div>

          <p className="text-sm text-muted-foreground">
            {formatEventTime(event.startsAt, event.endsAt, event.allDay)}
          </p>

          {(event.location || event.attendees || event.url) && (
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
              {event.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {event.location}
                </span>
              )}
              {event.attendees && (
                <span className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {event.attendees}
                </span>
              )}
              {event.url && (
                <a
                  href={event.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 hover:text-foreground transition-colors"
                  onClick={(e) => e.stopPropagation()}
                >
                  <ExternalLink className="h-3 w-3" />
                  Link
                </a>
              )}
            </div>
          )}

          {event.description && (
            <p className="text-xs text-muted-foreground/90 line-clamp-2 pt-1">
              {event.description}
            </p>
          )}
        </div>

        {/* Hover actions */}
        <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onEdit}
            aria-label={`Edit ${event.title}`}
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={handleDelete}
            disabled={deleteEvent.isPending}
            aria-label={`Delete ${event.title}`}
            className="text-destructive"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}

/**
 * Display-only helper for use in listings that don't need to map status to
 * a badge variant inline.
 */
export function eventStatusLabel(status: EventStatus): string {
  return STATUS_LABELS[status] ?? status;
}

export const eventStatusVariant = statusVariants;

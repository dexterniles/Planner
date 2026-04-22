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

  const start = new Date(event.startsAt);
  const dayNumber = start.getDate();
  const monthLabel = start.toLocaleDateString("en-US", { month: "short" });

  return (
    <div
      className={`group relative overflow-hidden rounded-xl border bg-card shadow-md transition-all hover:shadow-lg hover:-translate-y-px ${
        isTentative
          ? "border-dashed border-border/80 opacity-75"
          : "border-border/60"
      } ${isCancelled || isCompleted ? "opacity-60" : ""}`}
    >
      <div
        className="absolute inset-y-0 left-0 w-1"
        style={{ backgroundColor: accent }}
        aria-hidden="true"
      />

      <div className="flex items-start gap-4 p-5 pl-6">
        {/* Serif date block */}
        <div className="flex shrink-0 flex-col items-center justify-center border-r border-border/60 pr-4 text-center">
          <div className="font-serif text-[28px] leading-none tabular-nums">
            {dayNumber}
          </div>
          <div className="mt-1 text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground">
            {monthLabel}
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 min-w-0 space-y-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <div
              className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md"
              style={{ backgroundColor: `${accent}20` }}
            >
              <Icon className="h-3 w-3" style={{ color: accent }} />
            </div>
            <h3
              className={`font-serif text-[17px] font-medium leading-tight tracking-tight ${isCompleted ? "line-through" : ""}`}
            >
              {event.title}
            </h3>
            {event.recurrenceRuleId && (
              <Repeat className="h-3 w-3 text-primary shrink-0" />
            )}
            {isTentative && (
              <Badge variant="outline" className="text-[10px] uppercase tracking-[0.08em]">
                Tentative
              </Badge>
            )}
            {isCancelled && (
              <Badge variant="destructive" className="text-[10px] uppercase tracking-[0.08em]">
                Cancelled
              </Badge>
            )}
            {isCompleted && (
              <Badge variant="secondary" className="text-[10px] uppercase tracking-[0.08em]">
                Done
              </Badge>
            )}
          </div>

          <p className="text-[13px] text-muted-foreground">
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
        <div className="flex gap-1 shrink-0 md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100 transition-opacity">
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

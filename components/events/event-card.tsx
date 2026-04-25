"use client";

import {
  ExternalLink,
  MapPin,
  MoreHorizontal,
  Pencil,
  Repeat,
  Trash2,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useDeleteEvent } from "@/lib/hooks/use-events";
import { useConfirm } from "@/components/ui/confirm-dialog";
import {
  STATUS_LABELS,
  formatEventTime,
  getEventCategoryMeta,
} from "./event-categories";
import type { EventStatus } from "@/lib/validations/event";
import { toast } from "sonner";

export interface EventCardData {
  id: string;
  title: string;
  description: string | null;
  categoryId: string | null;
  categoryName: string | null;
  categoryColor: string | null;
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
  const confirm = useConfirm();
  const meta = getEventCategoryMeta(event.categoryName, event.categoryColor);
  const Icon = meta.icon;

  const isTentative = event.status === "tentative";
  const isCancelled = event.status === "cancelled";
  const isCompleted = event.status === "completed";
  const accent = event.color ?? event.categoryColor ?? meta.defaultColor;

  const handleDelete = async () => {
    if (
      !(await confirm({
        title: `Delete ${event.title}?`,
        description: "This event will be removed from your library.",
        destructive: true,
      }))
    ) {
      return;
    }
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
    <Card
      hover
      className={`group relative flex h-full flex-col overflow-hidden p-0 transition-opacity ${
        isTentative ? "border-dashed" : ""
      } ${isCancelled || isCompleted ? "opacity-60" : ""}`}
    >
      <a
        href={`/events/${event.id}`}
        className="relative block h-[88px] shrink-0"
        style={{ backgroundColor: accent }}
        aria-label={`Open ${event.title}`}
      >
        <div className="absolute left-4 top-3 leading-none text-white">
          <div className="font-serif text-[26px] font-medium tabular-nums drop-shadow-sm">
            {dayNumber}
          </div>
          <div className="mt-1 text-[10px] font-medium uppercase tracking-[0.12em] text-white/85">
            {monthLabel}
          </div>
        </div>

        <div className="absolute right-3 top-3 flex items-center gap-2">
          <Badge
            variant="outline"
            className="border-white/30 bg-white/15 text-[10px] uppercase tracking-[0.08em] text-white backdrop-blur-sm"
          >
            {STATUS_LABELS[event.status] ?? event.status}
          </Badge>
        </div>

        {event.categoryName && (
          <div className="absolute right-3 bottom-3 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2 py-1 text-[10.5px] font-medium uppercase tracking-[0.08em] text-white backdrop-blur-sm">
            <Icon className="h-3 w-3" strokeWidth={2} />
            {event.categoryName}
          </div>
        )}
      </a>

      <div className="flex flex-1 flex-col p-4">
        <a
          href={`/events/${event.id}`}
          className="block flex-1"
          aria-label={`Open ${event.title}`}
        >
          <div className="flex items-start gap-2">
            <h3
              className={`flex-1 font-serif text-[18px] font-medium leading-tight tracking-tight line-clamp-2 ${isCompleted ? "line-through" : ""}`}
            >
              {event.title}
            </h3>
            {event.recurrenceRuleId && (
              <Repeat
                className="mt-1 h-3 w-3 shrink-0 text-primary"
                strokeWidth={2}
              />
            )}
          </div>

          <p className="mt-1.5 text-[12.5px] text-muted-foreground">
            {formatEventTime(event.startsAt, event.endsAt, event.allDay)}
          </p>

          {(event.location || event.attendees) && (
            <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11.5px] text-muted-foreground">
              {event.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" strokeWidth={1.75} />
                  <span className="truncate max-w-[180px]">
                    {event.location}
                  </span>
                </span>
              )}
              {event.attendees && (
                <span className="flex items-center gap-1">
                  <Users className="h-3 w-3" strokeWidth={1.75} />
                  <span className="truncate max-w-[180px]">
                    {event.attendees}
                  </span>
                </span>
              )}
            </div>
          )}

          {event.description && (
            <p className="mt-2 text-[12px] text-muted-foreground/90 line-clamp-2">
              {event.description}
            </p>
          )}
        </a>

        <div className="mt-3 flex items-center justify-between">
          {event.url ? (
            <a
              href={event.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[11.5px] text-muted-foreground transition-colors hover:text-foreground"
              onClick={(e) => e.stopPropagation()}
            >
              <ExternalLink className="h-3 w-3" strokeWidth={1.75} />
              Link
            </a>
          ) : (
            <span />
          )}
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Actions for ${event.title}`}
                />
              }
            >
              <MoreHorizontal className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onEdit}>
                <Pencil className="mr-1.5 h-3.5 w-3.5" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                variant="destructive"
                onClick={handleDelete}
                disabled={deleteEvent.isPending}
              >
                <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </Card>
  );
}

export function eventStatusLabel(status: EventStatus): string {
  return STATUS_LABELS[status] ?? status;
}

export const eventStatusVariant = statusVariants;

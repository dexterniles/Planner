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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
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
    <div
      className={cn(
        "group relative flex h-full flex-col rounded-md border border-border/60 p-4 transition-colors hover:border-foreground/30",
        isTentative && "border-dashed",
        (isCancelled || isCompleted) && "opacity-60",
      )}
    >
      <a
        href={`/events/${event.id}`}
        className="block flex-1"
        aria-label={`Open ${event.title}`}
      >
        <div className="flex items-start gap-3">
          {/* Date tile */}
          <div
            className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-md border-l-2 bg-muted/30 px-1 text-center"
            style={{ borderLeftColor: accent }}
            aria-hidden="true"
          >
            <div className="text-[15px] font-medium leading-none tabular-nums">
              {dayNumber}
            </div>
            <div className="mt-0.5 text-[9px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
              {monthLabel}
            </div>
          </div>

          {/* Title + recurrence */}
          <div className="min-w-0 flex-1">
            <div className="flex items-start gap-2">
              <h3
                className={cn(
                  "flex-1 text-[13px] font-medium leading-tight tracking-tight line-clamp-2",
                  isCompleted && "line-through",
                )}
              >
                {event.title}
              </h3>
              {event.recurrenceRuleId && (
                <Repeat
                  className="mt-0.5 h-3 w-3 shrink-0 text-muted-foreground"
                  strokeWidth={1.75}
                />
              )}
            </div>
            <p className="mt-1 text-[11.5px] text-muted-foreground tabular-nums">
              {formatEventTime(event.startsAt, event.endsAt, event.allDay)}
            </p>
          </div>
        </div>

        {/* Metadata row */}
        {(event.status !== "confirmed" ||
          event.categoryName ||
          event.location ||
          event.attendees) && (
          <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11.5px] text-muted-foreground">
            {event.status !== "confirmed" && (
              <Badge
                variant={statusVariants[event.status] ?? "outline"}
                className="text-[10px] uppercase tracking-[0.08em]"
              >
                {STATUS_LABELS[event.status] ?? event.status}
              </Badge>
            )}
            {event.categoryName && (
              <span className="flex items-center gap-1">
                <Icon
                  className="h-3 w-3"
                  strokeWidth={1.75}
                  style={{ color: accent }}
                />
                {event.categoryName}
              </span>
            )}
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
  );
}

export function eventStatusLabel(status: EventStatus): string {
  return STATUS_LABELS[status] ?? status;
}

export const eventStatusVariant = statusVariants;

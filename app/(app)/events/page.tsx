"use client";

import { useMemo, useState } from "react";
import { PartyPopper, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useEvents } from "@/lib/hooks/use-events";
import { EventCard, type EventCardData } from "@/components/events/event-card";
import { EventDialog } from "@/components/events/event-dialog";
import {
  EVENT_CATEGORY_LIST,
  EVENT_CATEGORIES,
} from "@/components/events/event-categories";
import type { EventCategory } from "@/lib/validations/event";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/layout/page-header";

type TimeFilter = "upcoming" | "past" | "all";

export default function EventsPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<EventCardData | null>(null);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("upcoming");
  const [categoryFilter, setCategoryFilter] = useState<EventCategory | null>(
    null,
  );

  const { data: events, isLoading } = useEvents({
    ...(categoryFilter && { category: categoryFilter }),
    limit: 500,
  });

  const now = useMemo(() => new Date(), []);

  const filtered = useMemo(() => {
    if (!events) return [];
    const list = events as EventCardData[];
    if (timeFilter === "all") return list;
    if (timeFilter === "upcoming") {
      return list.filter((e) => {
        if (e.status === "cancelled") return false;
        const start = new Date(e.startsAt);
        const end = e.endsAt ? new Date(e.endsAt) : null;
        return start >= now || (end !== null && end >= now);
      });
    }
    // past
    return list
      .filter((e) => {
        const start = new Date(e.startsAt);
        const end = e.endsAt ? new Date(e.endsAt) : null;
        return !(start >= now || (end !== null && end >= now));
      })
      .reverse();
  }, [events, timeFilter, now]);

  const openCreate = () => {
    setEditing(null);
    setDialogOpen(true);
  };

  const openEdit = (event: EventCardData) => {
    setEditing(event);
    setDialogOpen(true);
  };

  return (
    <div>
      <PageHeader
        title="Events"
        actions={
          <Button onClick={openCreate}>
            <Plus className="mr-1.5 h-4 w-4" />
            New Event
          </Button>
        }
      />

      <div className="space-y-5">
      {/* Filters */}
      <div className="space-y-3">
        {/* Time filter segmented control */}
        <div className="inline-flex rounded-md border border-border bg-card p-[3px] shadow-sm gap-[2px]">
          {(["upcoming", "past", "all"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTimeFilter(t)}
              className={cn(
                "px-3 py-1 text-[12.5px] font-medium capitalize rounded-[5px] transition-colors duration-150",
                timeFilter === t
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Category filter strip */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setCategoryFilter(null)}
            className={cn(
              "px-3 py-1 text-xs font-medium rounded-full border transition-all",
              categoryFilter === null
                ? "bg-primary text-primary-foreground border-primary shadow-sm"
                : "bg-muted/50 text-muted-foreground border-border/60 hover:bg-muted hover:text-foreground",
            )}
          >
            All
          </button>
          {EVENT_CATEGORY_LIST.map((cat) => {
            const active = categoryFilter === cat.value;
            const Icon = cat.icon;
            return (
              <button
                key={cat.value}
                onClick={() =>
                  setCategoryFilter(active ? null : cat.value)
                }
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-full border transition-all",
                  active
                    ? "bg-primary text-primary-foreground border-primary shadow-sm"
                    : "bg-muted/50 text-muted-foreground border-border/60 hover:bg-muted hover:text-foreground",
                )}
              >
                <Icon className="h-3 w-3" />
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-[96px] w-full" />
          <Skeleton className="h-[96px] w-full" />
          <Skeleton className="h-[96px] w-full" />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          timeFilter={timeFilter}
          hasEvents={(events?.length ?? 0) > 0}
          onCreate={openCreate}
        />
      ) : (
        <div className="grid gap-3">
          {filtered.map((event) => (
            <EventCard key={event.id} event={event} onEdit={() => openEdit(event)} />
          ))}
        </div>
      )}

      <EventDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        event={editing ?? undefined}
      />
      </div>
    </div>
  );
}

function EmptyState({
  timeFilter,
  hasEvents,
  onCreate,
}: {
  timeFilter: TimeFilter;
  hasEvents: boolean;
  onCreate: () => void;
}) {
  // Case 1: no events at all in the DB
  if (!hasEvents) {
    return (
      <div className="mt-12 flex flex-col items-center text-center">
        <div
          className={`mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${EVENT_CATEGORIES.social.gradient}`}
        >
          <PartyPopper className={`h-6 w-6 ${EVENT_CATEGORIES.social.text}`} />
        </div>
        <h3 className="text-base font-medium">Keep your plans in one place</h3>
        <p className="mt-1 text-sm text-muted-foreground max-w-sm">
          Dinners, concerts, vacations, hangouts — track the life stuff
          alongside your work.
        </p>
        <Button className="mt-5" onClick={onCreate}>
          <Plus className="mr-1.5 h-4 w-4" />
          Add your first event
        </Button>
      </div>
    );
  }

  // Case 2: has events but filters hide them all
  const messages: Record<TimeFilter, string> = {
    upcoming: "Nothing upcoming. Enjoy the quiet.",
    past: "No past events in this view yet.",
    all: "No events match these filters.",
  };

  return (
    <div className="flex flex-col items-center py-12 text-center">
      <p className="text-sm text-muted-foreground">{messages[timeFilter]}</p>
    </div>
  );
}

"use client";

import { useMemo, useState } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { PartyPopper, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useEvents } from "@/lib/hooks/use-events";
import { useEventCategories } from "@/lib/hooks/use-event-categories";
import { EventCard, type EventCardData } from "@/components/events/event-card";
import { EventDialog } from "@/components/events/event-dialog";
import { getEventCategoryMeta } from "@/components/events/event-categories";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/layout/page-header";
import { useCurrentDate } from "@/lib/hooks/use-current-date";

type TimeFilter = "upcoming" | "past" | "all";
const TIME_VALUES: TimeFilter[] = ["upcoming", "past", "all"];

interface CategoryRow {
  id: string;
  name: string;
  color: string | null;
}

export function EventsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<EventCardData | null>(null);

  const rawTime = searchParams.get("time");
  const timeFilter: TimeFilter = TIME_VALUES.includes(rawTime as TimeFilter)
    ? (rawTime as TimeFilter)
    : "upcoming";
  const categoryFilter = searchParams.get("category");

  const setParam = (key: string, value: string, defaultValue: string) => {
    const params = new URLSearchParams(searchParams);
    if (!value || value === defaultValue) params.delete(key);
    else params.set(key, value);
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  const { data: events, isLoading } = useEvents({
    ...(categoryFilter && { categoryId: categoryFilter }),
    limit: 500,
  });
  const { data: categories } = useEventCategories();

  const now = useCurrentDate();

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

  const cats = (categories ?? []) as CategoryRow[];

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
            {TIME_VALUES.map((t) => (
              <button
                key={t}
                onClick={() => setParam("time", t, "upcoming")}
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
              onClick={() => setParam("category", "", "")}
              className={cn(
                "px-3 py-1 text-xs font-medium rounded-full border transition-all",
                categoryFilter === null
                  ? "bg-primary text-primary-foreground border-primary shadow-sm"
                  : "bg-muted/50 text-muted-foreground border-border/60 hover:bg-muted hover:text-foreground",
              )}
            >
              All
            </button>
            {cats.map((cat) => {
              const active = categoryFilter === cat.id;
              const meta = getEventCategoryMeta(cat.name, cat.color);
              const Icon = meta.icon;
              return (
                <button
                  key={cat.id}
                  onClick={() => setParam("category", active ? "" : cat.id, "")}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-full border transition-all",
                    active
                      ? "bg-primary text-primary-foreground border-primary shadow-sm"
                      : "bg-muted/50 text-muted-foreground border-border/60 hover:bg-muted hover:text-foreground",
                  )}
                >
                  <Icon className="h-3 w-3" />
                  {cat.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* List */}
        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            <Skeleton className="h-[240px] w-full rounded-xl" />
            <Skeleton className="h-[240px] w-full rounded-xl" />
            <Skeleton className="h-[240px] w-full rounded-xl" />
            <Skeleton className="h-[240px] w-full rounded-xl" />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            timeFilter={timeFilter}
            hasEvents={(events?.length ?? 0) > 0}
            onCreate={openCreate}
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
  if (!hasEvents) {
    return (
      <div className="mt-12 flex flex-col items-center text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
          <PartyPopper className="h-6 w-6 text-primary" strokeWidth={1.75} />
        </div>
        <h3 className="font-serif text-[20px] font-medium leading-tight tracking-tight">Keep your plans in one place</h3>
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

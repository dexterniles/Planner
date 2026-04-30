"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Plus,
  X,
  Check,
  Bell,
  CalendarDays,
  ListChecks,
  CalendarClock,
  ArrowRight,
} from "lucide-react";
import { parseDate } from "@/lib/parse-date";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  useInbox,
  useCreateInboxItem,
  useDeleteInboxItem,
  useTriageInboxItem,
} from "@/lib/hooks/use-inbox";
import { useCreateNote, useDeleteNote } from "@/lib/hooks/use-notes";
import { useProjects } from "@/lib/hooks/use-projects";
import { useWorkspaces } from "@/lib/hooks/use-workspaces";
import { useAllItems } from "@/lib/hooks/use-all-items";
import { useCurrentDate } from "@/lib/hooks/use-current-date";
import { StatsRow } from "@/components/dashboard/stats-row";
import { TodaysFocus } from "@/components/dashboard/todays-focus";
import { UpcomingMilestones } from "@/components/dashboard/upcoming-milestones";
import { UpcomingEvents } from "@/components/dashboard/upcoming-events";
import { BillsThisPeriod } from "@/components/dashboard/bills-this-period";
import { GradeSnapshot } from "@/components/dashboard/grade-snapshot";
import { PageHeader } from "@/components/layout/page-header";
import { useSearchPalette } from "@/components/layout/search-palette-context";
import { TaskDialog } from "@/components/projects/task-dialog";
import { EventDialog } from "@/components/events/event-dialog";
import { getItemLink } from "@/lib/utils";
import { toast } from "sonner";

interface InboxItem {
  id: string;
  content: string;
  capturedAt: string;
  triagedAt: string | null;
}

interface AllItem {
  id: string;
  type: string;
  title: string;
  status: string;
  dueDate: string | null;
  parentId: string;
  parentName: string;
  parentColor: string | null;
}

interface ConvertTarget {
  type: "event" | "task";
  inboxId: string | null;
  prefillTitle: string;
  prefillDate: string | null;
}

function formatInboxTimestamp(iso: string, now: Date): string {
  const d = new Date(iso);
  const time = d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

  const startOfDay = (date: Date) => {
    const x = new Date(date);
    x.setHours(0, 0, 0, 0);
    return x;
  };
  const dayDiff = Math.floor(
    (startOfDay(now).getTime() - startOfDay(d).getTime()) / 86_400_000,
  );

  if (dayDiff <= 0) return time;
  if (dayDiff === 1) return `Yesterday ${time}`;
  if (dayDiff <= 6) {
    const weekday = d.toLocaleDateString([], { weekday: "short" });
    return `${weekday} ${time}`;
  }
  if (d.getFullYear() === now.getFullYear()) {
    const md = d.toLocaleDateString([], { month: "short", day: "numeric" });
    return `${md} ${time}`;
  }
  return d.toLocaleDateString([], {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function DashboardPage() {
  const [newCapture, setNewCapture] = useState("");
  const parsedCaptureDate = useMemo(
    () => parseDate(newCapture),
    [newCapture],
  );
  const { data: inboxItems } = useInbox();
  const createInboxItem = useCreateInboxItem();
  const deleteInboxItem = useDeleteInboxItem();
  const triageInboxItem = useTriageInboxItem();
  const createNote = useCreateNote();
  const deleteNote = useDeleteNote();
  const { data: workspaces } = useWorkspaces();
  const projectsWorkspace = workspaces?.find(
    (w: { type: string }) => w.type === "projects",
  );
  const { data: projects } = useProjects(projectsWorkspace?.id);
  const projectsCount = projects?.length ?? 0;
  const canConvertToTask = projectsCount > 0;
  const { data: allItems } = useAllItems();
  const { pendingQuickCreate, consumeQuickCreate } = useSearchPalette();

  const [convertTarget, setConvertTarget] = useState<ConvertTarget | null>(
    null,
  );

  // React to search-palette quick-create requests
  useEffect(() => {
    if (!pendingQuickCreate) return;
    const { type, title } = pendingQuickCreate;
    consumeQuickCreate();
    if (type === "task" || type === "event") {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- triggered by external context request
      setConvertTarget({
        type,
        inboxId: null,
        prefillTitle: title,
        prefillDate: null,
      });
    } else if (type === "note") {
      (async () => {
        try {
          await createNote.mutateAsync({
            parentType: "standalone",
            parentId: null,
            content: title,
          });
          toast.success("Note created");
        } catch {
          toast.error("Failed to create note");
        }
      })();
    }
  }, [pendingQuickCreate, consumeQuickCreate, createNote]);

  const untriagedItems = useMemo(
    () =>
      ((inboxItems ?? []) as InboxItem[]).filter((item) => !item.triagedAt),
    [inboxItems],
  );

  const parsedInbox = useMemo(
    () =>
      untriagedItems.map((item) => ({
        item,
        parsed: parseDate(item.content),
      })),
    [untriagedItems],
  );

  const now = useCurrentDate();
  const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const upcomingItems = (allItems ?? [])
    .filter((item: AllItem) => {
      if (!item.dueDate) return false;
      if (["done", "cancelled", "graded", "submitted"].includes(item.status)) return false;
      const due = new Date(item.dueDate);
      return due >= now && due <= weekFromNow;
    })
    .slice(0, 10);

  const overdueItems = (allItems ?? [])
    .filter((item: AllItem) => {
      if (!item.dueDate) return false;
      if (["done", "cancelled", "graded", "submitted"].includes(item.status)) return false;
      return new Date(item.dueDate) < now;
    })
    .slice(0, 5);

  const handleCapture = async () => {
    if (!newCapture.trim()) return;
    try {
      await createInboxItem.mutateAsync({ content: newCapture.trim() });
      setNewCapture("");
      toast.success("Captured!");
    } catch {
      toast.error("Failed to capture");
    }
  };

  const startConvert = (
    type: "event" | "task" | "note",
    item: InboxItem,
  ) => {
    const parsedItemDate = parseDate(item.content);
    const prefillDate = parsedItemDate
      ? parsedItemDate.date.toISOString()
      : null;
    const prefillTitle = parsedItemDate?.remainingText?.trim()
      ? parsedItemDate.remainingText.trim()
      : item.content;
    if (type === "note") {
      (async () => {
        let createdNoteId: string | null = null;
        try {
          const created = (await createNote.mutateAsync({
            parentType: "standalone",
            parentId: null,
            content: item.content,
          })) as { id: string };
          createdNoteId = created.id;
          try {
            await triageInboxItem.mutateAsync({
              id: item.id,
              resultingItemType: "note",
              resultingItemId: created.id,
            });
          } catch {
            // best-effort rollback of the just-created note
            try {
              await deleteNote.mutateAsync(createdNoteId);
            } catch {
              /* swallow — already surfacing one error toast */
            }
            toast.error("Failed to convert. Inbox not updated.");
            return;
          }
          toast.success("Converted to note");
        } catch {
          toast.error("Failed to convert");
        }
      })();
      return;
    }
    setConvertTarget({
      type,
      inboxId: item.id,
      prefillTitle,
      prefillDate,
    });
  };

  const handleConvertedEntity = async (
    entityType: "task" | "event",
    entityId: string,
  ) => {
    const inboxId = convertTarget?.inboxId;
    if (inboxId) {
      try {
        await triageInboxItem.mutateAsync({
          id: inboxId,
          resultingItemType: entityType,
          resultingItemId: entityId,
        });
      } catch {
        toast.error("Failed to mark inbox item triaged");
      }
    }
    setConvertTarget(null);
  };

  const taskDefaultDueDate = (() => {
    if (!convertTarget || convertTarget.type !== "task") return undefined;
    return convertTarget.prefillDate ?? undefined;
  })();

  const eventDefaultStart = (() => {
    if (!convertTarget || convertTarget.type !== "event") return undefined;
    if (convertTarget.prefillDate) return convertTarget.prefillDate;
    const inOneHour = new Date(now.getTime() + 60 * 60 * 1000);
    return inOneHour.toISOString();
  })();

  return (
    <div>
      <PageHeader title="Dashboard" />

      <div className="space-y-6">
      {/* Stats Row */}
      <StatsRow />

      {/* Overdue (full-width alert when items exist) */}
      {overdueItems.length > 0 && (
        <Card className="p-5 border-destructive/40 bg-destructive/5">
          <div className="mb-3 flex items-center gap-2">
            <ListChecks className="h-4 w-4 text-destructive" />
            <p className="text-[10.5px] font-medium uppercase tracking-[0.12em] text-destructive">
              Overdue · {overdueItems.length}
            </p>
          </div>
          <div className="space-y-1">
            {overdueItems.map((item: AllItem) => (
              <Link
                key={`${item.type}-${item.id}`}
                href={getItemLink(item)}
                className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent/60 transition-colors"
              >
                <div
                  className="h-2 w-2 rounded-full shrink-0"
                  style={{ backgroundColor: item.parentColor ?? "#888" }}
                />
                <span className="flex-1 font-medium truncate">{item.title}</span>
                <span className="hidden md:inline text-xs text-muted-foreground">
                  {item.parentName}
                </span>
                <span className="text-xs text-destructive whitespace-nowrap">
                  {new Date(item.dueDate!).toLocaleDateString()}
                </span>
              </Link>
            ))}
          </div>
        </Card>
      )}

      {/* Today's Focus + Quick Capture */}
      <div className="grid gap-6 lg:grid-cols-2">
        <TodaysFocus />

        <Card className="p-5">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-baseline gap-2">
              <h2 className="font-serif text-[18px] font-medium leading-none tracking-tight">
                Reminders
              </h2>
              {untriagedItems.length > 0 && (
                <span className="font-mono text-[12px] text-muted-foreground">
                  {untriagedItems.length}
                </span>
              )}
            </div>
            <Bell className="h-4 w-4 text-muted-foreground" strokeWidth={1.75} />
          </div>
          <div className="flex gap-2">
            <Input
              value={newCapture}
              onChange={(e) => setNewCapture(e.target.value)}
              placeholder="Capture anything…"
              onKeyDown={(e) => e.key === "Enter" && handleCapture()}
            />
            <Button
              onClick={handleCapture}
              disabled={!newCapture.trim() || createInboxItem.isPending}
              size="icon"
              variant="outline"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {parsedCaptureDate && (
            <div className="mt-2 flex items-center gap-1.5 text-xs text-primary">
              <CalendarClock className="h-3 w-3" />
              <span>Detected: {parsedCaptureDate.preview}</span>
            </div>
          )}

          {parsedInbox.length > 0 && (
            <div className="mt-3 space-y-1">
              {parsedInbox.map(({ item, parsed: itemDate }) => (
                <div
                  key={item.id}
                  className="group flex items-center gap-2 rounded-md border px-3 py-2 text-sm"
                >
                  <span className="flex-1">{item.content}</span>
                  {itemDate && (
                    <span className="flex items-center gap-1 text-xs text-primary whitespace-nowrap">
                      <CalendarClock className="h-3 w-3" />
                      {itemDate.preview}
                    </span>
                  )}
                  <span className="text-xs text-muted-foreground">
                    {formatInboxTimestamp(item.capturedAt, now)}
                  </span>
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      render={
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          aria-label={`Convert "${item.content}"`}
                          title="Convert"
                        />
                      }
                    >
                      <ArrowRight className="h-3 w-3" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => startConvert("event", item)}
                      >
                        Convert to Event
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => startConvert("task", item)}
                        disabled={!canConvertToTask}
                        title={
                          canConvertToTask
                            ? undefined
                            : "Create a project first to convert tasks."
                        }
                      >
                        Convert to Task
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => startConvert("note", item)}
                      >
                        Convert to Note
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    title="Mark as triaged"
                    onClick={() => triageInboxItem.mutate({ id: item.id })}
                  >
                    <Check className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    className="text-destructive"
                    title="Dismiss"
                    onClick={() => deleteInboxItem.mutate(item.id)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Upcoming (7 days) + Upcoming Events */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-5">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-baseline gap-2">
              <h2 className="font-serif text-[18px] font-medium leading-none tracking-tight">
                This week
              </h2>
              {upcomingItems.length > 0 && (
                <span className="font-mono text-[12px] text-muted-foreground">
                  {upcomingItems.length}
                </span>
              )}
            </div>
            <CalendarDays className="h-4 w-4 text-muted-foreground" strokeWidth={1.75} />
          </div>
          {upcomingItems.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nothing due in the next 7 days.
            </p>
          ) : (
            <div>
              {upcomingItems.map((item: AllItem, idx: number) => {
                const due = new Date(item.dueDate!);
                const dayLbl = due.toLocaleDateString("en-US", { weekday: "short" });
                return (
                  <Link
                    key={`${item.type}-${item.id}`}
                    href={getItemLink(item)}
                    className={`flex items-center gap-3 rounded-md px-2 py-2 text-sm hover:bg-accent/60 transition-colors ${idx > 0 ? "border-t border-border/60" : ""}`}
                  >
                    <div className="w-9 shrink-0 text-right">
                      <div className="font-serif text-[18px] leading-none tabular-nums">
                        {due.getDate()}
                      </div>
                      <div className="mt-0.5 text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground">
                        {dayLbl}
                      </div>
                    </div>
                    <span
                      className="h-6 w-px shrink-0 bg-border"
                      aria-hidden="true"
                    />
                    <span className="flex-1 font-medium truncate">{item.title}</span>
                    <span className="hidden md:inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-border bg-card px-2 py-0.5 text-[11.5px] text-muted-foreground">
                      <span
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ backgroundColor: item.parentColor ?? "#888" }}
                      />
                      {item.parentName}
                    </span>
                  </Link>
                );
              })}
            </div>
          )}
        </Card>

        <UpcomingEvents />
      </div>

      {/* Bills + Milestones */}
      <div className="grid gap-6 lg:grid-cols-2">
        <BillsThisPeriod />
        <UpcomingMilestones />
      </div>

      {/* Grade Snapshot */}
      <GradeSnapshot />
      </div>

      {convertTarget?.type === "task" && (
        <TaskDialog
          open
          onOpenChange={(o) => {
            if (!o) setConvertTarget(null);
          }}
          showProjectSelect
          prefill={{
            title: convertTarget.prefillTitle,
            dueDate: taskDefaultDueDate,
          }}
          onCreated={(created) => handleConvertedEntity("task", created.id)}
        />
      )}

      {convertTarget?.type === "event" && (
        <EventDialog
          open
          onOpenChange={(o) => {
            if (!o) setConvertTarget(null);
          }}
          prefill={{
            title: convertTarget.prefillTitle,
            startsAt: eventDefaultStart,
          }}
          onCreated={(created) => handleConvertedEntity("event", created.id)}
        />
      )}
    </div>
  );
}

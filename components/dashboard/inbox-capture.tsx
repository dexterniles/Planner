"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowRight, CalendarClock, Check, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  useCreateInboxItem,
  useDeleteInboxItem,
  useInbox,
  useTriageInboxItem,
} from "@/lib/hooks/use-inbox";
import { useCreateNote, useDeleteNote } from "@/lib/hooks/use-notes";
import { useProjects } from "@/lib/hooks/use-projects";
import { useWorkspaces } from "@/lib/hooks/use-workspaces";
import { useCurrentDate } from "@/lib/hooks/use-current-date";
import { useSearchPalette } from "@/components/layout/search-palette-context";
import { TaskDialog } from "@/components/projects/task-dialog";
import { EventDialog } from "@/components/events/event-dialog";
import { parseDate } from "@/lib/parse-date";

interface InboxItem {
  id: string;
  content: string;
  capturedAt: string;
  triagedAt: string | null;
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
  if (dayDiff === 1) return `Yesterday`;
  if (dayDiff <= 6) return d.toLocaleDateString([], { weekday: "short" });
  if (d.getFullYear() === now.getFullYear()) {
    return d.toLocaleDateString([], { month: "short", day: "numeric" });
  }
  return d.toLocaleDateString([], {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function InboxCapture() {
  const [text, setText] = useState("");
  const parsedCaptureDate = useMemo(() => parseDate(text), [text]);

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
  const canConvertToTask = (projects?.length ?? 0) > 0;

  const { pendingQuickCreate, consumeQuickCreate } = useSearchPalette();

  const [convertTarget, setConvertTarget] = useState<ConvertTarget | null>(null);

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

  const untriaged = useMemo(
    () =>
      ((inboxItems ?? []) as InboxItem[]).filter((item) => !item.triagedAt),
    [inboxItems],
  );

  const recent = useMemo(() => untriaged.slice(0, 3), [untriaged]);

  const now = useCurrentDate();

  const handleCapture = async () => {
    if (!text.trim()) return;
    try {
      await createInboxItem.mutateAsync({ content: text.trim() });
      setText("");
      toast.success("Captured");
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
            try {
              await deleteNote.mutateAsync(createdNoteId);
            } catch {
              /* swallow */
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
    <div className="space-y-2">
      <div className="space-y-2">
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              handleCapture();
            }
          }}
          placeholder="Capture anything…"
          rows={2}
          className="resize-none text-[13px]"
        />
        {parsedCaptureDate && (
          <div className="flex items-center gap-1.5 text-[11.5px] text-primary">
            <CalendarClock className="h-3 w-3" />
            <span>Detected: {parsedCaptureDate.preview}</span>
          </div>
        )}
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-muted-foreground">⌘↵ to save</span>
          <Button
            onClick={handleCapture}
            disabled={!text.trim() || createInboxItem.isPending}
            size="xs"
            variant="outline"
          >
            <Plus className="h-3 w-3" />
            Capture
          </Button>
        </div>
      </div>

      {recent.length > 0 && (
        <div className="space-y-0 pt-1">
          {recent.map((item) => {
            const itemDate = parseDate(item.content);
            return (
              <div
                key={item.id}
                className="group flex items-start gap-1.5 rounded-md px-1 py-1.5 text-[12.5px] transition-colors hover:bg-muted/50"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate">{item.content}</p>
                  <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                    <span>{formatInboxTimestamp(item.capturedAt, now)}</span>
                    {itemDate && (
                      <span className="flex items-center gap-1 text-primary">
                        <CalendarClock className="h-2.5 w-2.5" />
                        {itemDate.preview}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex shrink-0 items-center opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
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
              </div>
            );
          })}
        </div>
      )}

      {untriaged.length > recent.length && (
        <div className="pt-1 text-[11px] text-muted-foreground tabular-nums">
          {untriaged.length} in inbox · showing {recent.length}
        </div>
      )}

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

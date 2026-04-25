"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  FileText,
  MoreHorizontal,
  Pencil,
  Plus,
  Repeat,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAssignments, useDeleteAssignment } from "@/lib/hooks/use-assignments";
import { useGradeCategories } from "@/lib/hooks/use-grade-categories";
import { useCourse } from "@/lib/hooks/use-courses";
import { groupByWeek } from "@/lib/utils/group-by-week";
import { AssignmentDialog } from "./assignment-dialog";
import { toast } from "sonner";

interface AssignmentListProps {
  courseId: string;
}

const statusVariants: Record<
  string,
  "default" | "secondary" | "destructive" | "outline" | "ok"
> = {
  not_started: "outline",
  in_progress: "secondary",
  submitted: "ok",
  graded: "ok",
};

const statusLabels: Record<string, string> = {
  not_started: "Not Started",
  in_progress: "In Progress",
  submitted: "Submitted",
  graded: "Graded",
};

const FINISHED_STATUSES = new Set(["submitted", "graded"]);

interface Assignment {
  id: string;
  title: string;
  description: string | null;
  dueDate: string | null;
  categoryId: string | null;
  status: "not_started" | "in_progress" | "submitted" | "graded";
  pointsEarned: string | null;
  pointsPossible: string | null;
  notes: string | null;
  recurrenceRuleId: string | null;
}

function formatDueDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function formatScore(a: Assignment): string | null {
  if (a.pointsEarned != null && a.pointsPossible != null) {
    return `${a.pointsEarned}/${a.pointsPossible}`;
  }
  if (a.pointsPossible != null) return `${a.pointsPossible} pts`;
  return null;
}

export function AssignmentList({ courseId }: AssignmentListProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] =
    useState<Assignment | null>(null);
  const { data: assignments, isLoading } = useAssignments(courseId);
  const { data: categories } = useGradeCategories(courseId);
  const { data: course } = useCourse(courseId);
  const deleteAssignment = useDeleteAssignment();

  const categoryMap = useMemo(
    () =>
      new Map<string, string>(
        (categories ?? []).map((c: { id: string; name: string }) => [
          c.id,
          c.name,
        ]),
      ),
    [categories],
  );

  const groups = useMemo(() => {
    if (!assignments) return [];
    return groupByWeek<Assignment>(assignments as Assignment[], {
      getDate: (a) => a.dueDate,
      startDate: course?.startDate ?? null,
    });
  }, [assignments, course?.startDate]);

  // Persist collapse state per-course in localStorage. Default: past weeks
  // collapsed, current + future weeks open.
  const storageKey = `assignmentModules:${courseId}`;
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (raw) setCollapsed(JSON.parse(raw));
    } catch {
      // ignore corrupt data
    }
    setHydrated(true);
  }, [storageKey]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(collapsed));
    } catch {
      // localStorage unavailable
    }
  }, [collapsed, hydrated, storageKey]);

  const toggleGroup = (key: string) =>
    setCollapsed((s) => ({ ...s, [key]: !s[key] }));

  const isCollapsed = (key: string, isPast: boolean) => {
    if (key in collapsed) return collapsed[key];
    return isPast; // default
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this assignment?")) return;
    try {
      await deleteAssignment.mutateAsync(id);
      toast.success("Assignment deleted");
    } catch {
      toast.error("Failed to delete assignment");
    }
  };

  const openEdit = (a: Assignment) => {
    setEditingAssignment(a);
    setDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-12 w-full rounded-lg" />
        <Skeleton className="h-12 w-full rounded-lg" />
        <Skeleton className="h-12 w-full rounded-lg" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-serif text-[20px] font-medium leading-tight tracking-tight">
          Assignments
        </h3>
        <Button
          size="sm"
          onClick={() => {
            setEditingAssignment(null);
            setDialogOpen(true);
          }}
        >
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          Add
        </Button>
      </div>

      {!assignments || assignments.length === 0 ? (
        <div className="flex flex-col items-center py-10 text-center">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <FileText className="h-4 w-4 text-primary" strokeWidth={1.75} />
          </div>
          <p className="text-sm text-muted-foreground">
            Nothing due yet. Add homework, papers, or exams to track them.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          {groups.map((group, idx) => {
            const open = !isCollapsed(group.key, group.isPast);
            const finished = group.items.filter((a) =>
              FINISHED_STATUSES.has(a.status),
            ).length;
            return (
              <div
                key={group.key}
                className={idx > 0 ? "border-t border-border" : ""}
              >
                <button
                  type="button"
                  onClick={() => toggleGroup(group.key)}
                  className={`group/header flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/40 ${
                    group.isCurrent ? "bg-primary/5" : "bg-muted/20"
                  }`}
                  aria-expanded={open}
                >
                  {open ? (
                    <ChevronDown
                      className="h-4 w-4 shrink-0 text-muted-foreground"
                      strokeWidth={2}
                    />
                  ) : (
                    <ChevronRight
                      className="h-4 w-4 shrink-0 text-muted-foreground"
                      strokeWidth={2}
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-2.5">
                      <span className="font-serif text-[15px] font-medium leading-none tracking-tight">
                        {group.label}
                      </span>
                      {group.isCurrent && (
                        <span className="text-[9.5px] font-medium uppercase tracking-[0.12em] text-primary">
                          Current
                        </span>
                      )}
                    </div>
                    {group.range && (
                      <p className="mt-0.5 font-mono text-[10.5px] tabular-nums text-muted-foreground/80">
                        {group.range}
                      </p>
                    )}
                  </div>
                  <span className="font-mono text-[11px] text-muted-foreground tabular-nums whitespace-nowrap">
                    {group.items.length} item{group.items.length === 1 ? "" : "s"}
                    {finished > 0 && ` · ${finished} done`}
                  </span>
                </button>

                {open && (
                  <ul className="divide-y divide-border/60">
                    {group.items.map((a) => {
                      const categoryName = a.categoryId
                        ? categoryMap.get(a.categoryId)
                        : null;
                      const score = formatScore(a);
                      const done = FINISHED_STATUSES.has(a.status);
                      return (
                        <li
                          key={a.id}
                          className={`group/row flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-muted/40 ${
                            done ? "opacity-70" : ""
                          }`}
                        >
                          <FileText
                            className="h-4 w-4 shrink-0 text-muted-foreground"
                            strokeWidth={1.75}
                            aria-hidden="true"
                          />
                          <button
                            type="button"
                            onClick={() => openEdit(a)}
                            className="flex min-w-0 flex-1 items-baseline gap-2 text-left"
                          >
                            <span
                              className={`text-[13.5px] font-medium leading-tight truncate ${
                                done ? "line-through" : ""
                              }`}
                            >
                              {a.title}
                            </span>
                            {a.recurrenceRuleId && (
                              <Repeat
                                className="h-3 w-3 shrink-0 text-primary"
                                aria-label="Recurring"
                              />
                            )}
                          </button>

                          <div className="hidden sm:flex items-center gap-3 shrink-0 text-[11.5px] text-muted-foreground">
                            {categoryName && <span>{categoryName}</span>}
                            {a.dueDate && (
                              <span className="tabular-nums">
                                {formatDueDate(a.dueDate)}
                              </span>
                            )}
                            {score && (
                              <span className="font-mono tabular-nums">
                                {score}
                              </span>
                            )}
                          </div>

                          <Badge
                            variant={statusVariants[a.status] ?? "outline"}
                            className="text-[10px] uppercase tracking-[0.08em] shrink-0"
                          >
                            {statusLabels[a.status] ?? a.status}
                          </Badge>

                          <DropdownMenu>
                            <DropdownMenuTrigger
                              render={
                                <Button
                                  variant="ghost"
                                  size="icon-sm"
                                  aria-label={`Actions for ${a.title}`}
                                />
                              }
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openEdit(a)}>
                                <Pencil className="mr-1.5 h-3.5 w-3.5" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                variant="destructive"
                                onClick={() => handleDelete(a.id)}
                              >
                                <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      )}

      <AssignmentDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        courseId={courseId}
        assignment={editingAssignment ?? undefined}
      />
    </div>
  );
}

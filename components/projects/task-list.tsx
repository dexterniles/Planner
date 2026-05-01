"use client";

import { Fragment, useState } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  ChevronRight,
  Repeat,
  ListChecks,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  useTasks,
  useDeleteTask,
  useUpdateTask,
  useBulkTasks,
} from "@/lib/hooks/use-tasks";
import { TaskDialog } from "./task-dialog";
import { TimerStartButton } from "@/components/layout/timer";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { BulkActionBar, type BulkAction } from "@/components/shared/bulk-action-bar";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface TaskListProps {
  projectId: string;
}

interface Task {
  id: string;
  title: string;
  description: string | null;
  dueDate: string | null;
  status: "not_started" | "in_progress" | "done" | "cancelled";
  priority: "low" | "medium" | "high" | "urgent";
  parentTaskId: string | null;
  notes: string | null;
  recurrenceRuleId: string | null;
}

const statusVariants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  not_started: "outline",
  in_progress: "secondary",
  done: "default",
  cancelled: "destructive",
};

const statusLabels: Record<string, string> = {
  not_started: "Not Started",
  in_progress: "In Progress",
  done: "Done",
  cancelled: "Cancelled",
};

const priorityLabels: Record<string, string> = {
  low: "Low",
  medium: "Med",
  high: "High",
  urgent: "Urgent",
};

const priorityColors: Record<string, string> = {
  low: "text-muted-foreground",
  medium: "text-chart-4",
  high: "text-chart-3",
  urgent: "text-destructive",
};

export function TaskList({ projectId }: TaskListProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [subtaskParentId, setSubtaskParentId] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const { data: allTasks, isLoading } = useTasks(projectId);
  const deleteTask = useDeleteTask();
  const updateTask = useUpdateTask();
  const bulkTasks = useBulkTasks();
  const confirm = useConfirm();

  const selectionMode = selected.size > 0;

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleBulk = async (action: BulkAction, days?: number) => {
    try {
      const res = await bulkTasks.mutateAsync({
        ids: Array.from(selected),
        action,
        days,
      });
      const verb =
        action === "delete"
          ? "deleted"
          : action === "mark-done"
          ? "marked done"
          : "rescheduled";
      toast.success(`${res.count} task${res.count === 1 ? "" : "s"} ${verb}`);
      setSelected(new Set());
    } catch {
      toast.error("Bulk action failed");
    }
  };

  const handleToggleDone = (task: Task) => {
    if (task.status === "cancelled") return; // preserve cancelled — toggling would silently lose state
    const next = task.status === "done" ? "not_started" : "done";
    updateTask.mutate({ id: task.id, data: { status: next } });
  };

  const handleDelete = async (id: string) => {
    if (
      !(await confirm({
        title: "Delete this task?",
        description: "Subtasks will be removed too.",
        destructive: true,
      }))
    ) {
      return;
    }
    try {
      await deleteTask.mutateAsync(id);
      toast.success("Task deleted");
    } catch {
      toast.error("Failed to delete task");
    }
  };

  if (isLoading) return <p className="text-muted-foreground">Loading...</p>;

  // Separate top-level tasks and subtasks
  const topLevelTasks = (allTasks ?? []).filter(
    (t: Task) => !t.parentTaskId,
  );
  const subtaskMap = new Map<string, Task[]>();
  for (const t of allTasks ?? []) {
    if (t.parentTaskId) {
      const existing = subtaskMap.get(t.parentTaskId) ?? [];
      existing.push(t);
      subtaskMap.set(t.parentTaskId, existing);
    }
  }

  const renderTaskRow = (task: Task, isSubtask = false) => {
    const isDone = task.status === "done";
    const isCancelled = task.status === "cancelled";
    const isSelected = selected.has(task.id);
    return (
    <TableRow
      key={task.id}
      className={cn(
        "transition-opacity duration-200",
        (isDone || isCancelled) && "opacity-60",
        isSelected && "bg-primary/5",
      )}
    >
      <TableCell className="font-medium">
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => toggleSelect(task.id)}
            aria-label={`Select ${task.title}`}
            className={cn(
              "h-3.5 w-3.5 shrink-0 cursor-pointer rounded border-muted-foreground/40 accent-foreground transition-opacity",
              isSelected || selectionMode
                ? "opacity-100"
                : "opacity-60 hover:opacity-100",
            )}
          />
          <input
            type="checkbox"
            checked={isDone}
            onChange={() => handleToggleDone(task)}
            aria-label={isDone ? "Mark task as not started" : "Mark task as done"}
            className="h-4 w-4 shrink-0 cursor-pointer rounded border-input accent-primary"
          />
          {isSubtask && (
            <ChevronRight className="h-3 w-3 text-muted-foreground" />
          )}
          <span
            className={`transition-all duration-300 ${isSubtask ? "pl-1" : ""} ${isDone ? "line-through text-muted-foreground" : ""}`}
          >
            {task.title}
          </span>
          {task.recurrenceRuleId && (
            <Repeat className="h-3 w-3 text-primary" />
          )}
        </div>
      </TableCell>
      <TableCell>
        <span className={`text-xs font-medium ${priorityColors[task.priority]}`}>
          {priorityLabels[task.priority]}
        </span>
      </TableCell>
      <TableCell className="text-muted-foreground">
        {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "—"}
      </TableCell>
      <TableCell>
        <Badge variant={statusVariants[task.status] ?? "outline"}>
          {statusLabels[task.status] ?? task.status}
        </Badge>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-1">
          <div className="hidden md:block">
            <TimerStartButton
              size="sm"
              loggableType="task"
              loggableId={task.id}
            />
          </div>
          {!isSubtask && (
            <Button
              variant="ghost"
              size="icon-sm"
              title="Add subtask"
              onClick={() => {
                setEditingTask(null);
                setSubtaskParentId(task.id);
                setDialogOpen(true);
              }}
            >
              <Plus className="h-3.5 w-3.5" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => {
              setEditingTask(task);
              setSubtaskParentId(null);
              setDialogOpen(true);
            }}
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            className="text-destructive"
            onClick={() => handleDelete(task.id)}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
    );
  };

  const renderTaskCard = (task: Task, isSubtask = false) => {
    const isDone = task.status === "done";
    const isCancelled = task.status === "cancelled";
    const faded = isDone || isCancelled;
    const isSelected = selected.has(task.id);
    return (
      <div
        key={task.id}
        className={cn(
          "rounded-lg border bg-card p-3 transition-opacity",
          faded && "opacity-60",
          isSubtask && "ml-5 border-l-2 border-l-muted-foreground/30",
          isSelected && "ring-2 ring-primary/50 border-primary/40",
        )}
      >
        <div className="flex items-start gap-2">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => toggleSelect(task.id)}
            aria-label={`Select ${task.title}`}
            className={cn(
              "mt-1 h-3.5 w-3.5 shrink-0 cursor-pointer rounded border-muted-foreground/40 accent-foreground transition-opacity",
              isSelected || selectionMode
                ? "opacity-100"
                : "opacity-60 hover:opacity-100",
            )}
          />
          <input
            type="checkbox"
            checked={isDone}
            onChange={() => handleToggleDone(task)}
            aria-label={isDone ? "Mark task as not started" : "Mark task as done"}
            className="mt-1 h-4 w-4 shrink-0 cursor-pointer rounded border-input accent-primary"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              {isSubtask && (
                <ChevronRight className="h-3 w-3 shrink-0 text-muted-foreground" />
              )}
              <span
                className={`text-sm font-medium ${isDone ? "line-through text-muted-foreground" : ""}`}
              >
                {task.title}
              </span>
              {task.recurrenceRuleId && (
                <Repeat className="h-3 w-3 shrink-0 text-primary" />
              )}
            </div>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
              <Badge variant={statusVariants[task.status] ?? "outline"} className="text-[10px]">
                {statusLabels[task.status] ?? task.status}
              </Badge>
              <span className={`font-medium ${priorityColors[task.priority]}`}>
                {priorityLabels[task.priority]}
              </span>
              {task.dueDate && (
                <span className="text-muted-foreground">
                  Due {new Date(task.dueDate).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>
          <div className="flex shrink-0 gap-0.5">
            {!isSubtask && (
              <Button
                variant="ghost"
                size="icon-sm"
                title="Add subtask"
                onClick={() => {
                  setEditingTask(null);
                  setSubtaskParentId(task.id);
                  setDialogOpen(true);
                }}
              >
                <Plus className="h-3.5 w-3.5" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => {
                setEditingTask(task);
                setSubtaskParentId(null);
                setDialogOpen(true);
              }}
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              className="text-destructive"
              onClick={() => handleDelete(task.id)}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-serif text-[20px] font-medium leading-tight tracking-tight">Tasks</h3>
        <Button
          size="sm"
          onClick={() => {
            setEditingTask(null);
            setSubtaskParentId(null);
            setDialogOpen(true);
          }}
        >
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          Add
        </Button>
      </div>

      {selectionMode && (
        <div className="mb-3">
          <BulkActionBar
            count={selected.size}
            entityLabel="task"
            isPending={bulkTasks.isPending}
            onAction={handleBulk}
            onClear={() => setSelected(new Set())}
          />
        </div>
      )}

      {topLevelTasks.length === 0 ? (
        <div className="flex flex-col items-center py-10 text-center">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <ListChecks className="h-4 w-4 text-primary" strokeWidth={1.75} />
          </div>
          <p className="text-sm text-muted-foreground">
            Break it down. Add a task or two to get started.
          </p>
        </div>
      ) : (
        <>
          <div className="hidden md:block rounded-lg border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Due</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-44" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {topLevelTasks.map((task: Task) => (
                  <Fragment key={task.id}>
                    {renderTaskRow(task)}
                    {(subtaskMap.get(task.id) ?? []).map((sub: Task) =>
                      renderTaskRow(sub, true),
                    )}
                  </Fragment>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="md:hidden space-y-2">
            {topLevelTasks.map((task: Task) => (
              <Fragment key={task.id}>
                {renderTaskCard(task)}
                {(subtaskMap.get(task.id) ?? []).map((sub: Task) =>
                  renderTaskCard(sub, true),
                )}
              </Fragment>
            ))}
          </div>
        </>
      )}

      <TaskDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        projectId={projectId}
        task={editingTask ?? undefined}
        parentTaskId={subtaskParentId}
      />
    </div>
  );
}

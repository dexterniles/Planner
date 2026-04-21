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
import { useTasks, useDeleteTask } from "@/lib/hooks/use-tasks";
import { TaskDialog } from "./task-dialog";
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
  medium: "text-blue-500",
  high: "text-orange-500",
  urgent: "text-red-500",
};

export function TaskList({ projectId }: TaskListProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [subtaskParentId, setSubtaskParentId] = useState<string | null>(null);
  const { data: allTasks, isLoading } = useTasks(projectId);
  const deleteTask = useDeleteTask();

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this task?")) return;
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
    return (
    <TableRow
      key={task.id}
      className={`transition-opacity duration-200 ${isDone || isCancelled ? "opacity-60" : ""}`}
    >
      <TableCell className="font-medium">
        <div className="flex items-center gap-1">
          {isSubtask && (
            <ChevronRight className="h-3 w-3 text-muted-foreground" />
          )}
          <span
            className={`transition-all duration-300 ${isSubtask ? "pl-2" : ""} ${isDone ? "line-through text-muted-foreground" : ""}`}
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
        <div className="flex gap-1">
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
    return (
      <div
        key={task.id}
        className={`rounded-lg border bg-card p-3 transition-opacity ${faded ? "opacity-60" : ""} ${isSubtask ? "ml-5 border-l-2 border-l-muted-foreground/30" : ""}`}
      >
        <div className="flex items-start gap-2">
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
        <h3 className="text-lg font-semibold">Tasks</h3>
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

      {topLevelTasks.length === 0 ? (
        <div className="flex flex-col items-center py-10 text-center">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/15 to-violet-500/5">
            <ListChecks className="h-4 w-4 text-violet-600 dark:text-violet-400" />
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
                  <TableHead className="w-28" />
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

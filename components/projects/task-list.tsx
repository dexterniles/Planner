"use client";

import { Fragment, useState } from "react";
import { Plus, Pencil, Trash2, ChevronRight, Repeat } from "lucide-react";
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

  const renderTaskRow = (task: Task, isSubtask = false) => (
    <TableRow key={task.id}>
      <TableCell className="font-medium">
        <div className="flex items-center gap-1">
          {isSubtask && (
            <ChevronRight className="h-3 w-3 text-muted-foreground" />
          )}
          <span className={isSubtask ? "pl-2" : ""}>{task.title}</span>
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
        <p className="text-sm text-muted-foreground">
          No tasks yet. Add one to get started.
        </p>
      ) : (
        <div className="rounded-lg border overflow-x-auto">
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

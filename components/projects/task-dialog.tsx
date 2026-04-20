"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createTaskSchema,
  type CreateTaskInput,
} from "@/lib/validations/task";
import { useCreateTask, useUpdateTask } from "@/lib/hooks/use-tasks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { RecurrencePicker } from "@/components/recurrence-picker";
import { toast } from "sonner";

const STATUS_OPTIONS = [
  { value: "not_started", label: "Not Started" },
  { value: "in_progress", label: "In Progress" },
  { value: "done", label: "Done" },
  { value: "cancelled", label: "Cancelled" },
] as const;

const PRIORITY_OPTIONS = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
] as const;

interface TaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  task?: {
    id: string;
    title: string;
    description: string | null;
    dueDate: string | null;
    status: "not_started" | "in_progress" | "done" | "cancelled";
    priority: "low" | "medium" | "high" | "urgent";
    parentTaskId: string | null;
    notes: string | null;
    recurrenceRuleId: string | null;
  };
  parentTaskId?: string | null;
}

export function TaskDialog({
  open,
  onOpenChange,
  projectId,
  task,
  parentTaskId,
}: TaskDialogProps) {
  const isEditing = !!task;
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreateTaskInput>({
    resolver: zodResolver(createTaskSchema),
    defaultValues: {
      projectId,
      title: task?.title ?? "",
      description: task?.description ?? "",
      dueDate: task?.dueDate
        ? new Date(task.dueDate).toISOString().slice(0, 16)
        : "",
      status: task?.status ?? "not_started",
      priority: task?.priority ?? "medium",
      parentTaskId: task?.parentTaskId ?? parentTaskId ?? null,
      notes: task?.notes ?? "",
    },
  });

  useEffect(() => {
    reset({
      projectId,
      title: task?.title ?? "",
      description: task?.description ?? "",
      dueDate: task?.dueDate
        ? new Date(task.dueDate).toISOString().slice(0, 16)
        : "",
      status: task?.status ?? "not_started",
      priority: task?.priority ?? "medium",
      parentTaskId: task?.parentTaskId ?? parentTaskId ?? null,
      notes: task?.notes ?? "",
    });
  }, [task, open, projectId, parentTaskId, reset]);

  const currentStatus = watch("status");
  const currentPriority = watch("priority");

  const onSubmit = async (data: CreateTaskInput) => {
    try {
      if (isEditing) {
        const { projectId: _omitted, ...updateData } = data;
        await updateTask.mutateAsync({ id: task.id, data: updateData });
        toast.success("Task updated");
      } else {
        await createTask.mutateAsync(data);
        toast.success("Task created");
      }
      reset();
      onOpenChange(false);
    } catch {
      toast.error(
        isEditing ? "Failed to update task" : "Failed to create task",
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing
              ? "Edit Task"
              : parentTaskId
                ? "New Subtask"
                : "New Task"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              {...register("title")}
              placeholder="e.g. Set up CI/CD pipeline"
            />
            {errors.title && (
              <p className="text-sm text-destructive">
                {errors.title.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              {...register("description")}
              placeholder="Optional description..."
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dueDate">Due Date</Label>
              <Input
                id="dueDate"
                type="datetime-local"
                {...register("dueDate")}
              />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={currentStatus}
                onValueChange={(val) =>
                  setValue("status", val as CreateTaskInput["status"])
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue>
                    {(value) =>
                      STATUS_OPTIONS.find((o) => o.value === value)?.label ??
                      value
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Priority</Label>
            <Select
              value={currentPriority}
              onValueChange={(val) =>
                setValue("priority", val as CreateTaskInput["priority"])
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue>
                  {(value) =>
                    PRIORITY_OPTIONS.find((o) => o.value === value)?.label ??
                    value
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {PRIORITY_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              {...register("notes")}
              placeholder="Optional notes..."
              rows={2}
            />
          </div>

          {isEditing && (
            <RecurrencePicker
              ownerType="task"
              ownerId={task.id}
              recurrenceRuleId={task.recurrenceRuleId}
            />
          )}

          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>
              Cancel
            </DialogClose>
            <Button
              type="submit"
              disabled={createTask.isPending || updateTask.isPending}
            >
              {createTask.isPending || updateTask.isPending
                ? "Saving..."
                : isEditing
                  ? "Update"
                  : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

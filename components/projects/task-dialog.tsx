"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createTaskSchema,
  type CreateTaskInput,
} from "@/lib/validations/task";
import { useCreateTask, useUpdateTask } from "@/lib/hooks/use-tasks";
import { useProjects } from "@/lib/hooks/use-projects";
import { useWorkspaces } from "@/lib/hooks/use-workspaces";
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
import { toLocalDateTimeInput } from "@/lib/utils";
import { toast } from "sonner";
import type { RecurrencePayload } from "@/lib/validations/recurrence";

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

interface TaskPrefill {
  title?: string;
  dueDate?: string;
  projectId?: string;
}

interface TaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId?: string;
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
  prefill?: TaskPrefill;
  showProjectSelect?: boolean;
  onCreated?: (task: { id: string }) => void;
}

interface ProjectRow {
  id: string;
  name: string;
}

interface WorkspaceRow {
  id: string;
  type: string;
}

export function TaskDialog({
  open,
  onOpenChange,
  projectId,
  task,
  parentTaskId,
  prefill,
  showProjectSelect,
  onCreated,
}: TaskDialogProps) {
  const isEditing = !!task;
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();

  const { data: workspaces } = useWorkspaces();
  const projectsWorkspace = (workspaces as WorkspaceRow[] | undefined)?.find(
    (w) => w.type === "projects",
  );
  const { data: projectList } = useProjects(
    showProjectSelect ? projectsWorkspace?.id : undefined,
  );
  const projects = (projectList ?? []) as ProjectRow[];
  const defaultProjectId =
    prefill?.projectId ?? projectId ?? projects[0]?.id ?? "";

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
      projectId: defaultProjectId,
      title: task?.title ?? prefill?.title ?? "",
      description: task?.description ?? "",
      dueDate: toLocalDateTimeInput(task?.dueDate ?? prefill?.dueDate ?? null),
      status: task?.status ?? "not_started",
      priority: task?.priority ?? "medium",
      parentTaskId: task?.parentTaskId ?? parentTaskId ?? null,
      notes: task?.notes ?? "",
      recurrence: null,
    },
  });

  useEffect(() => {
    reset({
      projectId: task ? projectId ?? "" : defaultProjectId,
      title: task?.title ?? prefill?.title ?? "",
      description: task?.description ?? "",
      dueDate: toLocalDateTimeInput(task?.dueDate ?? prefill?.dueDate ?? null),
      status: task?.status ?? "not_started",
      priority: task?.priority ?? "medium",
      parentTaskId: task?.parentTaskId ?? parentTaskId ?? null,
      notes: task?.notes ?? "",
      recurrence: null,
    });
  }, [
    task,
    open,
    projectId,
    parentTaskId,
    prefill,
    defaultProjectId,
    reset,
  ]);

  const currentStatus = watch("status");
  const currentPriority = watch("priority");
  const currentProjectId = watch("projectId");
  const currentRecurrence = watch("recurrence") ?? null;

  const onSubmit = async (data: CreateTaskInput) => {
    try {
      const payload: CreateTaskInput = {
        ...data,
        dueDate: data.dueDate
          ? new Date(data.dueDate).toISOString()
          : data.dueDate,
      };
      if (isEditing) {
        const { projectId: _omitted, recurrence: _r, ...updateData } = payload;
        await updateTask.mutateAsync({ id: task.id, data: updateData });
        toast.success("Task updated");
      } else {
        const created = await createTask.mutateAsync(payload);
        toast.success("Task created");
        if (onCreated) onCreated(created);
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
              autoFocus
            />
            {errors.title && (
              <p className="text-sm text-destructive">
                {errors.title.message}
              </p>
            )}
          </div>

          {!isEditing && showProjectSelect && (
            <div className="space-y-2">
              <Label>Project *</Label>
              <Select
                value={currentProjectId}
                onValueChange={(val) =>
                  setValue("projectId", typeof val === "string" ? val : "")
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue>
                    {(value) =>
                      projects.find((p) => p.id === value)?.name ??
                      "Choose a project"
                    }
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.projectId && (
                <p className="text-sm text-destructive">
                  {errors.projectId.message}
                </p>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              {...register("description")}
              placeholder="Optional description..."
              rows={2}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

          {isEditing ? (
            <RecurrencePicker
              ownerType="task"
              ownerId={task.id}
              recurrenceRuleId={task.recurrenceRuleId}
            />
          ) : (
            <RecurrencePicker
              draft
              value={currentRecurrence as RecurrencePayload | null}
              onChange={(val) =>
                setValue("recurrence", val, { shouldDirty: true })
              }
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

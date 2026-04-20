"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createProjectSchema,
  type CreateProjectInput,
} from "@/lib/validations/project";
import { useCreateProject, useUpdateProject } from "@/lib/hooks/use-projects";
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
import { toast } from "sonner";

const PROJECT_COLORS = [
  "#8B5CF6",
  "#3B82F6",
  "#10B981",
  "#F59E0B",
  "#EF4444",
  "#EC4899",
  "#06B6D4",
  "#F97316",
];

const STATUS_OPTIONS = [
  { value: "planning", label: "Planning" },
  { value: "active", label: "Active" },
  { value: "paused", label: "Paused" },
  { value: "done", label: "Done" },
] as const;

const PRIORITY_OPTIONS = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
] as const;

interface ProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceId: string;
  project?: {
    id: string;
    name: string;
    description: string | null;
    goal: string | null;
    status: "planning" | "active" | "paused" | "done";
    priority: "low" | "medium" | "high" | "urgent";
    startDate: string | null;
    targetDate: string | null;
    color: string | null;
  };
}

export function ProjectDialog({
  open,
  onOpenChange,
  workspaceId,
  project,
}: ProjectDialogProps) {
  const isEditing = !!project;
  const createProject = useCreateProject();
  const updateProject = useUpdateProject();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreateProjectInput>({
    resolver: zodResolver(createProjectSchema),
    defaultValues: {
      workspaceId,
      name: project?.name ?? "",
      description: project?.description ?? "",
      goal: project?.goal ?? "",
      status: project?.status ?? "planning",
      priority: project?.priority ?? "medium",
      startDate: project?.startDate ?? "",
      targetDate: project?.targetDate ?? "",
      color: project?.color ?? PROJECT_COLORS[0],
    },
  });

  useEffect(() => {
    reset({
      workspaceId,
      name: project?.name ?? "",
      description: project?.description ?? "",
      goal: project?.goal ?? "",
      status: project?.status ?? "planning",
      priority: project?.priority ?? "medium",
      startDate: project?.startDate ?? "",
      targetDate: project?.targetDate ?? "",
      color: project?.color ?? PROJECT_COLORS[0],
    });
  }, [project, open, workspaceId, reset]);

  const selectedColor = watch("color");
  const currentStatus = watch("status");
  const currentPriority = watch("priority");

  const onSubmit = async (data: CreateProjectInput) => {
    try {
      if (isEditing) {
        const { workspaceId: _omitted, ...updateData } = data;
        await updateProject.mutateAsync({ id: project.id, data: updateData });
        toast.success("Project updated");
      } else {
        await createProject.mutateAsync(data);
        toast.success("Project created");
      }
      reset();
      onOpenChange(false);
    } catch {
      toast.error(
        isEditing ? "Failed to update project" : "Failed to create project",
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Project" : "New Project"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Project Name *</Label>
            <Input
              id="name"
              {...register("name")}
              placeholder="e.g. Portfolio Website"
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              {...register("description")}
              placeholder="What is this project about?"
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="goal">Goal</Label>
            <Input
              id="goal"
              {...register("goal")}
              placeholder="What does done look like?"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={currentStatus}
                onValueChange={(val) =>
                  setValue("status", val as CreateProjectInput["status"])
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
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
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select
                value={currentPriority}
                onValueChange={(val) =>
                  setValue("priority", val as CreateProjectInput["priority"])
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
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
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                {...register("startDate")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="targetDate">Target Date</Label>
              <Input
                id="targetDate"
                type="date"
                {...register("targetDate")}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Color</Label>
            <div className="flex gap-2">
              {PROJECT_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  className="h-7 w-7 rounded-full border-2 transition-transform hover:scale-110"
                  style={{
                    backgroundColor: color,
                    borderColor:
                      selectedColor === color ? "currentColor" : "transparent",
                  }}
                  onClick={() => setValue("color", color)}
                />
              ))}
            </div>
          </div>

          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>
              Cancel
            </DialogClose>
            <Button
              type="submit"
              disabled={createProject.isPending || updateProject.isPending}
            >
              {createProject.isPending || updateProject.isPending
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

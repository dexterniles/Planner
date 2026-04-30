"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createMilestoneSchema,
  type CreateMilestoneInput,
} from "@/lib/validations/milestone";
import {
  useCreateMilestone,
  useUpdateMilestone,
} from "@/lib/hooks/use-milestones";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { toast } from "sonner";

interface MilestoneDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  milestone?: {
    id: string;
    title: string;
    description: string | null;
    targetDate: string | null;
    completedAt: string | null;
  };
}

export function MilestoneDialog({
  open,
  onOpenChange,
  projectId,
  milestone,
}: MilestoneDialogProps) {
  const isEditing = !!milestone;
  const createMilestone = useCreateMilestone();
  const updateMilestone = useUpdateMilestone();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateMilestoneInput>({
    resolver: zodResolver(createMilestoneSchema),
    defaultValues: {
      projectId,
      title: milestone?.title ?? "",
      description: milestone?.description ?? "",
      targetDate: milestone?.targetDate ?? "",
    },
  });

  useEffect(() => {
    reset({
      projectId,
      title: milestone?.title ?? "",
      description: milestone?.description ?? "",
      targetDate: milestone?.targetDate ?? "",
    });
  }, [milestone, open, projectId, reset]);

  const onSubmit = async (data: CreateMilestoneInput) => {
    try {
      if (isEditing) {
        const { projectId: _omitted, ...updateData } = data;
        await updateMilestone.mutateAsync({
          id: milestone.id,
          data: updateData,
        });
        toast.success("Milestone updated");
      } else {
        await createMilestone.mutateAsync(data);
        toast.success("Milestone created");
      }
      reset();
      onOpenChange(false);
    } catch {
      toast.error(
        isEditing
          ? "Failed to update milestone"
          : "Failed to create milestone",
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Milestone" : "New Milestone"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="ms-title">Title *</Label>
            <Input
              id="ms-title"
              {...register("title")}
              placeholder="e.g. MVP Launch"
              autoFocus
            />
            {errors.title && (
              <p className="text-sm text-destructive">
                {errors.title.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="ms-description">Description</Label>
            <Textarea
              id="ms-description"
              {...register("description")}
              placeholder="What does this milestone represent?"
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="ms-targetDate">Target Date</Label>
            <Input
              id="ms-targetDate"
              type="date"
              {...register("targetDate")}
            />
          </div>

          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>
              Cancel
            </DialogClose>
            <Button
              type="submit"
              disabled={
                createMilestone.isPending || updateMilestone.isPending
              }
            >
              {createMilestone.isPending || updateMilestone.isPending
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

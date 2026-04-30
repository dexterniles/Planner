"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createAssignmentSchema,
  type CreateAssignmentInput,
} from "@/lib/validations/assignment";
import {
  useCreateAssignment,
  useUpdateAssignment,
} from "@/lib/hooks/use-assignments";
import { useGradeCategories } from "@/lib/hooks/use-grade-categories";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RecurrencePicker } from "@/components/recurrence-picker";
import { toLocalDateTimeInput } from "@/lib/utils";
import { toast } from "sonner";

interface AssignmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courseId: string;
  assignment?: {
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
  };
}

const STATUS_OPTIONS = [
  { value: "not_started", label: "Not Started" },
  { value: "in_progress", label: "In Progress" },
  { value: "submitted", label: "Submitted" },
  { value: "graded", label: "Graded" },
] as const;

export function AssignmentDialog({
  open,
  onOpenChange,
  courseId,
  assignment,
}: AssignmentDialogProps) {
  const isEditing = !!assignment;
  const createAssignment = useCreateAssignment();
  const updateAssignment = useUpdateAssignment();
  const { data: categories } = useGradeCategories(courseId);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateAssignmentInput>({
    resolver: zodResolver(createAssignmentSchema),
    defaultValues: {
      courseId,
      title: assignment?.title ?? "",
      description: assignment?.description ?? "",
      dueDate: toLocalDateTimeInput(assignment?.dueDate),
      categoryId: assignment?.categoryId ?? undefined,
      status: assignment?.status ?? "not_started",
      pointsEarned: assignment?.pointsEarned
        ? Number(assignment.pointsEarned)
        : undefined,
      pointsPossible: assignment?.pointsPossible
        ? Number(assignment.pointsPossible)
        : undefined,
      notes: assignment?.notes ?? "",
    },
  });

  useEffect(() => {
    reset({
      courseId,
      title: assignment?.title ?? "",
      description: assignment?.description ?? "",
      dueDate: toLocalDateTimeInput(assignment?.dueDate),
      categoryId: assignment?.categoryId ?? undefined,
      status: assignment?.status ?? "not_started",
      pointsEarned: assignment?.pointsEarned
        ? Number(assignment.pointsEarned)
        : undefined,
      pointsPossible: assignment?.pointsPossible
        ? Number(assignment.pointsPossible)
        : undefined,
      notes: assignment?.notes ?? "",
    });
  }, [assignment, open, courseId, reset]);

  const currentStatus = watch("status");
  const currentCategory = watch("categoryId");

  const onSubmit = async (data: CreateAssignmentInput) => {
    try {
      // Convert local datetime-local input to a proper UTC ISO string so the
      // server (running in UTC) doesn't misinterpret it as a UTC wall-clock.
      const payload: CreateAssignmentInput = {
        ...data,
        dueDate: data.dueDate
          ? new Date(data.dueDate).toISOString()
          : data.dueDate,
      };
      if (isEditing) {
        const { courseId: _omitted, ...updateData } = payload;
        await updateAssignment.mutateAsync({
          id: assignment.id,
          data: updateData,
        });
        toast.success("Assignment updated");
      } else {
        await createAssignment.mutateAsync(payload);
        toast.success("Assignment created");
      }
      reset();
      onOpenChange(false);
    } catch {
      toast.error(
        isEditing
          ? "Failed to update assignment"
          : "Failed to create assignment",
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Assignment" : "New Assignment"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              {...register("title")}
              placeholder="e.g. Homework 3"
              autoFocus
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
                  setValue(
                    "status",
                    val as CreateAssignmentInput["status"],
                  )
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

          {categories && categories.length > 0 && (
            <div className="space-y-2">
              <Label>Grade Category</Label>
              <Select
                value={currentCategory ?? "none"}
                onValueChange={(val) =>
                  setValue("categoryId", val === "none" ? null : val)
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue>
                    {(value) => {
                      if (value === "none" || !value) return "No category";
                      const cat = categories?.find(
                        (c: { id: string }) => c.id === value,
                      );
                      return cat ? `${cat.name} (${cat.weight}%)` : value;
                    }}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No category</SelectItem>
                  {categories.map(
                    (cat: { id: string; name: string; weight: string }) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name} ({cat.weight}%)
                      </SelectItem>
                    ),
                  )}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="pointsPossible">Points Possible</Label>
              <Input
                id="pointsPossible"
                type="number"
                step="0.01"
                {...register("pointsPossible", {
                  setValueAs: (v) =>
                    v === "" || v == null || Number.isNaN(Number(v))
                      ? null
                      : Number(v),
                })}
                placeholder="100"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pointsEarned">Points Earned</Label>
              <Input
                id="pointsEarned"
                type="number"
                step="0.01"
                {...register("pointsEarned", {
                  setValueAs: (v) =>
                    v === "" || v == null || Number.isNaN(Number(v))
                      ? null
                      : Number(v),
                })}
                placeholder="—"
              />
            </div>
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
              ownerType="assignment"
              ownerId={assignment.id}
              recurrenceRuleId={assignment.recurrenceRuleId}
            />
          )}

          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>
              Cancel
            </DialogClose>
            <Button
              type="submit"
              disabled={
                createAssignment.isPending || updateAssignment.isPending
              }
            >
              {createAssignment.isPending || updateAssignment.isPending
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

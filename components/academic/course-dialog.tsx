"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createCourseSchema,
  type CreateCourseInput,
} from "@/lib/validations/course";
import { useCreateCourse, useUpdateCourse } from "@/lib/hooks/use-courses";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { toast } from "sonner";

const COURSE_COLORS = [
  "#3B82F6",
  "#EF4444",
  "#10B981",
  "#F59E0B",
  "#8B5CF6",
  "#EC4899",
  "#06B6D4",
  "#F97316",
];

interface CourseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceId: string;
  course?: {
    id: string;
    name: string;
    code: string | null;
    instructor: string | null;
    semester: string | null;
    credits: number | null;
    color: string | null;
    status: "active" | "completed" | "dropped" | "planned";
    startDate?: string | null;
    endDate?: string | null;
  };
}

export function CourseDialog({
  open,
  onOpenChange,
  workspaceId,
  course,
}: CourseDialogProps) {
  const isEditing = !!course;
  const createCourse = useCreateCourse();
  const updateCourse = useUpdateCourse();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreateCourseInput>({
    resolver: zodResolver(createCourseSchema),
    defaultValues: {
      workspaceId,
      name: course?.name ?? "",
      code: course?.code ?? "",
      instructor: course?.instructor ?? "",
      semester: course?.semester ?? "",
      credits: course?.credits ?? undefined,
      color: course?.color ?? COURSE_COLORS[0],
      status: course?.status ?? "active",
      startDate: course?.startDate ?? "",
      endDate: course?.endDate ?? "",
    },
  });

  useEffect(() => {
    reset({
      workspaceId,
      name: course?.name ?? "",
      code: course?.code ?? "",
      instructor: course?.instructor ?? "",
      semester: course?.semester ?? "",
      credits: course?.credits ?? undefined,
      color: course?.color ?? COURSE_COLORS[0],
      status: course?.status ?? "active",
      startDate: course?.startDate ?? "",
      endDate: course?.endDate ?? "",
    });
  }, [course, open, workspaceId, reset]);

  const selectedColor = watch("color");

  const onSubmit = async (data: CreateCourseInput) => {
    try {
      const payload: CreateCourseInput = {
        ...data,
        startDate: data.startDate ? data.startDate : null,
        endDate: data.endDate ? data.endDate : null,
      };
      if (isEditing) {
        const { workspaceId: _omitted, ...updateData } = payload;
        await updateCourse.mutateAsync({ id: course.id, data: updateData });
        toast.success("Course updated");
      } else {
        await createCourse.mutateAsync(payload);
        toast.success("Course created");
      }
      reset();
      onOpenChange(false);
    } catch {
      toast.error(isEditing ? "Failed to update course" : "Failed to create course");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Course" : "New Course"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Course Name *</Label>
            <Input id="name" {...register("name")} placeholder="e.g. Data Structures" />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="code">Course Code</Label>
              <Input id="code" {...register("code")} placeholder="e.g. CS201" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="semester">Semester</Label>
              <Input id="semester" {...register("semester")} placeholder="e.g. Fall 2026" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="instructor">Instructor</Label>
              <Input id="instructor" {...register("instructor")} placeholder="e.g. Dr. Smith" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="credits">Credits</Label>
              <Input
                id="credits"
                type="number"
                {...register("credits", {
                  setValueAs: (v) =>
                    v === "" || v == null || Number.isNaN(Number(v))
                      ? null
                      : Number(v),
                })}
                placeholder="3"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start date</Label>
              <Input id="startDate" type="date" {...register("startDate")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">End date</Label>
              <Input id="endDate" type="date" {...register("endDate")} />
            </div>
          </div>
          <p className="-mt-2 text-[12px] text-muted-foreground">
            Setting an end date will mark the course complete automatically once
            the date passes.
          </p>

          <div className="space-y-2">
            <Label>Color</Label>
            <div className="flex gap-2">
              {COURSE_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  className="h-7 w-7 rounded-full border-2 transition-transform hover:scale-110"
                  style={{
                    backgroundColor: color,
                    borderColor: selectedColor === color ? "currentColor" : "transparent",
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
              disabled={createCourse.isPending || updateCourse.isPending}
            >
              {createCourse.isPending || updateCourse.isPending
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

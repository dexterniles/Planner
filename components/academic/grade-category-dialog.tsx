"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createGradeCategorySchema,
  type CreateGradeCategoryInput,
} from "@/lib/validations/grade-category";
import {
  useCreateGradeCategory,
  useUpdateGradeCategory,
} from "@/lib/hooks/use-grade-categories";
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

interface GradeCategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courseId: string;
  category?: {
    id: string;
    name: string;
    weight: string;
    dropLowestN: number;
  };
}

export function GradeCategoryDialog({
  open,
  onOpenChange,
  courseId,
  category,
}: GradeCategoryDialogProps) {
  const isEditing = !!category;
  const createCategory = useCreateGradeCategory();
  const updateCategory = useUpdateGradeCategory();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateGradeCategoryInput>({
    resolver: zodResolver(createGradeCategorySchema),
    defaultValues: {
      courseId,
      name: category?.name ?? "",
      weight: category?.weight ? Number(category.weight) : 0,
      dropLowestN: category?.dropLowestN ?? 0,
    },
  });

  const onSubmit = async (data: CreateGradeCategoryInput) => {
    try {
      if (isEditing) {
        const { courseId: _, ...updateData } = data;
        await updateCategory.mutateAsync({ id: category.id, data: updateData });
        toast.success("Category updated");
      } else {
        await createCategory.mutateAsync(data);
        toast.success("Category created");
      }
      reset();
      onOpenChange(false);
    } catch {
      toast.error(
        isEditing
          ? "Failed to update category"
          : "Failed to create category",
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Category" : "New Grade Category"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cat-name">Name *</Label>
            <Input
              id="cat-name"
              {...register("name")}
              placeholder="e.g. Homework"
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="weight">Weight (%)</Label>
              <Input
                id="weight"
                type="number"
                step="0.01"
                {...register("weight", { valueAsNumber: true })}
                placeholder="25"
              />
              {errors.weight && (
                <p className="text-sm text-destructive">
                  {errors.weight.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="dropLowestN">Drop Lowest</Label>
              <Input
                id="dropLowestN"
                type="number"
                {...register("dropLowestN", { valueAsNumber: true })}
                placeholder="0"
              />
            </div>
          </div>

          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>
              Cancel
            </DialogClose>
            <Button
              type="submit"
              disabled={createCategory.isPending || updateCategory.isPending}
            >
              {createCategory.isPending || updateCategory.isPending
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

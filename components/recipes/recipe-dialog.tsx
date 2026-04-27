"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { type CreateRecipeInput } from "@/lib/validations/recipe";
import { useCreateRecipe, useUpdateRecipe } from "@/lib/hooks/use-recipes";
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

interface RecipeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recipe?: {
    id: string;
    title: string;
    description: string | null;
    prepTimeMinutes: number | null;
    cookTimeMinutes: number | null;
    portions: number;
    notes: string | null;
    sourceUrl: string | null;
  };
}

const recipeFormSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(300),
  description: z.string(),
  prepTimeMinutes: z
    .string()
    .refine((s) => s === "" || /^\d+$/.test(s), "Must be a whole number"),
  cookTimeMinutes: z
    .string()
    .refine((s) => s === "" || /^\d+$/.test(s), "Must be a whole number"),
  portions: z
    .string()
    .refine(
      (s) => /^\d+$/.test(s) && Number(s) >= 1,
      "Must be at least 1",
    ),
  notes: z.string(),
  sourceUrl: z.string().max(1000),
});

type FormValues = z.infer<typeof recipeFormSchema>;

export function RecipeDialog({ open, onOpenChange, recipe }: RecipeDialogProps) {
  const isEditing = !!recipe;
  const createRecipe = useCreateRecipe();
  const updateRecipe = useUpdateRecipe();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(recipeFormSchema),
    defaultValues: {
      title: "",
      description: "",
      prepTimeMinutes: "",
      cookTimeMinutes: "",
      portions: "1",
      notes: "",
      sourceUrl: "",
    },
  });

  useEffect(() => {
    reset({
      title: recipe?.title ?? "",
      description: recipe?.description ?? "",
      prepTimeMinutes:
        recipe?.prepTimeMinutes != null ? String(recipe.prepTimeMinutes) : "",
      cookTimeMinutes:
        recipe?.cookTimeMinutes != null ? String(recipe.cookTimeMinutes) : "",
      portions: recipe?.portions != null ? String(recipe.portions) : "1",
      notes: recipe?.notes ?? "",
      sourceUrl: recipe?.sourceUrl ?? "",
    });
  }, [recipe, open, reset]);

  const onSubmit = async (data: FormValues) => {
    const payload: CreateRecipeInput = {
      title: data.title.trim(),
      description: data.description.trim() || null,
      prepTimeMinutes: data.prepTimeMinutes
        ? parseInt(data.prepTimeMinutes, 10)
        : null,
      cookTimeMinutes: data.cookTimeMinutes
        ? parseInt(data.cookTimeMinutes, 10)
        : null,
      portions: parseInt(data.portions, 10),
      notes: data.notes.trim() || null,
      sourceUrl: data.sourceUrl.trim() || null,
    };

    try {
      if (isEditing) {
        await updateRecipe.mutateAsync({ id: recipe.id, data: payload });
        toast.success("Recipe updated");
      } else {
        await createRecipe.mutateAsync(payload);
        toast.success("Recipe created");
      }
      onOpenChange(false);
      reset();
    } catch {
      toast.error(isEditing ? "Failed to update recipe" : "Failed to create recipe");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Recipe" : "New Recipe"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              {...register("title")}
              placeholder="e.g. Sunday Sauce"
              autoFocus
            />
            {errors.title && (
              <p className="text-sm text-destructive">{errors.title.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              {...register("description")}
              placeholder="A short blurb..."
              rows={2}
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label htmlFor="prepTimeMinutes">Prep (min)</Label>
              <Input
                id="prepTimeMinutes"
                type="number"
                min="0"
                {...register("prepTimeMinutes")}
                placeholder="15"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cookTimeMinutes">Cook (min)</Label>
              <Input
                id="cookTimeMinutes"
                type="number"
                min="0"
                {...register("cookTimeMinutes")}
                placeholder="45"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="portions">Portions</Label>
              <Input
                id="portions"
                type="number"
                min="1"
                {...register("portions")}
                placeholder="4"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="sourceUrl">Source link</Label>
            <Input
              id="sourceUrl"
              {...register("sourceUrl")}
              placeholder="https://..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              {...register("notes")}
              placeholder="Tips, tweaks, what worked..."
              rows={3}
            />
          </div>

          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
            <Button
              type="submit"
              disabled={createRecipe.isPending || updateRecipe.isPending}
            >
              {createRecipe.isPending || updateRecipe.isPending
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

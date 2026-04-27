"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ChefHat,
  Clock,
  ExternalLink,
  Pencil,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useRecipe, useDeleteRecipe } from "@/lib/hooks/use-recipes";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { useRouter } from "next/navigation";
import { RecipeDialog } from "@/components/recipes/recipe-dialog";
import {
  IngredientList,
  type Ingredient,
} from "@/components/recipes/ingredient-list";
import { StepList, type Step } from "@/components/recipes/step-list";
import {
  EquipmentList,
  type Equipment,
} from "@/components/recipes/equipment-list";
import { PortionConverter } from "@/components/recipes/portion-converter";
import { RecipeTags } from "@/components/recipes/recipe-tags";
import { toast } from "sonner";

export default function RecipeDetailPage({
  params,
}: {
  params: Promise<{ recipeId: string }>;
}) {
  const { recipeId } = use(params);
  const router = useRouter();
  const { data: recipe, isLoading } = useRecipe(recipeId);
  const deleteRecipe = useDeleteRecipe();
  const confirm = useConfirm();

  const [editOpen, setEditOpen] = useState(false);
  const [targetPortions, setTargetPortions] = useState<number>(1);

  // Sync the displayed portion count with the saved recipe value when it loads
  // or changes. The user can then scale up/down and reset back to original.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- mirror local scaling state to recipe source on load/change
    if (recipe?.portions) setTargetPortions(recipe.portions);
  }, [recipe?.portions]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-7 w-64" />
        <Skeleton className="h-4 w-96" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!recipe) {
    return (
      <div>
        <p className="text-muted-foreground">Recipe not found.</p>
        <Link href="/recipes">
          <Button variant="outline" className="mt-4">
            Back to Recipes
          </Button>
        </Link>
      </div>
    );
  }

  const handleDelete = async () => {
    if (
      !(await confirm({
        title: `Delete ${recipe.title}?`,
        description: "This recipe and its ingredients, steps, and equipment will be removed.",
        destructive: true,
      }))
    ) {
      return;
    }
    try {
      await deleteRecipe.mutateAsync(recipeId);
      toast.success("Recipe deleted");
      router.push("/recipes");
    } catch {
      toast.error("Failed to delete recipe");
    }
  };

  const ingredients: Ingredient[] = recipe.ingredients ?? [];
  const steps: Step[] = recipe.steps ?? [];
  const equipment: Equipment[] = recipe.equipment ?? [];
  const tags = recipe.tags ?? [];

  const basePortions = recipe.portions || 1;
  const scale = basePortions > 0 ? targetPortions / basePortions : 1;
  const totalTime =
    (recipe.prepTimeMinutes ?? 0) + (recipe.cookTimeMinutes ?? 0);

  return (
    <div>
      <Link
        href="/recipes"
        className="mb-3 inline-flex items-center gap-1.5 text-[12.5px] text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.75} />
        Recipes
      </Link>

      <div className="mb-7 border-b border-border pb-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between md:gap-6">
          <div className="flex min-w-0 flex-1 items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
              <ChefHat className="h-5 w-5 text-primary" strokeWidth={1.75} />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="font-serif text-[26px] md:text-[32px] font-medium leading-tight tracking-tight">
                {recipe.title}
              </h1>
              {recipe.description && (
                <p className="mt-2 text-[14px] leading-relaxed text-muted-foreground">
                  {recipe.description}
                </p>
              )}
              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12.5px] text-muted-foreground">
                {recipe.prepTimeMinutes != null && (
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" strokeWidth={1.75} />
                    Prep <span className="tabular-nums">{recipe.prepTimeMinutes}</span> min
                  </span>
                )}
                {recipe.cookTimeMinutes != null && (
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" strokeWidth={1.75} />
                    Cook <span className="tabular-nums">{recipe.cookTimeMinutes}</span> min
                  </span>
                )}
                {totalTime > 0 && (
                  <span className="flex items-center gap-1.5">
                    Total <span className="font-medium tabular-nums">{totalTime}</span> min
                  </span>
                )}
                {recipe.sourceUrl && (
                  <a
                    href={recipe.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 underline-offset-2 hover:text-foreground hover:underline"
                  >
                    <ExternalLink className="h-3.5 w-3.5" strokeWidth={1.75} />
                    Source
                  </a>
                )}
              </div>

              <div className="mt-3">
                <RecipeTags recipeId={recipeId} attached={tags} />
              </div>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2 self-start">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditOpen(true)}
            >
              <Pencil className="mr-1.5 h-3.5 w-3.5" />
              Edit
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDelete}
              className="text-destructive"
              disabled={deleteRecipe.isPending}
            >
              <Trash2 className="mr-1.5 h-3.5 w-3.5" />
              Delete
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-8 md:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
        {/* Left column: ingredients + equipment */}
        <div className="space-y-7">
          <div>
            <div className="mb-3 flex items-center justify-end">
              <PortionConverter
                basePortions={basePortions}
                targetPortions={targetPortions}
                onChange={setTargetPortions}
              />
            </div>
            <IngredientList
              recipeId={recipeId}
              ingredients={ingredients}
              scale={scale}
            />
          </div>

          <EquipmentList recipeId={recipeId} equipment={equipment} />
        </div>

        {/* Right column: method + notes */}
        <div className="space-y-7">
          <StepList recipeId={recipeId} steps={steps} />

          {recipe.notes && (
            <div>
              <h3 className="font-serif text-[18px] font-medium leading-tight tracking-tight mb-2">
                Notes
              </h3>
              <p className="text-[14px] leading-relaxed text-foreground/90 whitespace-pre-wrap">
                {recipe.notes}
              </p>
            </div>
          )}
        </div>
      </div>

      <RecipeDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        recipe={recipe}
      />
    </div>
  );
}

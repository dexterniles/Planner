import { db } from "@/lib/db";
import {
  recipes,
  recipeIngredients,
  recipeSteps,
  recipeEquipment,
  taggings,
  tags,
} from "@/lib/db/schema";
import { and, asc, desc, eq, exists, ilike, inArray, sql } from "drizzle-orm";
import type { InferSelectModel, SQL } from "drizzle-orm";
import { escapeLike } from "@/lib/utils";

export type Recipe = InferSelectModel<typeof recipes>;
export type RecipeIngredient = InferSelectModel<typeof recipeIngredients>;
export type RecipeStep = InferSelectModel<typeof recipeSteps>;
export type RecipeEquipment = InferSelectModel<typeof recipeEquipment>;

export type RecipeTag = { id: string; name: string; color: string | null };

export type RecipeListItem = Recipe & { tags: RecipeTag[] };

export type RecipesFilters = { search?: string; tagId?: string };

export async function getRecipes(
  userId: string,
  filters: RecipesFilters = {},
): Promise<RecipeListItem[]> {
  const search = filters.search?.trim() ?? "";
  const tagId = filters.tagId;

  const conditions: SQL[] = [eq(recipes.userId, userId)];
  if (search) {
    conditions.push(ilike(recipes.title, `%${escapeLike(search)}%`));
  }
  if (tagId) {
    conditions.push(
      exists(
        db
          .select({ one: sql`1` })
          .from(taggings)
          .where(
            and(
              eq(taggings.taggableId, recipes.id),
              eq(taggings.taggableType, "recipe"),
              eq(taggings.tagId, tagId),
            ),
          ),
      ),
    );
  }

  const filtered = await db
    .select()
    .from(recipes)
    .where(and(...conditions))
    .orderBy(desc(recipes.updatedAt));

  const recipeIds = filtered.map((r) => r.id);
  const taggingRows = recipeIds.length
    ? await db
        .select({
          taggableId: taggings.taggableId,
          tagId: tags.id,
          tagName: tags.name,
          tagColor: tags.color,
        })
        .from(taggings)
        .innerJoin(tags, eq(taggings.tagId, tags.id))
        .where(
          and(
            eq(taggings.taggableType, "recipe"),
            inArray(taggings.taggableId, recipeIds),
            eq(tags.userId, userId),
          ),
        )
    : [];

  const tagsByRecipe = new Map<string, RecipeTag[]>();
  for (const t of taggingRows) {
    const list = tagsByRecipe.get(t.taggableId) ?? [];
    list.push({ id: t.tagId, name: t.tagName, color: t.tagColor });
    tagsByRecipe.set(t.taggableId, list);
  }

  return filtered.map((r) => ({
    ...r,
    tags: tagsByRecipe.get(r.id) ?? [],
  }));
}

export type RecipeDetail = Recipe & {
  ingredients: RecipeIngredient[];
  steps: RecipeStep[];
  equipment: RecipeEquipment[];
  tags: RecipeTag[];
};

export async function getRecipeById(
  userId: string,
  id: string,
): Promise<RecipeDetail | null> {
  const [recipe] = await db
    .select()
    .from(recipes)
    .where(and(eq(recipes.id, id), eq(recipes.userId, userId)));

  if (!recipe) return null;

  const [ingredients, steps, equipment, tagRows] = await Promise.all([
    db
      .select()
      .from(recipeIngredients)
      .where(eq(recipeIngredients.recipeId, id))
      .orderBy(asc(recipeIngredients.sortOrder)),
    db
      .select()
      .from(recipeSteps)
      .where(eq(recipeSteps.recipeId, id))
      .orderBy(asc(recipeSteps.sortOrder)),
    db
      .select()
      .from(recipeEquipment)
      .where(eq(recipeEquipment.recipeId, id))
      .orderBy(asc(recipeEquipment.sortOrder)),
    db
      .select({ id: tags.id, name: tags.name, color: tags.color })
      .from(taggings)
      .innerJoin(tags, eq(taggings.tagId, tags.id))
      .where(
        and(
          eq(taggings.taggableType, "recipe"),
          eq(taggings.taggableId, id),
          eq(tags.userId, userId),
        ),
      ),
  ]);

  return {
    ...recipe,
    ingredients,
    steps,
    equipment,
    tags: tagRows,
  };
}

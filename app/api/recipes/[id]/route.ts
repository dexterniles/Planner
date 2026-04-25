import { db } from "@/lib/db";
import {
  recipes,
  recipeIngredients,
  recipeSteps,
  recipeEquipment,
  taggings,
  tags,
  SINGLE_USER_ID,
} from "@/lib/db/schema";
import { updateRecipeSchema } from "@/lib/validations/recipe";
import { and, asc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { requireAuthGuard } from "@/lib/auth/require-auth";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const __guard = await requireAuthGuard();
  if (__guard) return __guard;
  const { id } = await params;

  const [recipe] = await db
    .select()
    .from(recipes)
    .where(and(eq(recipes.id, id), eq(recipes.userId, SINGLE_USER_ID)));

  if (!recipe) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

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
      .select({
        id: tags.id,
        name: tags.name,
        color: tags.color,
      })
      .from(taggings)
      .innerJoin(tags, eq(taggings.tagId, tags.id))
      .where(
        and(
          eq(taggings.taggableType, "recipe"),
          eq(taggings.taggableId, id),
          eq(tags.userId, SINGLE_USER_ID),
        ),
      ),
  ]);

  return NextResponse.json({
    ...recipe,
    ingredients,
    steps,
    equipment,
    tags: tagRows,
  });
}

export async function PATCH(request: Request, { params }: Params) {
  const __guard = await requireAuthGuard();
  if (__guard) return __guard;
  const { id } = await params;
  const body = await request.json();
  const parsed = updateRecipeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const [updated] = await db
    .update(recipes)
    .set(parsed.data)
    .where(and(eq(recipes.id, id), eq(recipes.userId, SINGLE_USER_ID)))
    .returning();

  if (!updated) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(updated);
}

export async function DELETE(_request: Request, { params }: Params) {
  const __guard = await requireAuthGuard();
  if (__guard) return __guard;
  const { id } = await params;

  // Cascade-delete via FK handles ingredients/steps/equipment.
  // Manually clear taggings rows since they're polymorphic.
  await db
    .delete(taggings)
    .where(
      and(eq(taggings.taggableType, "recipe"), eq(taggings.taggableId, id)),
    );

  const [deleted] = await db
    .delete(recipes)
    .where(and(eq(recipes.id, id), eq(recipes.userId, SINGLE_USER_ID)))
    .returning();

  if (!deleted) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}

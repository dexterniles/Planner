import { db } from "@/lib/db";
import { recipes } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";

export async function userOwnsRecipe(
  recipeId: string,
  userId: string,
): Promise<boolean> {
  const [row] = await db
    .select({ id: recipes.id })
    .from(recipes)
    .where(and(eq(recipes.id, recipeId), eq(recipes.userId, userId)));
  return !!row;
}

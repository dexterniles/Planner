import { db } from "@/lib/db";
import { recipes, SINGLE_USER_ID } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";

/**
 * Verify a recipe exists and belongs to the single user. Returns true if owned,
 * false otherwise. Use after the auth guard to prevent leaking child rows
 * across user scopes (defense-in-depth).
 */
export async function userOwnsRecipe(recipeId: string): Promise<boolean> {
  const [row] = await db
    .select({ id: recipes.id })
    .from(recipes)
    .where(and(eq(recipes.id, recipeId), eq(recipes.userId, SINGLE_USER_ID)));
  return !!row;
}

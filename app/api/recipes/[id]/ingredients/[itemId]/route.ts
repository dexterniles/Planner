import { db } from "@/lib/db";
import { recipeIngredients } from "@/lib/db/schema";
import { updateIngredientSchema } from "@/lib/validations/recipe";
import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { requireAuthGuard } from "@/lib/auth/require-auth";
import { userOwnsRecipe } from "@/lib/auth/recipe-ownership";

type Params = { params: Promise<{ id: string; itemId: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const auth = await requireAuthGuard(request);
  if (!auth.ok) return auth.response;
  const { userId } = auth;
  const { id, itemId } = await params;
  if (!(await userOwnsRecipe(id, userId))) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await request.json();
  const parsed = updateIngredientSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const updateData: Record<string, unknown> = { ...parsed.data };
  if ("quantity" in parsed.data) {
    updateData.quantity =
      parsed.data.quantity != null ? parsed.data.quantity.toString() : null;
  }

  const [updated] = await db
    .update(recipeIngredients)
    .set(updateData)
    .where(
      and(
        eq(recipeIngredients.id, itemId),
        eq(recipeIngredients.recipeId, id),
      ),
    )
    .returning();

  if (!updated) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(updated);
}

export async function DELETE(request: Request, { params }: Params) {
  const auth = await requireAuthGuard(request);
  if (!auth.ok) return auth.response;
  const { userId } = auth;
  const { id, itemId } = await params;
  if (!(await userOwnsRecipe(id, userId))) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const [deleted] = await db
    .delete(recipeIngredients)
    .where(
      and(
        eq(recipeIngredients.id, itemId),
        eq(recipeIngredients.recipeId, id),
      ),
    )
    .returning();

  if (!deleted) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}

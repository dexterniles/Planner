import { db } from "@/lib/db";
import { recipeSteps } from "@/lib/db/schema";
import { updateStepSchema } from "@/lib/validations/recipe";
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
  const parsed = updateStepSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const [updated] = await db
    .update(recipeSteps)
    .set(parsed.data)
    .where(and(eq(recipeSteps.id, itemId), eq(recipeSteps.recipeId, id)))
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
    .delete(recipeSteps)
    .where(and(eq(recipeSteps.id, itemId), eq(recipeSteps.recipeId, id)))
    .returning();

  if (!deleted) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}

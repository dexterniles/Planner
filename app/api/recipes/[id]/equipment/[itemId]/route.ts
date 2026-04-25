import { db } from "@/lib/db";
import { recipeEquipment } from "@/lib/db/schema";
import { updateEquipmentSchema } from "@/lib/validations/recipe";
import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { requireAuthGuard } from "@/lib/auth/require-auth";
import { userOwnsRecipe } from "@/lib/auth/recipe-ownership";

type Params = { params: Promise<{ id: string; itemId: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const __guard = await requireAuthGuard();
  if (__guard) return __guard;
  const { id, itemId } = await params;
  if (!(await userOwnsRecipe(id))) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const body = await request.json();
  const parsed = updateEquipmentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const [updated] = await db
    .update(recipeEquipment)
    .set(parsed.data)
    .where(
      and(eq(recipeEquipment.id, itemId), eq(recipeEquipment.recipeId, id)),
    )
    .returning();

  if (!updated) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(updated);
}

export async function DELETE(_request: Request, { params }: Params) {
  const __guard = await requireAuthGuard();
  if (__guard) return __guard;
  const { id, itemId } = await params;
  if (!(await userOwnsRecipe(id))) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const [deleted] = await db
    .delete(recipeEquipment)
    .where(
      and(eq(recipeEquipment.id, itemId), eq(recipeEquipment.recipeId, id)),
    )
    .returning();

  if (!deleted) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}

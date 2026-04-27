import { db } from "@/lib/db";
import { recipeIngredients } from "@/lib/db/schema";
import { ingredientInputSchema } from "@/lib/validations/recipe";
import { asc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { requireAuthGuard } from "@/lib/auth/require-auth";
import { userOwnsRecipe } from "@/lib/auth/recipe-ownership";

type Params = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: Params) {
  const auth = await requireAuthGuard(request);
  if (!auth.ok) return auth.response;
  const { userId } = auth;
  const { id } = await params;
  if (!(await userOwnsRecipe(id, userId))) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const rows = await db
    .select()
    .from(recipeIngredients)
    .where(eq(recipeIngredients.recipeId, id))
    .orderBy(asc(recipeIngredients.sortOrder));

  return NextResponse.json(rows);
}

export async function POST(request: Request, { params }: Params) {
  const auth = await requireAuthGuard(request);
  if (!auth.ok) return auth.response;
  const { userId } = auth;
  const { id } = await params;
  if (!(await userOwnsRecipe(id, userId))) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await request.json();
  const parsed = ingredientInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { quantity, ...rest } = parsed.data;
  const [row] = await db
    .insert(recipeIngredients)
    .values({
      recipeId: id,
      ...rest,
      quantity: quantity != null ? quantity.toString() : null,
    })
    .returning();
  return NextResponse.json(row, { status: 201 });
}

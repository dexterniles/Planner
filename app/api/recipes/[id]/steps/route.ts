import { db } from "@/lib/db";
import { recipeSteps } from "@/lib/db/schema";
import { stepInputSchema } from "@/lib/validations/recipe";
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
    .from(recipeSteps)
    .where(eq(recipeSteps.recipeId, id))
    .orderBy(asc(recipeSteps.sortOrder));
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
  const parsed = stepInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const [row] = await db
    .insert(recipeSteps)
    .values({ recipeId: id, ...parsed.data })
    .returning();
  return NextResponse.json(row, { status: 201 });
}

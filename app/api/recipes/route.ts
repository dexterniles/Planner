import { db } from "@/lib/db";
import { recipes } from "@/lib/db/schema";
import { createRecipeSchema } from "@/lib/validations/recipe";
import { NextResponse } from "next/server";
import { requireAuthGuard } from "@/lib/auth/require-auth";
import { getRecipes } from "@/lib/server/data/recipes";

export async function GET(request: Request) {
  const auth = await requireAuthGuard(request);
  if (!auth.ok) return auth.response;
  const { userId } = auth;
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("q")?.trim() ?? "";
  const tagId = searchParams.get("tagId");

  const result = await getRecipes(userId, {
    search,
    tagId: tagId ?? undefined,
  });
  return NextResponse.json(result);
}

export async function POST(request: Request) {
  const auth = await requireAuthGuard(request);
  if (!auth.ok) return auth.response;
  const { userId } = auth;
  const body = await request.json();
  const parsed = createRecipeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const [recipe] = await db
    .insert(recipes)
    .values({
      ...parsed.data,
      userId,
    })
    .returning();

  return NextResponse.json(recipe, { status: 201 });
}

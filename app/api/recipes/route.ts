import { db } from "@/lib/db";
import { recipes, taggings, tags } from "@/lib/db/schema";
import { createRecipeSchema } from "@/lib/validations/recipe";
import { and, desc, eq, inArray } from "drizzle-orm";
import { NextResponse } from "next/server";
import { requireAuthGuard } from "@/lib/auth/require-auth";

export async function GET(request: Request) {
  const auth = await requireAuthGuard(request);
  if (!auth.ok) return auth.response;
  const { userId } = auth;
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("q")?.trim().toLowerCase() ?? "";
  const tagId = searchParams.get("tagId");

  const rows = await db
    .select()
    .from(recipes)
    .where(eq(recipes.userId, userId))
    .orderBy(desc(recipes.updatedAt));

  let filtered = rows;
  if (search) {
    filtered = filtered.filter((r) => r.title.toLowerCase().includes(search));
  }

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

  const tagsByRecipe = new Map<
    string,
    { id: string; name: string; color: string | null }[]
  >();
  for (const t of taggingRows) {
    const list = tagsByRecipe.get(t.taggableId) ?? [];
    list.push({ id: t.tagId, name: t.tagName, color: t.tagColor });
    tagsByRecipe.set(t.taggableId, list);
  }

  let result = filtered.map((r) => ({
    ...r,
    tags: tagsByRecipe.get(r.id) ?? [],
  }));

  if (tagId) {
    result = result.filter((r) => r.tags.some((t) => t.id === tagId));
  }

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

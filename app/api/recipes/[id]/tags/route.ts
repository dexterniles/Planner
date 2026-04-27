import { db } from "@/lib/db";
import { taggings, tags } from "@/lib/db/schema";
import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { requireAuthGuard } from "@/lib/auth/require-auth";
import { userOwnsRecipe } from "@/lib/auth/recipe-ownership";

type Params = { params: Promise<{ id: string }> };

const attachTagSchema = z.object({
  tagId: z.string().uuid(),
});

export async function GET(request: Request, { params }: Params) {
  const auth = await requireAuthGuard(request);
  if (!auth.ok) return auth.response;
  const { userId } = auth;
  const { id } = await params;
  if (!(await userOwnsRecipe(id, userId))) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const rows = await db
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
        eq(tags.userId, userId),
      ),
    );

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
  const parsed = attachTagSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const [tag] = await db
    .select({ id: tags.id })
    .from(tags)
    .where(and(eq(tags.id, parsed.data.tagId), eq(tags.userId, userId)));
  if (!tag) {
    return NextResponse.json({ error: "Tag not found" }, { status: 404 });
  }

  const [existing] = await db
    .select()
    .from(taggings)
    .where(
      and(
        eq(taggings.taggableType, "recipe"),
        eq(taggings.taggableId, id),
        eq(taggings.tagId, parsed.data.tagId),
      ),
    );
  if (existing) {
    return NextResponse.json(existing);
  }

  const [row] = await db
    .insert(taggings)
    .values({
      taggableType: "recipe",
      taggableId: id,
      tagId: parsed.data.tagId,
    })
    .returning();
  return NextResponse.json(row, { status: 201 });
}

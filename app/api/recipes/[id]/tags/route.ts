import { db } from "@/lib/db";
import { taggings, tags, SINGLE_USER_ID } from "@/lib/db/schema";
import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { requireAuthGuard } from "@/lib/auth/require-auth";
import { userOwnsRecipe } from "@/lib/auth/recipe-ownership";

type Params = { params: Promise<{ id: string }> };

const attachTagSchema = z.object({
  tagId: z.string().uuid(),
});

export async function GET(_request: Request, { params }: Params) {
  const __guard = await requireAuthGuard();
  if (__guard) return __guard;
  const { id } = await params;
  if (!(await userOwnsRecipe(id))) {
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
        eq(tags.userId, SINGLE_USER_ID),
      ),
    );

  return NextResponse.json(rows);
}

export async function POST(request: Request, { params }: Params) {
  const __guard = await requireAuthGuard();
  if (__guard) return __guard;
  const { id } = await params;
  if (!(await userOwnsRecipe(id))) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await request.json();
  const parsed = attachTagSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  // Verify the tag belongs to the user.
  const [tag] = await db
    .select({ id: tags.id })
    .from(tags)
    .where(and(eq(tags.id, parsed.data.tagId), eq(tags.userId, SINGLE_USER_ID)));
  if (!tag) {
    return NextResponse.json({ error: "Tag not found" }, { status: 404 });
  }

  // No-op if already attached.
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

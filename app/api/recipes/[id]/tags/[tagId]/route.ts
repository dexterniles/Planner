import { db } from "@/lib/db";
import { taggings } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { requireAuthGuard } from "@/lib/auth/require-auth";
import { userOwnsRecipe } from "@/lib/auth/recipe-ownership";

type Params = { params: Promise<{ id: string; tagId: string }> };

export async function DELETE(_request: Request, { params }: Params) {
  const __guard = await requireAuthGuard();
  if (__guard) return __guard;
  const { id, tagId } = await params;
  if (!(await userOwnsRecipe(id))) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await db
    .delete(taggings)
    .where(
      and(
        eq(taggings.taggableType, "recipe"),
        eq(taggings.taggableId, id),
        eq(taggings.tagId, tagId),
      ),
    );

  return NextResponse.json({ success: true });
}

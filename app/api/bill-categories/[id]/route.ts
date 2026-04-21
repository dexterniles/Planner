import { db } from "@/lib/db";
import { billCategories, SINGLE_USER_ID } from "@/lib/db/schema";
import { updateBillCategorySchema } from "@/lib/validations/bill";
import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const { id } = await params;
  const body = await request.json();
  const parsed = updateBillCategorySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const [updated] = await db
    .update(billCategories)
    .set(parsed.data)
    .where(
      and(
        eq(billCategories.id, id),
        eq(billCategories.userId, SINGLE_USER_ID),
      ),
    )
    .returning();

  if (!updated) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(updated);
}

export async function DELETE(_request: Request, { params }: Params) {
  const { id } = await params;
  const [deleted] = await db
    .delete(billCategories)
    .where(
      and(
        eq(billCategories.id, id),
        eq(billCategories.userId, SINGLE_USER_ID),
      ),
    )
    .returning();

  if (!deleted) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}

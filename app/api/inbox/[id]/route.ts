import { db } from "@/lib/db";
import { inboxItems } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const { id } = await params;
  const body = await request.json();

  const [updated] = await db
    .update(inboxItems)
    .set({
      triagedAt: body.triagedAt ? new Date(body.triagedAt) : null,
      resultingItemType: body.resultingItemType ?? null,
      resultingItemId: body.resultingItemId ?? null,
    })
    .where(eq(inboxItems.id, id))
    .returning();

  if (!updated) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(updated);
}

export async function DELETE(_request: Request, { params }: Params) {
  const { id } = await params;
  const [deleted] = await db
    .delete(inboxItems)
    .where(eq(inboxItems.id, id))
    .returning();

  if (!deleted) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}

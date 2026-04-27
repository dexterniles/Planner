import { db } from "@/lib/db";
import { inboxItems } from "@/lib/db/schema";
import { triageInboxSchema } from "@/lib/validations/inbox";
import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { requireAuthGuard } from "@/lib/auth/require-auth";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const auth = await requireAuthGuard(request);
  if (!auth.ok) return auth.response;
  const { userId } = auth;
  const { id } = await params;
  const body = await request.json();
  const parsed = triageInboxSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const data = parsed.data;

  const [updated] = await db
    .update(inboxItems)
    .set({
      triagedAt: data.triagedAt ? new Date(data.triagedAt) : null,
      resultingItemType: data.resultingItemType ?? null,
      resultingItemId: data.resultingItemId ?? null,
    })
    .where(and(eq(inboxItems.id, id), eq(inboxItems.userId, userId)))
    .returning();

  if (!updated) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(updated);
}

export async function DELETE(request: Request, { params }: Params) {
  const auth = await requireAuthGuard(request);
  if (!auth.ok) return auth.response;
  const { userId } = auth;
  const { id } = await params;
  const [deleted] = await db
    .delete(inboxItems)
    .where(and(eq(inboxItems.id, id), eq(inboxItems.userId, userId)))
    .returning();

  if (!deleted) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}

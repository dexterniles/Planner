import { db } from "@/lib/db";
import { mediaItems, SINGLE_USER_ID } from "@/lib/db/schema";
import { updateMediaSchema } from "@/lib/validations/media";
import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { id } = await params;
  const [row] = await db
    .select()
    .from(mediaItems)
    .where(and(eq(mediaItems.id, id), eq(mediaItems.userId, SINGLE_USER_ID)));
  if (!row) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(row);
}

export async function PATCH(request: Request, { params }: Params) {
  const { id } = await params;
  const body = await request.json();
  const parsed = updateMediaSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const updates: Record<string, unknown> = {};
  if (parsed.data.status !== undefined) {
    updates.status = parsed.data.status;
    // Auto-stamp watchedAt when transitioning to watched, clear if leaving.
    if (parsed.data.status === "watched") {
      updates.watchedAt = new Date();
    } else {
      updates.watchedAt = null;
    }
  }
  if (parsed.data.rating !== undefined) {
    updates.rating =
      parsed.data.rating === null ? null : parsed.data.rating.toFixed(1);
  }
  if (parsed.data.notes !== undefined) {
    updates.notes = parsed.data.notes;
  }
  // Allow explicit override of watchedAt if provided alongside status.
  if (parsed.data.watchedAt !== undefined) {
    updates.watchedAt = parsed.data.watchedAt
      ? new Date(parsed.data.watchedAt)
      : null;
  }

  const [updated] = await db
    .update(mediaItems)
    .set(updates)
    .where(and(eq(mediaItems.id, id), eq(mediaItems.userId, SINGLE_USER_ID)))
    .returning();

  if (!updated) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(updated);
}

export async function DELETE(_request: Request, { params }: Params) {
  const { id } = await params;
  const [deleted] = await db
    .delete(mediaItems)
    .where(and(eq(mediaItems.id, id), eq(mediaItems.userId, SINGLE_USER_ID)))
    .returning();
  if (!deleted) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}

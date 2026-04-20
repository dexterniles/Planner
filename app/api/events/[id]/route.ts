import { db } from "@/lib/db";
import { events, SINGLE_USER_ID } from "@/lib/db/schema";
import { updateEventSchema } from "@/lib/validations/event";
import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  const { id } = await params;
  const [event] = await db
    .select()
    .from(events)
    .where(and(eq(events.id, id), eq(events.userId, SINGLE_USER_ID)));

  if (!event) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(event);
}

export async function PATCH(request: Request, { params }: Params) {
  const { id } = await params;
  const body = await request.json();
  const parsed = updateEventSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { startsAt, endsAt, ...rest } = parsed.data;

  const updateData: Record<string, unknown> = { ...rest };
  if (startsAt !== undefined) {
    updateData.startsAt = new Date(startsAt);
  }
  if (endsAt !== undefined) {
    updateData.endsAt = endsAt ? new Date(endsAt) : null;
  }

  const [updated] = await db
    .update(events)
    .set(updateData)
    .where(and(eq(events.id, id), eq(events.userId, SINGLE_USER_ID)))
    .returning();

  if (!updated) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(updated);
}

export async function DELETE(_request: Request, { params }: Params) {
  const { id } = await params;
  const [deleted] = await db
    .delete(events)
    .where(and(eq(events.id, id), eq(events.userId, SINGLE_USER_ID)))
    .returning();

  if (!deleted) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}

import { db } from "@/lib/db";
import { eventCategories } from "@/lib/db/schema";
import { createEventCategorySchema } from "@/lib/validations/event";
import { NextResponse } from "next/server";
import { requireAuthGuard } from "@/lib/auth/require-auth";
import { getEventCategories } from "@/lib/server/data/events";

export async function GET(request: Request) {
  const auth = await requireAuthGuard(request);
  if (!auth.ok) return auth.response;
  const result = await getEventCategories(auth.userId);
  return NextResponse.json(result);
}

export async function POST(request: Request) {
  const auth = await requireAuthGuard(request);
  if (!auth.ok) return auth.response;
  const { userId } = auth;
  const body = await request.json();
  const parsed = createEventCategorySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const [cat] = await db
      .insert(eventCategories)
      .values({
        ...parsed.data,
        userId,
      })
      .returning();
    return NextResponse.json(cat, { status: 201 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "";
    if (msg.includes("unique") || msg.includes("duplicate")) {
      return NextResponse.json(
        { error: "A category with this name already exists" },
        { status: 409 },
      );
    }
    throw err;
  }
}

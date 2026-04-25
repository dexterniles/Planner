import { db } from "@/lib/db";
import { eventCategories, SINGLE_USER_ID } from "@/lib/db/schema";
import { createEventCategorySchema } from "@/lib/validations/event";
import { asc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { requireAuthGuard } from "@/lib/auth/require-auth";

export async function GET() {
  const __guard = await requireAuthGuard();
  if (__guard) return __guard;
  const result = await db
    .select()
    .from(eventCategories)
    .where(eq(eventCategories.userId, SINGLE_USER_ID))
    .orderBy(asc(eventCategories.sortOrder), asc(eventCategories.name));

  return NextResponse.json(result);
}

export async function POST(request: Request) {
  const __guard = await requireAuthGuard();
  if (__guard) return __guard;
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
        userId: SINGLE_USER_ID,
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

import { db } from "@/lib/db";
import { tags } from "@/lib/db/schema";
import { createTagSchema } from "@/lib/validations/tag";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { requireAuthGuard } from "@/lib/auth/require-auth";

export async function GET(request: Request) {
  const auth = await requireAuthGuard(request);
  if (!auth.ok) return auth.response;
  const { userId } = auth;
  const result = await db
    .select()
    .from(tags)
    .where(eq(tags.userId, userId))
    .orderBy(tags.name);

  return NextResponse.json(result);
}

export async function POST(request: Request) {
  const auth = await requireAuthGuard(request);
  if (!auth.ok) return auth.response;
  const { userId } = auth;
  const body = await request.json();
  const parsed = createTagSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const [tag] = await db
      .insert(tags)
      .values({ ...parsed.data, userId })
      .returning();
    return NextResponse.json(tag, { status: 201 });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "";
    if (msg.includes("unique") || msg.includes("duplicate")) {
      return NextResponse.json(
        { error: "A tag with this name already exists" },
        { status: 409 },
      );
    }
    throw error;
  }
}

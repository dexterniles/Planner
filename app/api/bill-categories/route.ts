import { db } from "@/lib/db";
import { billCategories, SINGLE_USER_ID } from "@/lib/db/schema";
import { createBillCategorySchema } from "@/lib/validations/bill";
import { asc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET() {
  const result = await db
    .select()
    .from(billCategories)
    .where(eq(billCategories.userId, SINGLE_USER_ID))
    .orderBy(asc(billCategories.sortOrder), asc(billCategories.name));

  return NextResponse.json(result);
}

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = createBillCategorySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const [cat] = await db
      .insert(billCategories)
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

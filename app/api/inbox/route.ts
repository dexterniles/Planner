import { db } from "@/lib/db";
import { inboxItems, SINGLE_USER_ID } from "@/lib/db/schema";
import { createInboxItemSchema } from "@/lib/validations/inbox";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { requireAuthGuard } from "@/lib/auth/require-auth";

export async function GET() {
  const __guard = await requireAuthGuard();
  if (__guard) return __guard;
  const result = await db
    .select()
    .from(inboxItems)
    .where(
      eq(inboxItems.userId, SINGLE_USER_ID),
    )
    .orderBy(inboxItems.capturedAt);

  return NextResponse.json(result);
}

export async function POST(request: Request) {
  const __guard = await requireAuthGuard();
  if (__guard) return __guard;
  const body = await request.json();
  const parsed = createInboxItemSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const [item] = await db
    .insert(inboxItems)
    .values({
      content: parsed.data.content,
      userId: SINGLE_USER_ID,
    })
    .returning();

  return NextResponse.json(item, { status: 201 });
}

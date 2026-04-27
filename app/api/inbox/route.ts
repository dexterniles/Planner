import { db } from "@/lib/db";
import { inboxItems } from "@/lib/db/schema";
import { createInboxItemSchema } from "@/lib/validations/inbox";
import { NextResponse } from "next/server";
import { requireAuthGuard } from "@/lib/auth/require-auth";
import { getInbox } from "@/lib/server/data/inbox";

export async function GET(request: Request) {
  const auth = await requireAuthGuard(request);
  if (!auth.ok) return auth.response;
  const result = await getInbox(auth.userId);
  return NextResponse.json(result);
}

export async function POST(request: Request) {
  const auth = await requireAuthGuard(request);
  if (!auth.ok) return auth.response;
  const { userId } = auth;
  const body = await request.json();
  const parsed = createInboxItemSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const [item] = await db
    .insert(inboxItems)
    .values({
      content: parsed.data.content,
      userId,
    })
    .returning();

  return NextResponse.json(item, { status: 201 });
}

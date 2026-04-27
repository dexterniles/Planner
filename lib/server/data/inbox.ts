import { db } from "@/lib/db";
import { inboxItems } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import type { InferSelectModel } from "drizzle-orm";

export type InboxItem = InferSelectModel<typeof inboxItems>;

export async function getInbox(userId: string): Promise<InboxItem[]> {
  return db
    .select()
    .from(inboxItems)
    .where(eq(inboxItems.userId, userId))
    .orderBy(inboxItems.capturedAt);
}

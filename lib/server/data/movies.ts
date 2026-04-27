import { db } from "@/lib/db";
import { mediaItems } from "@/lib/db/schema";
import { and, desc, eq } from "drizzle-orm";
import type { InferSelectModel } from "drizzle-orm";
import type { MediaStatus, MediaType } from "@/lib/validations/media";

export type MediaItem = InferSelectModel<typeof mediaItems>;

export type MediaListFilters = {
  status?: MediaStatus | null;
  mediaType?: MediaType | null;
};

export async function getMediaList(
  userId: string,
  filters: MediaListFilters = {},
): Promise<MediaItem[]> {
  const { status, mediaType } = filters;
  const conditions = [eq(mediaItems.userId, userId)];
  if (status === "watchlist" || status === "watching" || status === "watched") {
    conditions.push(eq(mediaItems.status, status));
  }
  if (mediaType === "movie" || mediaType === "tv") {
    conditions.push(eq(mediaItems.mediaType, mediaType));
  }

  return db
    .select()
    .from(mediaItems)
    .where(and(...conditions))
    .orderBy(desc(mediaItems.createdAt));
}

export async function getMediaById(
  userId: string,
  id: string,
): Promise<MediaItem | null> {
  const [row] = await db
    .select()
    .from(mediaItems)
    .where(and(eq(mediaItems.id, id), eq(mediaItems.userId, userId)));
  return row ?? null;
}

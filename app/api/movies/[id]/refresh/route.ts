import { db } from "@/lib/db";
import { mediaItems, SINGLE_USER_ID } from "@/lib/db/schema";
import { tmdbBuildAddPayload } from "@/lib/tmdb/client";
import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

type Params = { params: Promise<{ id: string }> };

/**
 * Re-fetch this title from TMDB and update the snapshot fields. User-set
 * fields (status, rating, watchedAt, notes) are preserved.
 */
export async function POST(_request: Request, { params }: Params) {
  const { id } = await params;
  const [existing] = await db
    .select()
    .from(mediaItems)
    .where(and(eq(mediaItems.id, id), eq(mediaItems.userId, SINGLE_USER_ID)));
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let payload;
  try {
    payload = await tmdbBuildAddPayload(existing.mediaType, existing.tmdbId);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "TMDB lookup failed" },
      { status: 502 },
    );
  }

  const [updated] = await db
    .update(mediaItems)
    .set({
      title: payload.title,
      imdbId: payload.imdbId,
      posterPath: payload.posterPath,
      backdropPath: payload.backdropPath,
      overview: payload.overview,
      releaseYear: payload.releaseYear,
      runtime: payload.runtime,
      genres: payload.genres,
    })
    .where(and(eq(mediaItems.id, id), eq(mediaItems.userId, SINGLE_USER_ID)))
    .returning();

  return NextResponse.json(updated);
}

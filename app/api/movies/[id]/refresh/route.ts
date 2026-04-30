import { db } from "@/lib/db";
import { mediaItems } from "@/lib/db/schema";
import { tmdbBuildAddPayload } from "@/lib/tmdb/client";
import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { requireAuthGuard } from "@/lib/auth/require-auth";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  const auth = await requireAuthGuard(request);
  if (!auth.ok) return auth.response;
  const { userId } = auth;
  const { id } = await params;
  const [existing] = await db
    .select()
    .from(mediaItems)
    .where(and(eq(mediaItems.id, id), eq(mediaItems.userId, userId)));
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
      metadata: payload.metadata,
    })
    .where(and(eq(mediaItems.id, id), eq(mediaItems.userId, userId)))
    .returning();

  return NextResponse.json(updated);
}

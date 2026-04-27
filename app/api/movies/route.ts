import { db } from "@/lib/db";
import { mediaItems } from "@/lib/db/schema";
import { requireAuthGuard } from "@/lib/auth/require-auth";
import {
  addMediaSchema,
  type MediaStatus,
  type MediaType,
} from "@/lib/validations/media";
import { tmdbBuildAddPayload } from "@/lib/tmdb/client";
import { and, desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const auth = await requireAuthGuard(request);
  if (!auth.ok) return auth.response;
  const { userId } = auth;
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") as MediaStatus | null;
  const mediaType = searchParams.get("mediaType") as MediaType | null;

  const conditions = [eq(mediaItems.userId, userId)];
  if (status === "watchlist" || status === "watching" || status === "watched") {
    conditions.push(eq(mediaItems.status, status));
  }
  if (mediaType === "movie" || mediaType === "tv") {
    conditions.push(eq(mediaItems.mediaType, mediaType));
  }

  const rows = await db
    .select()
    .from(mediaItems)
    .where(and(...conditions))
    .orderBy(desc(mediaItems.createdAt));

  return NextResponse.json(rows);
}

export async function POST(request: Request) {
  const auth = await requireAuthGuard(request);
  if (!auth.ok) return auth.response;
  const { userId } = auth;
  const body = await request.json();
  const parsed = addMediaSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { mediaType, tmdbId, status } = parsed.data;

  let payload;
  try {
    payload = await tmdbBuildAddPayload(mediaType, tmdbId);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "TMDB lookup failed" },
      { status: 502 },
    );
  }

  const [existing] = await db
    .select()
    .from(mediaItems)
    .where(
      and(
        eq(mediaItems.userId, userId),
        eq(mediaItems.mediaType, mediaType),
        eq(mediaItems.tmdbId, tmdbId),
      ),
    );
  if (existing) {
    return NextResponse.json(existing, { status: 200 });
  }

  const [inserted] = await db
    .insert(mediaItems)
    .values({
      userId,
      mediaType: payload.mediaType,
      tmdbId: payload.tmdbId,
      imdbId: payload.imdbId,
      title: payload.title,
      posterPath: payload.posterPath,
      backdropPath: payload.backdropPath,
      overview: payload.overview,
      releaseYear: payload.releaseYear,
      runtime: payload.runtime,
      genres: payload.genres,
      status: status ?? "watchlist",
    })
    .returning();

  return NextResponse.json(inserted, { status: 201 });
}

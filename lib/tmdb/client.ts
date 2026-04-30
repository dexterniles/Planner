/**
 * Thin server-side wrapper around the TMDB API. The token is held only on
 * the server; client code talks to our /api/movies/* routes which proxy.
 *
 * Uses TMDB v3 endpoints with v4 Read Access Token Bearer auth — same paths
 * as the v3 API, but the auth model is the modern one.
 */

import type { MediaMetadata } from "@/lib/db/schema";

const TMDB_BASE = "https://api.themoviedb.org/3";

function authHeader(): { Authorization: string } {
  const token = process.env.TMDB_API_KEY;
  if (!token) {
    throw new Error(
      "TMDB_API_KEY is not configured. Add it to .env.local.",
    );
  }
  return { Authorization: `Bearer ${token}` };
}

async function tmdbFetch<T>(path: string, params?: Record<string, string>): Promise<T> {
  const url = new URL(TMDB_BASE + path);
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      url.searchParams.set(k, v);
    }
  }
  const res = await fetch(url.toString(), {
    headers: {
      ...authHeader(),
      accept: "application/json",
    },
    // TMDB rarely changes by the second; cache briefly to be polite.
    next: { revalidate: 60 },
  });
  if (!res.ok) {
    throw new Error(`TMDB ${path} → ${res.status} ${res.statusText}`);
  }
  return (await res.json()) as T;
}

// ─── Types (subset of TMDB responses we use) ───────────────────────────────

export type TmdbMediaType = "movie" | "tv";

export interface TmdbSearchResult {
  id: number;
  media_type: "movie" | "tv" | "person";
  title?: string; // movie
  name?: string; // tv
  release_date?: string; // movie, "YYYY-MM-DD"
  first_air_date?: string; // tv
  poster_path: string | null;
  backdrop_path: string | null;
  overview: string;
  vote_average: number;
}

export interface TmdbSearchResponse {
  page: number;
  results: TmdbSearchResult[];
  total_results: number;
}

export interface TmdbGenre {
  id: number;
  name: string;
}

export interface TmdbCastMember {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
  order?: number;
}

export interface TmdbCrewMember {
  id: number;
  name: string;
  job: string;
  department?: string;
}

export interface TmdbCredits {
  cast?: TmdbCastMember[];
  crew?: TmdbCrewMember[];
}

export interface TmdbCreatedBy {
  id: number;
  name: string;
}

export interface TmdbMovieDetails {
  id: number;
  imdb_id: string | null;
  title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string | null;
  runtime: number | null;
  genres: TmdbGenre[];
  tagline: string | null;
  original_language: string | null;
  credits?: TmdbCredits;
}

export interface TmdbTvDetails {
  id: number;
  name: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  first_air_date: string | null;
  number_of_seasons: number | null;
  number_of_episodes: number | null;
  genres: TmdbGenre[];
  tagline: string | null;
  original_language: string | null;
  created_by?: TmdbCreatedBy[];
  credits?: TmdbCredits;
}

export interface TmdbExternalIds {
  imdb_id: string | null;
  tvdb_id: number | null;
}

// ─── API surface ───────────────────────────────────────────────────────────

export async function tmdbSearchMulti(query: string): Promise<TmdbSearchResponse> {
  return tmdbFetch<TmdbSearchResponse>("/search/multi", {
    query,
    include_adult: "false",
  });
}

export async function tmdbMovie(id: number): Promise<TmdbMovieDetails> {
  return tmdbFetch<TmdbMovieDetails>(`/movie/${id}`, {
    append_to_response: "credits",
  });
}

export async function tmdbTv(id: number): Promise<TmdbTvDetails> {
  return tmdbFetch<TmdbTvDetails>(`/tv/${id}`, {
    append_to_response: "credits",
  });
}

export async function tmdbExternalIds(
  mediaType: TmdbMediaType,
  id: number,
): Promise<TmdbExternalIds> {
  return tmdbFetch<TmdbExternalIds>(`/${mediaType}/${id}/external_ids`);
}

// ─── Shape helper for adding to library ────────────────────────────────────

export interface TmdbAddPayload {
  mediaType: TmdbMediaType;
  tmdbId: number;
  imdbId: string | null;
  title: string;
  posterPath: string | null;
  backdropPath: string | null;
  overview: string | null;
  releaseYear: number | null;
  /** Minutes for movies, season count for TV. */
  runtime: number | null;
  genres: string[];
  metadata: MediaMetadata;
}

function extractMetadata(
  details: TmdbMovieDetails | TmdbTvDetails,
  mediaType: TmdbMediaType,
): MediaMetadata {
  const crew = details.credits?.crew ?? [];
  const cast = details.credits?.cast ?? [];

  const director =
    mediaType === "movie"
      ? (crew.find((c) => c.job === "Director")?.name ?? null)
      : null;

  const createdBy =
    mediaType === "tv"
      ? ((details as TmdbTvDetails).created_by?.map((c) => c.name) ?? null)
      : null;

  const composer =
    crew.find((c) => c.job === "Original Music Composer")?.name ??
    crew.find((c) => c.job === "Music")?.name ??
    null;

  const topCast = cast.slice(0, 5).map((c) => ({
    name: c.name,
    character: c.character,
    profilePath: c.profile_path ?? null,
  }));

  const taglineRaw = details.tagline?.trim() ?? "";
  const tagline = taglineRaw.length > 0 ? taglineRaw : null;

  const episodeCount =
    mediaType === "tv"
      ? ((details as TmdbTvDetails).number_of_episodes ?? null)
      : null;

  const originalLanguage = details.original_language ?? null;

  return {
    director,
    createdBy,
    composer,
    cast: topCast,
    tagline,
    episodeCount,
    originalLanguage,
  };
}

/**
 * Fetches full details for a TMDB title and folds them into the shape we
 * persist in `media_items`. Used by POST /api/movies.
 */
export async function tmdbBuildAddPayload(
  mediaType: TmdbMediaType,
  tmdbId: number,
): Promise<TmdbAddPayload> {
  if (mediaType === "movie") {
    const [details, ext] = await Promise.all([
      tmdbMovie(tmdbId),
      tmdbExternalIds("movie", tmdbId),
    ]);
    const yr = details.release_date
      ? Number(details.release_date.slice(0, 4))
      : null;
    return {
      mediaType: "movie",
      tmdbId,
      imdbId: ext.imdb_id ?? details.imdb_id ?? null,
      title: details.title,
      posterPath: details.poster_path,
      backdropPath: details.backdrop_path,
      overview: details.overview || null,
      releaseYear: Number.isFinite(yr) ? yr : null,
      runtime: details.runtime ?? null,
      genres: details.genres.map((g) => g.name),
      metadata: extractMetadata(details, "movie"),
    };
  }
  const [details, ext] = await Promise.all([
    tmdbTv(tmdbId),
    tmdbExternalIds("tv", tmdbId),
  ]);
  const yr = details.first_air_date
    ? Number(details.first_air_date.slice(0, 4))
    : null;
  return {
    mediaType: "tv",
    tmdbId,
    imdbId: ext.imdb_id,
    title: details.name,
    posterPath: details.poster_path,
    backdropPath: details.backdrop_path,
    overview: details.overview || null,
    releaseYear: Number.isFinite(yr) ? yr : null,
    runtime: details.number_of_seasons ?? null,
    genres: details.genres.map((g) => g.name),
    metadata: extractMetadata(details, "tv"),
  };
}

/** Build a TMDB image URL. */
export function tmdbImage(
  path: string | null,
  size: "w92" | "w154" | "w185" | "w342" | "w500" | "w780" | "original" = "w342",
): string | null {
  if (!path) return null;
  return `https://image.tmdb.org/t/p/${size}${path}`;
}

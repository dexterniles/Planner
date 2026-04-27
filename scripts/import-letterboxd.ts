/**
 * One-shot import of a Letterboxd export into the media_items table.
 *
 * Usage:
 *   npx tsx scripts/import-letterboxd.ts <path-to-letterboxd-export-directory>
 *
 * Reads ratings.csv, watched.csv, watchlist.csv from the directory.
 * For each row, looks up TMDB by title + year, snapshots metadata, and
 * inserts into media_items. Idempotent — re-runs skip duplicates via the
 * unique (userId, mediaType, tmdbId) index.
 */

import { config as loadEnv } from "dotenv";
import fs from "node:fs";
import path from "node:path";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { and, eq } from "drizzle-orm";
import { mediaItems } from "../lib/db/schema";

// Next.js convention: secrets live in .env.local; fall back to .env.
loadEnv({ path: ".env.local" });
loadEnv({ path: ".env" });

const TMDB_BASE = "https://api.themoviedb.org/3";

interface CsvRow {
  Date?: string;
  Name: string;
  Year?: string;
  Rating?: string;
  "Letterboxd URI"?: string;
}

interface TmdbSearchResult {
  id: number;
  media_type?: string;
  title?: string;
  release_date?: string;
  poster_path: string | null;
  backdrop_path: string | null;
  overview: string;
  popularity: number;
}

interface TmdbMovieDetails {
  id: number;
  imdb_id: string | null;
  title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string | null;
  runtime: number | null;
  genres: Array<{ id: number; name: string }>;
}

const TMDB_TOKEN = process.env.TMDB_API_KEY;
const DB_URL = process.env.DATABASE_URL;
const SEED_USER_ID = process.env.SEED_USER_ID;

if (!TMDB_TOKEN) {
  console.error("TMDB_API_KEY missing in env");
  process.exit(1);
}
if (!DB_URL) {
  console.error("DATABASE_URL missing in env");
  process.exit(1);
}
if (!SEED_USER_ID) {
  console.error(
    "SEED_USER_ID missing in env — set it to the Supabase auth UUID of the user to import for",
  );
  process.exit(1);
}

async function tmdb<T>(pathname: string, params?: Record<string, string>): Promise<T> {
  const url = new URL(TMDB_BASE + pathname);
  if (params) {
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  }
  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${TMDB_TOKEN}`, accept: "application/json" },
  });
  if (!res.ok) throw new Error(`TMDB ${pathname} → ${res.status} ${res.statusText}`);
  return (await res.json()) as T;
}

async function findMatch(name: string, year: string | undefined): Promise<TmdbSearchResult | null> {
  // Use /search/movie with year hint when present — far more accurate than /search/multi.
  const params: Record<string, string> = { query: name, include_adult: "false" };
  if (year) params.year = year;
  const data = await tmdb<{ results: TmdbSearchResult[] }>("/search/movie", params);
  if (data.results.length === 0) return null;

  // Prefer the result whose release year matches; tolerance ±1.
  if (year) {
    const target = Number(year);
    const matched = data.results.find((r) => {
      if (!r.release_date) return false;
      const rYear = Number(r.release_date.slice(0, 4));
      return Math.abs(rYear - target) <= 1;
    });
    if (matched) return matched;
  }
  // Fall back to the most popular result.
  return data.results[0];
}

async function fetchDetails(tmdbId: number): Promise<TmdbMovieDetails> {
  return tmdb<TmdbMovieDetails>(`/movie/${tmdbId}`, { append_to_response: "external_ids" });
}

interface ParsedRow {
  name: string;
  year?: string;
  rating?: number;
  watchedDate?: string;
}

function parseCsv(filePath: string): CsvRow[] {
  if (!fs.existsSync(filePath)) return [];
  const text = fs.readFileSync(filePath, "utf-8");
  const lines = text.split(/\r?\n/).filter((l) => l.length > 0);
  if (lines.length === 0) return [];
  const headers = parseCsvLine(lines[0]);
  return lines.slice(1).map((line) => {
    const cols = parseCsvLine(line);
    const row: Record<string, string> = {};
    headers.forEach((h, i) => {
      row[h] = cols[i] ?? "";
    });
    return row as unknown as CsvRow;
  });
}

function parseCsvLine(line: string): string[] {
  // Letterboxd CSVs may contain commas inside quoted titles. Handle quoted fields.
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (inQuotes) {
      if (c === '"' && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else if (c === '"') {
        inQuotes = false;
      } else {
        cur += c;
      }
    } else {
      if (c === '"') inQuotes = true;
      else if (c === ",") {
        out.push(cur);
        cur = "";
      } else {
        cur += c;
      }
    }
  }
  out.push(cur);
  return out;
}

interface ImportSummary {
  inserted: number;
  skipped: number;
  unmatched: string[];
}

async function importGroup(
  rows: ParsedRow[],
  status: "watched" | "watchlist",
  db: ReturnType<typeof drizzle>,
): Promise<ImportSummary> {
  const summary: ImportSummary = { inserted: 0, skipped: 0, unmatched: [] };

  for (const [i, row] of rows.entries()) {
    const label = `${row.name}${row.year ? ` (${row.year})` : ""}`;
    process.stdout.write(`  [${i + 1}/${rows.length}] ${label} … `);

    let match: TmdbSearchResult | null;
    try {
      match = await findMatch(row.name, row.year);
    } catch (err) {
      console.log(`search error: ${err instanceof Error ? err.message : err}`);
      summary.unmatched.push(label);
      continue;
    }
    if (!match) {
      console.log("no match");
      summary.unmatched.push(label);
      continue;
    }

    // Skip if already in library.
    const [existing] = await db
      .select()
      .from(mediaItems)
      .where(
        and(
          eq(mediaItems.userId, SEED_USER_ID!),
          eq(mediaItems.mediaType, "movie"),
          eq(mediaItems.tmdbId, match.id),
        ),
      );
    if (existing) {
      console.log(`already in library`);
      summary.skipped++;
      continue;
    }

    let details: TmdbMovieDetails;
    try {
      details = await fetchDetails(match.id);
    } catch (err) {
      console.log(`details error: ${err instanceof Error ? err.message : err}`);
      summary.unmatched.push(label);
      continue;
    }

    const yr = details.release_date ? Number(details.release_date.slice(0, 4)) : null;
    const watchedAt =
      status === "watched" && row.watchedDate
        ? new Date(`${row.watchedDate}T12:00:00`)
        : status === "watched"
          ? new Date()
          : null;

    await db.insert(mediaItems).values({
      userId: SEED_USER_ID!,
      mediaType: "movie",
      tmdbId: match.id,
      imdbId: details.imdb_id,
      title: details.title,
      posterPath: details.poster_path,
      backdropPath: details.backdrop_path,
      overview: details.overview || null,
      releaseYear: Number.isFinite(yr) ? yr : null,
      runtime: details.runtime ?? null,
      genres: details.genres.map((g) => g.name),
      status,
      rating: row.rating != null ? row.rating.toFixed(1) : null,
      watchedAt,
    });
    summary.inserted++;
    console.log(`✓ ${details.title}${yr ? ` (${yr})` : ""}`);
  }

  return summary;
}

async function main() {
  const exportDir = process.argv[2];
  if (!exportDir) {
    console.error("Usage: tsx scripts/import-letterboxd.ts <export-directory>");
    process.exit(1);
  }
  if (!fs.existsSync(exportDir)) {
    console.error(`Directory not found: ${exportDir}`);
    process.exit(1);
  }

  const ratingsPath = path.join(exportDir, "ratings.csv");
  const watchedPath = path.join(exportDir, "watched.csv");
  const watchlistPath = path.join(exportDir, "watchlist.csv");

  const ratingRows: ParsedRow[] = parseCsv(ratingsPath).map((r) => ({
    name: r.Name,
    year: r.Year,
    rating: r.Rating ? Number(r.Rating) : undefined,
    watchedDate: r.Date,
  }));

  // watched.csv — keep only entries not already covered by ratings.csv.
  const ratedKeys = new Set(
    ratingRows.map((r) => `${r.name.toLowerCase()}::${r.year ?? ""}`),
  );
  const unratedWatched: ParsedRow[] = parseCsv(watchedPath)
    .map((r) => ({ name: r.Name, year: r.Year, watchedDate: r.Date }))
    .filter(
      (r) => !ratedKeys.has(`${r.name.toLowerCase()}::${r.year ?? ""}`),
    );

  const watchlistRows: ParsedRow[] = parseCsv(watchlistPath).map((r) => ({
    name: r.Name,
    year: r.Year,
  }));

  const client = postgres(DB_URL!, { prepare: false });
  const db = drizzle(client);

  console.log(`\n→ ratings.csv: ${ratingRows.length} rows (status=watched, with rating)`);
  const ratingSummary = await importGroup(ratingRows, "watched", db);

  if (unratedWatched.length > 0) {
    console.log(`\n→ watched.csv (extras): ${unratedWatched.length} rows (status=watched, no rating)`);
    const watchedSummary = await importGroup(unratedWatched, "watched", db);
    ratingSummary.inserted += watchedSummary.inserted;
    ratingSummary.skipped += watchedSummary.skipped;
    ratingSummary.unmatched.push(...watchedSummary.unmatched);
  }

  console.log(`\n→ watchlist.csv: ${watchlistRows.length} rows (status=watchlist)`);
  const watchlistSummary = await importGroup(watchlistRows, "watchlist", db);

  console.log("\n─── Summary ──────────────────────────");
  console.log(`Watched / rated:  ${ratingSummary.inserted} inserted, ${ratingSummary.skipped} already in library`);
  console.log(`Watchlist:        ${watchlistSummary.inserted} inserted, ${watchlistSummary.skipped} already in library`);
  const allUnmatched = [...ratingSummary.unmatched, ...watchlistSummary.unmatched];
  if (allUnmatched.length > 0) {
    console.log(`\nUnmatched (${allUnmatched.length}) — search by hand on the Movies page:`);
    for (const t of allUnmatched) console.log(`  · ${t}`);
  } else {
    console.log("\nNo unmatched titles. ✓");
  }

  await client.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

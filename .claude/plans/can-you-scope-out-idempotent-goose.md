# Richer Movie / TV Show Detail Page

## Context

The detail page at `/movies/[id]` currently surfaces title, year, runtime, genres, poster/backdrop, status, rating, overview, and notes. The user wants more context per title — director (or showrunner for TV), composer, top 5 cast members, plus tagline, episode count for TV, and original language — without making the page dense. The new fields exist in TMDB but aren't currently captured to the DB or fetched at render time.

The refactored stack already provides clean seams: a single TMDB client (`lib/tmdb/client.ts`), a single payload-mapping function (`tmdbBuildAddPayload`) used by both the add and refresh flows, and a single server data fetcher (`getMediaById`) used by the RSC prefetch. Adding new metadata cleanly threads through these.

## Approach

**Persist metadata in a single JSONB column.** Add a nullable `metadata` column to `media_items` holding the new fields. Cast is naturally array-shaped; director, composer, tagline, etc. tag along in the same blob. Future fields don't require schema migrations.

Why JSONB over typed columns: none of the new fields are filtered / sorted on (no need for indexes), and cast is already JSON-shaped. The existing `genres` field demonstrates the JSONB pattern in this table.

**Populate via the existing add + refresh flows.** TMDB calls switch to `?append_to_response=credits`, which combines details + credits in a single round-trip. The mapping function extracts the new fields and emits a `metadata` field in the payload. Existing items get backfilled on user-triggered "Refresh metadata" — no mass-refresh script needed.

**UI layout** preserves current density:
- Hero: tagline appears under title (small, muted, italic). Episode count merges into the existing `runtime` line for TV (`"X seasons · Y episodes"`). Original language as a small chip in the metadata row, only when ≠ English.
- New "Credits" section between Overview and Notes:
  - Director (movie) / Created by (TV) and Composer rendered as compact two-column key-value rows.
  - Top 5 cast as photo cards (square poster + name + character) in a horizontal flex row with overflow-scroll on mobile.

## Files

### Schema + migration
- `lib/db/schema.ts` — add `metadata: jsonb("metadata")` (nullable) to the `mediaItems` table definition. Define and export a `MediaMetadata` TypeScript shape next to the table.
- `lib/db/migrations/0010_media_items_metadata.sql` — hand-authored, follows the precedent of `0009_drop_recurrence_owner_add_indexes.sql` and the journal-only update (auto-generation is blocked by pre-existing snapshot drift). Single statement: `ALTER TABLE "media_items" ADD COLUMN IF NOT EXISTS "metadata" jsonb;`
- `lib/db/migrations/meta/_journal.json` — append the 0010 entry.

### TMDB client
- `lib/tmdb/client.ts`:
  - `tmdbFetchMovieDetails` and `tmdbFetchTvDetails` switch to `?append_to_response=credits`.
  - Extend the response types to include `credits.cast[]`, `credits.crew[]`, `tagline`, `original_language`, `created_by` (TV), `number_of_episodes` (TV).
  - Add an `extractMetadata(details)` helper that returns the `MediaMetadata` shape.
  - Update `tmdbBuildAddPayload` to include `metadata: extractMetadata(...)` in its return.

### API routes
- `app/api/movies/route.ts` (POST) — include `metadata` in the insert.
- `app/api/movies/[id]/refresh/route.ts` — include `metadata` in the update so existing items get backfilled when the user clicks "Refresh metadata."

### Server fetcher
- `lib/server/data/movies.ts` — no change. `getMediaById` already returns the full row; the new column rides through automatically.

### Client types
- `lib/hooks/use-movies.ts` — extend the `MediaItem` interface to include `metadata: MediaMetadata | null`. Re-export `MediaMetadata` if importing the shape from `lib/db/schema.ts` is awkward (cleaner to define the shape in `lib/validations/media.ts` and import both client + server, but the existing code defines `MediaItem` inline in the hook — keep the precedent).

### UI
- `components/movies/movie-detail-page.tsx`:
  - **Hero** (around lines 200-250): tagline rendered under the H1 (small, italic, muted). Episode count merges into the runtime label for TV. Original-language chip in the metadata row when not English.
  - **New Credits section** between Overview and Notes:
    - Two-column compact list for Director/Created by + Composer.
    - Cast photo-card row using `next/image` with `https://image.tmdb.org/t/p/w185${profilePath}` as the source. Card layout: square 64×64 (avatar) or portrait 64×96 (poster-style) — pick based on TMDB profile aspect (it's portrait); use 64×96 to match. Centered name + character below. 5 cards, flex row, `overflow-x-auto` on small screens.
  - Render guards: skip the Credits section entirely if `metadata` is null (existing items pre-refresh) — show a "Refresh metadata to load cast and credits" hint inline. Skip individual sub-rows if their field is empty.

## Reused functions / utilities

- `tmdbBuildAddPayload` ([lib/tmdb/client.ts:142](lib/tmdb/client.ts#L142)) — already the single mapping seam used by both add and refresh routes. Extending it propagates the new fields to both flows.
- `next/image` with the existing `image.tmdb.org` `remotePatterns` and 30-day `minimumCacheTTL` (next.config.ts) covers the new cast profile image URLs without config changes.
- Existing `Intl.DisplayNames` API (browser-native, no deps) converts the TMDB `original_language` ISO-639-1 code (e.g. `"ja"`) to a readable name (`"Japanese"`).
- `getMediaById` and the `useMedia(id)` hook flow through unchanged — TanStack hydration carries the new column transparently.

## Verification

End-to-end:
1. Run the new migration: `npm run db:migrate`. Confirm the `metadata` column exists via the live DB query.
2. `npx tsc --noEmit` clean, `npm run lint` zero warnings, `npm run build` succeeds.
3. **Add path:** Add a new movie via the search palette. Confirm the detail page shows tagline, director, composer, and 5 cast cards with photos.
4. **TV path:** Add a TV show. Confirm "Created by" replaces Director, episode count appears next to season count, cast cards render.
5. **Refresh path:** Open an existing pre-migration title, click "Refresh metadata" from the dropdown. Confirm credits populate without overwriting status/rating/notes.
6. **Edge cases:** title with no tagline (section omits cleanly), title with English `original_language` (chip omitted), title with fewer than 5 cast members (renders what's available), title with no profile photos for cast (fallback to person-icon avatar).

## Out of scope

- Production companies / networks chip strip (user opted out).
- Mass-refresh-all-existing-items action — per-item refresh on existing items is sufficient.
- Episode-by-episode metadata, cast filmography, deeper credit roles (cinematographer, screenplay, etc.) — keep the page from getting dense.
- Migrating the existing `genres` column into the new `metadata` JSONB — keep it as a separate column for now (it's already nullable JSONB, and the consumers expect it at top-level).

"use client";

import { useMemo } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { Film, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/layout/page-header";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MovieTile } from "@/components/movies/movie-tile";
import {
  MovieFiltersPopover,
  type MovieFiltersPatch,
} from "@/components/movies/movie-filters-popover";
import { useSearchPalette } from "@/components/layout/search-palette-context";
import {
  SavedViewsButton,
  SavedViewsStrip,
} from "@/components/layout/saved-views";
import { useMediaList, type MediaItem } from "@/lib/hooks/use-movies";
import type { MediaStatus, MediaType } from "@/lib/validations/media";
import { cn } from "@/lib/utils";

const STATUS_TABS: Array<{ value: MediaStatus | "all"; label: string }> = [
  { value: "all", label: "All" },
  { value: "watchlist", label: "Watchlist" },
  { value: "watching", label: "Watching" },
  { value: "watched", label: "Watched" },
];

const TYPE_TABS: Array<{ value: MediaType | "all"; label: string }> = [
  { value: "all", label: "Both" },
  { value: "movie", label: "Movies" },
  { value: "tv", label: "TV" },
];

type SortKey =
  | "recent"
  | "rating_desc"
  | "title"
  | "year_desc"
  | "watched_recent";

const SORT_OPTIONS: Array<{ value: SortKey; label: string }> = [
  { value: "recent", label: "Recently added" },
  { value: "rating_desc", label: "Rating · high to low" },
  { value: "title", label: "Title · A to Z" },
  { value: "year_desc", label: "Year · newest" },
  { value: "watched_recent", label: "Watched · newest" },
];

const SORT_VALUES = SORT_OPTIONS.map((o) => o.value);
const ALL_GENRES = "__all__";

function sortItems(items: MediaItem[], sortBy: SortKey): MediaItem[] {
  const copy = [...items];
  switch (sortBy) {
    case "recent":
      return copy.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    case "rating_desc":
      return copy.sort((a, b) => {
        const ra = a.rating != null ? Number(a.rating) : -1;
        const rb = b.rating != null ? Number(b.rating) : -1;
        if (rb !== ra) return rb - ra;
        return a.title.localeCompare(b.title);
      });
    case "title":
      return copy.sort((a, b) => a.title.localeCompare(b.title));
    case "year_desc":
      return copy.sort(
        (a, b) => (b.releaseYear ?? 0) - (a.releaseYear ?? 0),
      );
    case "watched_recent":
      return copy.sort((a, b) => {
        const ta = a.watchedAt ? new Date(a.watchedAt).getTime() : 0;
        const tb = b.watchedAt ? new Date(b.watchedAt).getTime() : 0;
        return tb - ta;
      });
  }
}

export function MoviesPage() {
  const { setOpen: setSearchOpen } = useSearchPalette();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const rawStatus = searchParams.get("status");
  const statusFilter: MediaStatus | "all" =
    rawStatus === "watchlist" || rawStatus === "watching" || rawStatus === "watched"
      ? rawStatus
      : "all";
  const rawType = searchParams.get("type");
  const typeFilter: MediaType | "all" =
    rawType === "movie" || rawType === "tv" ? rawType : "all";
  const rawSort = searchParams.get("sort");
  const sortBy: SortKey = SORT_VALUES.includes(rawSort as SortKey)
    ? (rawSort as SortKey)
    : "recent";
  const genreFilter = searchParams.get("genre") ?? ALL_GENRES;
  const director = searchParams.get("director") || null;
  const composer = searchParams.get("composer") || null;
  const actor = searchParams.get("actor") || null;
  const yearMinRaw = searchParams.get("yearMin");
  const yearMaxRaw = searchParams.get("yearMax");
  const yearMin =
    yearMinRaw != null && Number.isFinite(parseInt(yearMinRaw, 10))
      ? parseInt(yearMinRaw, 10)
      : null;
  const yearMax =
    yearMaxRaw != null && Number.isFinite(parseInt(yearMaxRaw, 10))
      ? parseInt(yearMaxRaw, 10)
      : null;

  const writeParams = (patch: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams);
    for (const [key, value] of Object.entries(patch)) {
      if (value === null || value === "") {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    }
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  };

  const setParam = (key: string, value: string, defaultValue: string) => {
    writeParams({ [key]: value === defaultValue ? null : value });
  };

  const handleFiltersChange = (patch: MovieFiltersPatch) => {
    const next: Record<string, string | null> = {};
    if ("director" in patch) next.director = patch.director ?? null;
    if ("composer" in patch) next.composer = patch.composer ?? null;
    if ("actor" in patch) next.actor = patch.actor ?? null;
    if ("yearMin" in patch)
      next.yearMin = patch.yearMin == null ? null : String(patch.yearMin);
    if ("yearMax" in patch)
      next.yearMax = patch.yearMax == null ? null : String(patch.yearMax);
    writeParams(next);
  };

  const { data: items, isLoading } = useMediaList({
    status: statusFilter,
    mediaType: typeFilter,
  });

  const availableGenres = useMemo(() => {
    const set = new Set<string>();
    (items ?? []).forEach((item) => {
      (item.genres ?? []).forEach((g) => set.add(g));
    });
    return Array.from(set).sort();
  }, [items]);

  const facetDomains = useMemo(() => {
    const directors = new Set<string>();
    const composers = new Set<string>();
    const actors = new Set<string>();
    let yearLo: number | null = null;
    let yearHi: number | null = null;
    for (const item of items ?? []) {
      const meta = item.metadata;
      if (meta?.director) directors.add(meta.director);
      if (meta?.composer) composers.add(meta.composer);
      for (const c of meta?.cast ?? []) {
        if (c.name) actors.add(c.name);
      }
      if (item.releaseYear != null) {
        if (yearLo == null || item.releaseYear < yearLo) yearLo = item.releaseYear;
        if (yearHi == null || item.releaseYear > yearHi) yearHi = item.releaseYear;
      }
    }
    return {
      directors: Array.from(directors).sort(),
      composers: Array.from(composers).sort(),
      actors: Array.from(actors).sort(),
      yearBounds:
        yearLo != null && yearHi != null
          ? ([yearLo, yearHi] as const)
          : null,
    };
  }, [items]);

  const advancedActiveCount =
    (director ? 1 : 0) +
    (composer ? 1 : 0) +
    (actor ? 1 : 0) +
    (yearMin != null || yearMax != null ? 1 : 0);

  const visible = useMemo(() => {
    if (!items) return [];
    const filtered = items
      .filter(
        (item) =>
          genreFilter === ALL_GENRES ||
          (item.genres ?? []).includes(genreFilter),
      )
      .filter((item) => !director || item.metadata?.director === director)
      .filter((item) => !composer || item.metadata?.composer === composer)
      .filter(
        (item) =>
          !actor ||
          (item.metadata?.cast ?? []).some((c) => c.name === actor),
      )
      .filter((item) => {
        if (yearMin == null && yearMax == null) return true;
        if (item.releaseYear == null) return false;
        if (yearMin != null && item.releaseYear < yearMin) return false;
        if (yearMax != null && item.releaseYear > yearMax) return false;
        return true;
      });
    return sortItems(filtered, sortBy);
  }, [items, genreFilter, director, composer, actor, yearMin, yearMax, sortBy]);

  const yearChipLabel = (() => {
    if (yearMin != null && yearMax != null) {
      return yearMin === yearMax ? `${yearMin}` : `${yearMin}–${yearMax}`;
    }
    if (yearMin != null) return `${yearMin}+`;
    if (yearMax != null) return `–${yearMax}`;
    return null;
  })();

  return (
    <div>
      <PageHeader
        title="TV & Movies"
        actions={
          <Button onClick={() => setSearchOpen(true)}>
            <Plus className="mr-1.5 h-4 w-4" />
            Add
          </Button>
        }
      />

      {/* Filter row */}
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="inline-flex rounded-md border border-border bg-card p-[3px] shadow-sm gap-[2px]">
          {STATUS_TABS.map((t) => (
            <button
              key={t.value}
              onClick={() => setParam("status", t.value, "all")}
              className={cn(
                "px-3 py-1 text-[12.5px] font-medium rounded-[5px] transition-colors duration-150",
                statusFilter === t.value
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="inline-flex rounded-md border border-border bg-card p-[3px] shadow-sm gap-[2px]">
          {TYPE_TABS.map((t) => (
            <button
              key={t.value}
              onClick={() => setParam("type", t.value, "all")}
              className={cn(
                "px-3 py-1 text-[12.5px] font-medium rounded-[5px] transition-colors duration-150",
                typeFilter === t.value
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="ml-auto flex flex-wrap items-center gap-2">
          {availableGenres.length > 0 && (
            <Select
              value={genreFilter}
              onValueChange={(v) => setParam("genre", v ?? ALL_GENRES, ALL_GENRES)}
            >
              <SelectTrigger size="sm" className="flex-1 sm:flex-none sm:min-w-[140px]">
                <SelectValue>
                  {(value) =>
                    value === ALL_GENRES ? "All genres" : (value as string)
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_GENRES}>All genres</SelectItem>
                {availableGenres.map((g) => (
                  <SelectItem key={g} value={g}>
                    {g}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Select
            value={sortBy}
            onValueChange={(v) => setParam("sort", (v as SortKey) ?? "recent", "recent")}
          >
            <SelectTrigger size="sm" className="flex-1 sm:flex-none sm:min-w-[180px]">
              <SelectValue>
                {(value) =>
                  SORT_OPTIONS.find((o) => o.value === value)?.label ?? value
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <MovieFiltersPopover
            director={director}
            composer={composer}
            actor={actor}
            yearMin={yearMin}
            yearMax={yearMax}
            domains={facetDomains}
            onChange={handleFiltersChange}
            activeCount={advancedActiveCount}
          />
          <SavedViewsButton routeKey="movies" />
        </div>
      </div>

      <div className="empty:hidden mb-4">
        <SavedViewsStrip routeKey="movies" />
      </div>

      <div className="empty:hidden mb-4 flex flex-wrap gap-2">
        {director && (
          <FilterChip
            label="Director"
            value={director}
            onClear={() => handleFiltersChange({ director: null })}
          />
        )}
        {composer && (
          <FilterChip
            label="Composer"
            value={composer}
            onClear={() => handleFiltersChange({ composer: null })}
          />
        )}
        {actor && (
          <FilterChip
            label="Actor"
            value={actor}
            onClear={() => handleFiltersChange({ actor: null })}
          />
        )}
        {yearChipLabel && (
          <FilterChip
            label="Year"
            value={yearChipLabel}
            onClear={() =>
              handleFiltersChange({ yearMin: null, yearMax: null })
            }
          />
        )}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10">
          {Array.from({ length: 12 }).map((_, i) => (
            <Skeleton key={i} className="aspect-[2/3] w-full rounded-lg" />
          ))}
        </div>
      ) : !items || items.length === 0 ? (
        <div className="mt-12 flex flex-col items-center text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
            <Film className="h-6 w-6 text-primary" strokeWidth={1.75} />
          </div>
          <h3 className="font-serif text-[20px] font-medium leading-tight tracking-tight">
            Build your library
          </h3>
          <p className="mt-1 text-sm text-muted-foreground max-w-sm">
            Search TMDB to add movies and TV shows. Track what you&rsquo;ve
            watched, what&rsquo;s on the list, and how you felt about each one.
          </p>
          <Button className="mt-5" onClick={() => setSearchOpen(true)}>
            <Plus className="mr-1.5 h-4 w-4" />
            Search TMDB
          </Button>
        </div>
      ) : visible.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">
          No titles match the current filters.
        </p>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10">
            {visible.map((item) => (
              <MovieTile key={item.id} item={item} />
            ))}
          </div>
          <p className="mt-8 text-[10px] text-muted-foreground/60 text-center">
            Powered by{" "}
            <a
              href="https://www.themoviedb.org/"
              target="_blank"
              rel="noopener noreferrer"
              className="underline-offset-2 hover:underline"
            >
              TMDB
            </a>
          </p>
        </>
      )}

    </div>
  );
}

function FilterChip({
  label,
  value,
  onClear,
}: {
  label: string;
  value: string;
  onClear: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClear}
      aria-label={`Clear ${label} filter`}
      className="inline-flex items-center gap-1.5 rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs font-medium text-primary shadow-sm transition-all hover:bg-primary/15 hover:border-primary/60"
    >
      <X className="h-3 w-3 shrink-0" />
      <span className="text-muted-foreground">{label}:</span>
      <span className="max-w-[180px] truncate text-foreground">{value}</span>
    </button>
  );
}

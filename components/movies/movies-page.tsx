"use client";

import { useMemo, useState } from "react";
import { Film, Plus } from "lucide-react";
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
import { useSearchPalette } from "@/components/layout/search-palette-context";
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
  const [statusFilter, setStatusFilter] = useState<MediaStatus | "all">("all");
  const [typeFilter, setTypeFilter] = useState<MediaType | "all">("all");
  const [sortBy, setSortBy] = useState<SortKey>("recent");
  const [genreFilter, setGenreFilter] = useState<string>(ALL_GENRES);

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

  const visible = useMemo(() => {
    if (!items) return [];
    const filtered =
      genreFilter === ALL_GENRES
        ? items
        : items.filter((item) => (item.genres ?? []).includes(genreFilter));
    return sortItems(filtered, sortBy);
  }, [items, genreFilter, sortBy]);

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
              onClick={() => setStatusFilter(t.value)}
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
              onClick={() => setTypeFilter(t.value)}
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
            <Select value={genreFilter} onValueChange={(v) => setGenreFilter(v ?? ALL_GENRES)}>
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
          <Select value={sortBy} onValueChange={(v) => setSortBy((v as SortKey) ?? "recent")}>
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
        </div>
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

"use client";

import { use, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ExternalLink,
  Film,
  MoreHorizontal,
  RefreshCcw,
  Trash2,
  Tv,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { RatingStars } from "@/components/ui/rating-stars";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  useDeleteMedia,
  useMedia,
  useRefreshMedia,
  useUpdateMedia,
} from "@/lib/hooks/use-movies";
import type { MediaStatus } from "@/lib/validations/media";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const STATUS_OPTIONS: Array<{ value: MediaStatus; label: string }> = [
  { value: "watchlist", label: "Watchlist" },
  { value: "watching", label: "Watching" },
  { value: "watched", label: "Watched" },
];

function formatRuntime(
  runtime: number | null,
  mediaType: "movie" | "tv",
): string | null {
  if (runtime == null) return null;
  if (mediaType === "movie") {
    if (runtime < 60) return `${runtime} min`;
    const h = Math.floor(runtime / 60);
    const m = runtime % 60;
    return m === 0 ? `${h}h` : `${h}h ${m}m`;
  }
  return runtime === 1 ? "1 season" : `${runtime} seasons`;
}

export default function MovieDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { data: item, isLoading } = useMedia(id);
  const updateMedia = useUpdateMedia();
  const deleteMedia = useDeleteMedia();
  const refreshMedia = useRefreshMedia();

  const handleRefresh = async () => {
    try {
      await refreshMedia.mutateAsync(id);
      toast.success("Metadata refreshed");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Refresh failed");
    }
  };

  // Local notes state with debounced save-on-change.
  const [notes, setNotes] = useState("");
  const initialNotesRef = useRef<string | null>(null);
  useEffect(() => {
    if (item && initialNotesRef.current === null) {
      const seed = item.notes ?? "";
      setNotes(seed);
      initialNotesRef.current = seed;
    }
  }, [item]);

  const saveNotes = async () => {
    if (!item) return;
    const trimmed = notes.trim();
    if (trimmed === (item.notes ?? "").trim()) return;
    try {
      await updateMedia.mutateAsync({
        id,
        data: { notes: trimmed || null },
      });
    } catch {
      toast.error("Failed to save notes");
    }
  };

  const handleStatusChange = async (status: MediaStatus) => {
    if (!item || item.status === status) return;
    try {
      await updateMedia.mutateAsync({ id, data: { status } });
    } catch {
      toast.error("Failed to update status");
    }
  };

  const handleRatingChange = async (rating: number | null) => {
    if (!item) return;
    try {
      await updateMedia.mutateAsync({ id, data: { rating } });
    } catch {
      toast.error("Failed to update rating");
    }
  };

  const handleDelete = async () => {
    if (!item) return;
    if (!confirm(`Remove ${item.title} from your library?`)) return;
    try {
      await deleteMedia.mutateAsync(id);
      toast.success("Removed from library");
      router.push("/movies");
    } catch {
      toast.error("Failed to remove");
    }
  };

  if (isLoading) {
    return (
      <div>
        <Skeleton className="h-4 w-24 mb-4" />
        <Skeleton className="h-[280px] w-full rounded-xl" />
        <Skeleton className="h-12 w-full rounded-lg mt-4" />
        <Skeleton className="h-32 w-full rounded-lg mt-4" />
      </div>
    );
  }

  if (!item) {
    return (
      <div>
        <p className="text-muted-foreground">Title not found.</p>
        <Link href="/movies">
          <Button variant="outline" className="mt-4">
            Back to TV & Movies
          </Button>
        </Link>
      </div>
    );
  }

  const TypeIcon = item.mediaType === "tv" ? Tv : Film;
  const rating = item.rating != null ? Number(item.rating) : null;
  const runtimeLabel = formatRuntime(item.runtime, item.mediaType);
  const genres = (item.genres ?? []) as string[];
  const imdbUrl = item.imdbId
    ? `https://www.imdb.com/title/${item.imdbId}/`
    : null;
  const tmdbUrl = `https://www.themoviedb.org/${item.mediaType}/${item.tmdbId}`;

  return (
    <div>
      <Link
        href="/movies"
        className="mb-3 inline-flex items-center gap-1.5 text-[12.5px] text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.75} />
        TV & Movies
      </Link>

      {/* Hero */}
      <Card className="relative overflow-hidden p-0">
        <div className="relative h-[200px] w-full sm:h-[280px] md:h-[360px]">
          {item.backdropPath ? (
            <Image
              src={`https://image.tmdb.org/t/p/w1280${item.backdropPath}`}
              alt=""
              fill
              priority
              sizes="100vw"
              className="object-cover"
              unoptimized
            />
          ) : (
            <div
              className="h-full w-full"
              style={{ background: "var(--muted)" }}
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-card via-card/70 to-transparent" />
        </div>

        {/* Title block */}
        <div className="relative -mt-16 flex flex-col gap-4 p-5 sm:-mt-20 sm:flex-row sm:items-end sm:p-6">
          <div className="relative h-[150px] w-[100px] shrink-0 overflow-hidden rounded-lg shadow-lg ring-1 ring-border sm:h-[180px] sm:w-[120px]">
            {item.posterPath ? (
              <Image
                src={`https://image.tmdb.org/t/p/w342${item.posterPath}`}
                alt={item.title}
                fill
                sizes="(min-width: 640px) 120px, 100px"
                className="object-cover"
                unoptimized
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-muted">
                <TypeIcon
                  className="h-6 w-6 text-muted-foreground"
                  strokeWidth={1.5}
                />
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10.5px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
              {item.mediaType === "tv" ? "TV Show" : "Movie"}
            </p>
            <h1 className="mt-1 font-serif text-[26px] md:text-[32px] font-medium leading-tight tracking-tight">
              {item.title}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12.5px] text-muted-foreground">
              {item.releaseYear != null && (
                <span className="font-mono tabular-nums">{item.releaseYear}</span>
              )}
              {runtimeLabel && (
                <>
                  <span aria-hidden="true">·</span>
                  <span>{runtimeLabel}</span>
                </>
              )}
              {genres.length > 0 && (
                <>
                  <span aria-hidden="true">·</span>
                  <span>{genres.join(", ")}</span>
                </>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Action row */}
      <div className="mt-5 flex flex-wrap items-center gap-3">
        <div className="inline-flex rounded-md border border-border bg-card p-[3px] shadow-sm gap-[2px]">
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => handleStatusChange(opt.value)}
              disabled={updateMedia.isPending}
              className={cn(
                "px-3 py-1 text-[12.5px] font-medium rounded-[5px] transition-colors duration-150",
                item.status === opt.value
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <RatingStars
            value={rating}
            onChange={handleRatingChange}
            size={20}
          />
          {rating != null && (
            <span className="font-mono text-[11.5px] tabular-nums text-muted-foreground">
              {rating.toFixed(1)}
            </span>
          )}
        </div>

        <div className="ml-auto flex items-center gap-2">
          {imdbUrl && (
            <a
              href={imdbUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex"
            >
              <Button variant="outline" size="sm">
                <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                IMDB
              </Button>
            </a>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="ghost" size="icon-sm" aria-label="More actions" />
              }
            >
              <MoreHorizontal className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={handleRefresh}
                disabled={refreshMedia.isPending}
              >
                <RefreshCcw className="mr-1.5 h-3.5 w-3.5" />
                {refreshMedia.isPending ? "Refreshing…" : "Refresh metadata"}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() =>
                  window.open(tmdbUrl, "_blank", "noopener,noreferrer")
                }
              >
                <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                Open on TMDB
              </DropdownMenuItem>
              <DropdownMenuItem
                variant="destructive"
                onClick={handleDelete}
                disabled={deleteMedia.isPending}
              >
                <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                Remove from library
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Overview */}
      {item.overview && (
        <div className="mt-6">
          <p className="text-[10.5px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
            Overview
          </p>
          <p className="mt-2 font-serif text-[15px] leading-relaxed text-foreground/90">
            {item.overview}
          </p>
        </div>
      )}

      {/* Notes */}
      <div className="mt-6">
        <label
          htmlFor="notes"
          className="text-[10.5px] font-medium uppercase tracking-[0.12em] text-muted-foreground"
        >
          Notes
        </label>
        <textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          onBlur={saveNotes}
          placeholder="What did you think?"
          rows={4}
          className="mt-2 w-full resize-y rounded-md border border-input bg-card px-3 py-2 text-[14px] shadow-sm outline-none transition-[border-color,box-shadow] duration-150 ease-out placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
        />
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
    </div>
  );
}

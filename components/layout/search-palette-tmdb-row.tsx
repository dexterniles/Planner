"use client";

import Image from "next/image";
import { Film, Loader2, Plus, Tv } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export interface TmdbResult {
  tmdbId: number;
  mediaType: "movie" | "tv";
  title: string;
  year: number | null;
  posterPath: string | null;
  overview: string;
  localId: string | null;
  inLibrary: boolean;
}

interface SearchPaletteTmdbRowProps {
  result: TmdbResult;
  isSelected: boolean;
  isThisRowPending: boolean;
  isAnyAddPending: boolean;
  onAdd: () => void;
  onNavigateToLocal: () => void;
}

export function SearchPaletteTmdbRow({
  result,
  isSelected,
  isThisRowPending,
  isAnyAddPending,
  onAdd,
  onNavigateToLocal,
}: SearchPaletteTmdbRowProps) {
  const TypeIcon = result.mediaType === "tv" ? Tv : Film;

  const body = (
    <>
      <div className="relative h-[72px] w-12 shrink-0 overflow-hidden rounded bg-muted">
        {result.posterPath ? (
          <Image
            src={`https://image.tmdb.org/t/p/w92${result.posterPath}`}
            alt=""
            fill
            sizes="48px"
            className="object-cover"
            unoptimized
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
            <TypeIcon className="h-4 w-4" />
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <TypeIcon
            className="h-3 w-3 shrink-0 text-muted-foreground"
            strokeWidth={1.75}
          />
          <span className="text-[13px] font-medium leading-tight truncate">
            {result.title}
          </span>
          {result.year != null && (
            <span className="font-mono text-[11px] text-muted-foreground tabular-nums shrink-0">
              {result.year}
            </span>
          )}
        </div>
        {result.overview && (
          <p className="mt-1 text-[11.5px] text-muted-foreground line-clamp-2">
            {result.overview}
          </p>
        )}
      </div>
    </>
  );

  if (result.inLibrary) {
    return (
      <button
        type="button"
        onClick={onNavigateToLocal}
        aria-label={`Open ${result.title}`}
        className={`flex w-full items-start gap-3 rounded-md px-3 py-2.5 text-left transition-colors ${
          isSelected
            ? "bg-accent text-accent-foreground"
            : "hover:bg-accent/50"
        }`}
      >
        {body}
        <Badge
          variant="secondary"
          className="ml-2 self-center text-[10.5px] tracking-[0.02em]"
        >
          In library
        </Badge>
      </button>
    );
  }

  return (
    <div
      className={`flex w-full items-start gap-3 rounded-md px-3 py-2.5 text-left ${
        isSelected ? "bg-accent/60" : ""
      }`}
    >
      {body}
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={onAdd}
        disabled={isAnyAddPending && !isThisRowPending}
        aria-label={`Add ${result.title} to library`}
        className="ml-2 self-center"
        tabIndex={-1}
      >
        {isThisRowPending ? (
          <Loader2 className="h-3 w-3 animate-spin" data-icon="inline-start" />
        ) : (
          <Plus className="h-3 w-3" data-icon="inline-start" />
        )}
        Add
      </Button>
    </div>
  );
}

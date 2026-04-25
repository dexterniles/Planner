"use client";

import Image from "next/image";
import Link from "next/link";
import { Film, Tv } from "lucide-react";
import { RatingStars } from "@/components/ui/rating-stars";
import type { MediaItem } from "@/lib/hooks/use-movies";

interface MovieTileProps {
  item: MediaItem;
}

export function MovieTile({ item }: MovieTileProps) {
  const TypeIcon = item.mediaType === "tv" ? Tv : Film;
  const rating = item.rating != null ? Number(item.rating) : null;

  return (
    <Link
      href={`/movies/${item.id}`}
      className="group block focus:outline-none"
      aria-label={item.title}
    >
      <div className="relative aspect-[2/3] overflow-hidden rounded-lg bg-muted shadow-md transition-all group-hover:-translate-y-px group-hover:shadow-lg group-focus:ring-2 group-focus:ring-ring/40">
        {item.posterPath ? (
          <Image
            src={`https://image.tmdb.org/t/p/w342${item.posterPath}`}
            alt={item.title}
            fill
            sizes="(min-width: 1280px) 10vw, (min-width: 1024px) 12vw, (min-width: 768px) 17vw, (min-width: 640px) 25vw, 33vw"
            className="object-cover transition-transform duration-200 group-hover:scale-[1.03]"
            unoptimized
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 p-3 text-center text-muted-foreground">
            <TypeIcon className="h-6 w-6" strokeWidth={1.5} />
            <span className="text-[11px] font-medium leading-tight line-clamp-3">
              {item.title}
            </span>
          </div>
        )}

        {/* Status corner badge — only shown for non-watched items */}
        {item.status !== "watched" && (
          <span
            className="absolute right-1.5 top-1.5 inline-flex items-center gap-1 rounded-full bg-black/60 px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-[0.08em] text-white backdrop-blur-sm"
          >
            {item.status === "watching" ? "Watching" : "Watchlist"}
          </span>
        )}
      </div>
      <div className="mt-1 flex items-center justify-center">
        <RatingStars value={rating} readOnly size={11} />
      </div>
    </Link>
  );
}

"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Film, Search, Tv } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAddMedia, useTmdbSearch } from "@/lib/hooks/use-movies";
import { toast } from "sonner";

interface SearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function useDebounced<T>(value: T, delay = 250): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v;
}

export function SearchDialog({ open, onOpenChange }: SearchDialogProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounced(query, 250);
  const { data, isFetching } = useTmdbSearch(debouncedQuery);
  const addMedia = useAddMedia();

  // Reset query each time the dialog opens.
  useEffect(() => {
    if (open) setQuery("");
  }, [open]);

  const handlePick = async (
    tmdbId: number,
    mediaType: "movie" | "tv",
  ) => {
    try {
      const created = await addMedia.mutateAsync({ mediaType, tmdbId });
      toast.success("Added to library");
      onOpenChange(false);
      router.push(`/movies/${created.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add");
    }
  };

  const results = data?.results ?? [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Add a movie or TV show</DialogTitle>
        </DialogHeader>
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
            strokeWidth={1.75}
          />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search titles…"
            autoFocus
            className="pl-9"
          />
        </div>

        <div className="flex-1 overflow-y-auto -mx-1 px-1">
          {query.trim().length < 2 ? (
            <p className="py-6 text-center text-[13px] text-muted-foreground">
              Type at least 2 characters to search TMDB.
            </p>
          ) : isFetching && results.length === 0 ? (
            <p className="py-6 text-center text-[13px] text-muted-foreground">
              Searching…
            </p>
          ) : results.length === 0 ? (
            <p className="py-6 text-center text-[13px] text-muted-foreground">
              No matches.
            </p>
          ) : (
            <ul className="space-y-1">
              {results.map((r) => {
                const TypeIcon = r.mediaType === "tv" ? Tv : Film;
                return (
                  <li key={`${r.mediaType}-${r.tmdbId}`}>
                    <button
                      type="button"
                      onClick={() => handlePick(r.tmdbId, r.mediaType)}
                      disabled={addMedia.isPending}
                      className="group flex w-full items-start gap-3 rounded-md px-2 py-2 text-left transition-colors hover:bg-accent disabled:opacity-50"
                    >
                      <div className="relative h-[72px] w-12 shrink-0 overflow-hidden rounded bg-muted">
                        {r.posterPath ? (
                          <Image
                            src={`https://image.tmdb.org/t/p/w92${r.posterPath}`}
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
                            {r.title}
                          </span>
                          {r.year != null && (
                            <span className="font-mono text-[11px] text-muted-foreground tabular-nums shrink-0">
                              {r.year}
                            </span>
                          )}
                        </div>
                        {r.overview && (
                          <p className="mt-1 text-[11.5px] text-muted-foreground line-clamp-2">
                            {r.overview}
                          </p>
                        )}
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <p className="pt-2 text-[10px] text-muted-foreground/70 text-center">
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
      </DialogContent>
    </Dialog>
  );
}

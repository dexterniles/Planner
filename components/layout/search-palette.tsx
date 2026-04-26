"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { useSearchPalette } from "./search-palette-context";
import {
  SearchPaletteLocalRow,
  getLocalResultLink,
  localTypeOrder,
  typeLabels,
  type LocalSearchResult,
} from "./search-palette-local-row";
import {
  SearchPaletteTmdbRow,
  type TmdbResult,
} from "./search-palette-tmdb-row";
import { SearchPaletteGroupHeader } from "./search-palette-group-header";
import {
  useAddMedia,
  useMediaList,
  type SearchResultItem,
} from "@/lib/hooks/use-movies";

interface LocalGroup {
  type: string;
  label: string;
  rows: LocalSearchResult[];
}

interface SelectableEntry {
  kind: "local" | "tmdb";
  index: number;
}

export function SearchPalette() {
  const { open, setOpen } = useSearchPalette();
  const [query, setQuery] = useState("");
  const [localResults, setLocalResults] = useState<LocalSearchResult[]>([]);
  const [tmdbResults, setTmdbResults] = useState<SearchResultItem[]>([]);
  const [tmdbError, setTmdbError] = useState(false);
  const [localPending, setLocalPending] = useState(false);
  const [tmdbPending, setTmdbPending] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [pendingTmdbKey, setPendingTmdbKey] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const addMedia = useAddMedia();
  const { data: library } = useMediaList();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen(!open);
      }
      if (e.key === "Escape") {
        setOpen(false);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, setOpen]);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery("");
      setLocalResults([]);
      setTmdbResults([]);
      setTmdbError(false);
      setSelectedIndex(0);
      setPendingTmdbKey(null);
    }
  }, [open]);

  useEffect(() => {
    if (!query || query.length < 2) {
      setLocalResults([]);
      setTmdbResults([]);
      setTmdbError(false);
      setLocalPending(false);
      setTmdbPending(false);
      return;
    }

    setLocalPending(true);
    setTmdbPending(true);
    setTmdbError(false);
    setSelectedIndex(0);

    const timeout = setTimeout(async () => {
      const localPromise = fetch(
        `/api/search?q=${encodeURIComponent(query)}`,
      ).then(async (res) => {
        if (!res.ok) throw new Error("Local search failed");
        return (await res.json()) as LocalSearchResult[];
      });
      const tmdbPromise = fetch(
        `/api/movies/search?q=${encodeURIComponent(query)}`,
      ).then(async (res) => {
        if (!res.ok) throw new Error("TMDB search failed");
        const data = (await res.json()) as { results: SearchResultItem[] };
        return data.results;
      });

      const [localOutcome, tmdbOutcome] = await Promise.allSettled([
        localPromise,
        tmdbPromise,
      ]);

      if (localOutcome.status === "fulfilled") {
        setLocalResults(localOutcome.value);
      } else {
        setLocalResults([]);
      }
      setLocalPending(false);

      if (tmdbOutcome.status === "fulfilled") {
        setTmdbResults(tmdbOutcome.value);
        setTmdbError(false);
      } else {
        setTmdbResults([]);
        setTmdbError(true);
      }
      setTmdbPending(false);
    }, 200);

    return () => clearTimeout(timeout);
  }, [query]);

  const localGroups: LocalGroup[] = useMemo(() => {
    const map = new Map<string, LocalSearchResult[]>();
    for (const r of localResults) {
      const arr = map.get(r.type) ?? [];
      arr.push(r);
      map.set(r.type, arr);
    }
    const groups: LocalGroup[] = [];
    for (const type of localTypeOrder) {
      const rows = map.get(type);
      if (rows && rows.length > 0) {
        groups.push({ type, label: typeLabels[type] ?? type, rows });
      }
    }
    return groups;
  }, [localResults]);

  const tmdbRows: TmdbResult[] = useMemo(() => {
    const lookup = new Map<string, string>();
    (library ?? []).forEach((item) => {
      lookup.set(`${item.mediaType}-${item.tmdbId}`, item.id);
    });
    return tmdbResults.map((r) => {
      const key = `${r.mediaType}-${r.tmdbId}`;
      const localId = lookup.get(key) ?? null;
      return {
        tmdbId: r.tmdbId,
        mediaType: r.mediaType,
        title: r.title,
        year: r.year,
        posterPath: r.posterPath,
        overview: r.overview,
        localId,
        inLibrary: localId != null,
      };
    });
  }, [tmdbResults, library]);

  const selectable: SelectableEntry[] = useMemo(() => {
    const arr: SelectableEntry[] = [];
    let localIdx = 0;
    for (const g of localGroups) {
      for (let i = 0; i < g.rows.length; i++) {
        arr.push({ kind: "local", index: localIdx + i });
      }
      localIdx += g.rows.length;
    }
    for (let i = 0; i < tmdbRows.length; i++) {
      arr.push({ kind: "tmdb", index: i });
    }
    return arr;
  }, [localGroups, tmdbRows]);

  const flatLocalRows = useMemo(
    () => localGroups.flatMap((g) => g.rows),
    [localGroups],
  );

  const navigateLocal = useCallback(
    (result: LocalSearchResult) => {
      setOpen(false);
      router.push(getLocalResultLink(result));
    },
    [router, setOpen],
  );

  const navigateToLocalMovie = useCallback(
    (localId: string) => {
      setOpen(false);
      router.push(`/movies/${localId}`);
    },
    [router, setOpen],
  );

  const handleAddTmdb = useCallback(
    async (row: TmdbResult) => {
      if (pendingTmdbKey) return;
      const key = `${row.mediaType}-${row.tmdbId}`;
      setPendingTmdbKey(key);
      try {
        const created = await addMedia.mutateAsync({
          mediaType: row.mediaType,
          tmdbId: row.tmdbId,
        });
        toast.success("Added to library");
        setOpen(false);
        router.push(`/movies/${created.id}`);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to add");
      } finally {
        setPendingTmdbKey(null);
      }
    },
    [addMedia, pendingTmdbKey, router, setOpen],
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, selectable.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      const entry = selectable[selectedIndex];
      if (!entry) return;
      e.preventDefault();
      if (entry.kind === "local") {
        const local = flatLocalRows[entry.index];
        if (local) navigateLocal(local);
      } else {
        const tmdb = tmdbRows[entry.index];
        if (!tmdb) return;
        if (tmdb.inLibrary && tmdb.localId) {
          navigateToLocalMovie(tmdb.localId);
        } else if (!tmdb.inLibrary) {
          handleAddTmdb(tmdb);
        }
      }
    }
  };

  if (!open) return null;

  const bothPending = localPending && tmdbPending && tmdbRows.length === 0 &&
    flatLocalRows.length === 0;
  const hasAnyResults = flatLocalRows.length > 0 || tmdbRows.length > 0;
  const showTmdbGroup =
    query.length >= 2 && (tmdbPending || tmdbError || tmdbRows.length > 0);

  return (
    <div className="fixed inset-0 z-[100]">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={() => setOpen(false)}
      />

      <div className="relative mx-auto mt-[12vh] md:mt-[20vh] w-full max-w-lg px-3 md:px-4">
        <div className="overflow-hidden rounded-xl border border-border bg-popover shadow-xl">
          <div className="flex items-center gap-3 border-b border-border/60 px-4">
            <Search
              className="h-4 w-4 text-muted-foreground shrink-0"
              strokeWidth={1.75}
            />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Jump to anything…"
              className="h-12 w-full bg-transparent text-[14px] outline-none placeholder:text-muted-foreground"
            />
            <kbd className="hidden sm:inline-flex items-center rounded border border-border bg-background px-1.5 py-px font-mono text-[10.5px] font-medium text-muted-foreground">
              ESC
            </kbd>
          </div>

          {query.length < 2 && (
            <div className="p-6 text-center text-[13px] text-muted-foreground">
              Type at least 2 characters to search
            </div>
          )}

          {query.length >= 2 && bothPending && (
            <div className="p-6 text-center text-[13px] text-muted-foreground">
              Searching…
            </div>
          )}

          {query.length >= 2 &&
            !bothPending &&
            !hasAnyResults &&
            !showTmdbGroup && (
              <div className="p-6 text-center text-[13px] text-muted-foreground">
                No results for &ldquo;{query}&rdquo;
              </div>
            )}

          {query.length >= 2 && !bothPending && (hasAnyResults || showTmdbGroup) && (
            <div className="max-h-[60vh] overflow-y-auto p-2">
              {(() => {
                let runningLocalIdx = 0;
                let renderedAnyGroup = false;
                const localBlocks = localGroups.map((group) => {
                  const isFirst = !renderedAnyGroup;
                  renderedAnyGroup = true;
                  const baseIdx = runningLocalIdx;
                  runningLocalIdx += group.rows.length;
                  return (
                    <div key={`local-${group.type}`}>
                      <SearchPaletteGroupHeader
                        label={group.label}
                        count={group.rows.length}
                        isFirst={isFirst}
                      />
                      {group.rows.map((row, i) => {
                        const flatIdx = baseIdx + i;
                        const entryIdx = selectable.findIndex(
                          (e) => e.kind === "local" && e.index === flatIdx,
                        );
                        const isSelected = entryIdx === selectedIndex;
                        return (
                          <SearchPaletteLocalRow
                            key={`${row.type}-${row.id}`}
                            result={row}
                            isSelected={isSelected}
                            onSelect={() => navigateLocal(row)}
                          />
                        );
                      })}
                    </div>
                  );
                });

                let tmdbBlock: React.ReactNode = null;
                if (showTmdbGroup) {
                  const isFirst = !renderedAnyGroup;
                  renderedAnyGroup = true;
                  tmdbBlock = (
                    <div key="tmdb">
                      <SearchPaletteGroupHeader
                        label="TV & Movies"
                        count={tmdbRows.length}
                        isFirst={isFirst}
                      />
                      {tmdbPending && tmdbRows.length === 0 ? (
                        <TmdbSkeletonRows />
                      ) : tmdbError && tmdbRows.length === 0 ? (
                        <p className="px-3 py-2 text-[12px] text-muted-foreground">
                          Couldn&apos;t reach TMDB. Try again.
                        </p>
                      ) : (
                        tmdbRows.map((row, i) => {
                          const entryIdx = selectable.findIndex(
                            (e) => e.kind === "tmdb" && e.index === i,
                          );
                          const isSelected = entryIdx === selectedIndex;
                          const key = `${row.mediaType}-${row.tmdbId}`;
                          const isThisRowPending = pendingTmdbKey === key;
                          return (
                            <SearchPaletteTmdbRow
                              key={key}
                              result={row}
                              isSelected={isSelected}
                              isThisRowPending={isThisRowPending}
                              isAnyAddPending={pendingTmdbKey != null}
                              onAdd={() => handleAddTmdb(row)}
                              onNavigateToLocal={() =>
                                row.localId &&
                                navigateToLocalMovie(row.localId)
                              }
                            />
                          );
                        })
                      )}
                    </div>
                  );
                }

                return (
                  <>
                    {localBlocks}
                    {tmdbBlock}
                  </>
                );
              })()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function TmdbSkeletonRows() {
  return (
    <>
      {[0, 1].map((i) => (
        <div
          key={i}
          className="flex items-start gap-3 rounded-md px-3 py-2.5"
        >
          <Skeleton className="h-[72px] w-12 rounded" />
          <div className="flex-1 min-w-0 space-y-2 pt-1">
            <Skeleton className="h-3 w-3/5" />
            <Skeleton className="h-3 w-4/5" />
          </div>
          <Skeleton className="h-7 w-14 self-center" />
        </div>
      ))}
    </>
  );
}

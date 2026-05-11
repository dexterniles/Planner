"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Search, FilePlus2, ListTodo, CalendarPlus } from "lucide-react";
import {
  useSearchPalette,
  type QuickCreateType,
} from "./search-palette-context";
import {
  SearchPaletteLocalRow,
  getLocalResultLink,
  localTypeOrder,
  typeLabels,
  type LocalSearchResult,
} from "./search-palette-local-row";
import { SearchPaletteGroupHeader } from "./search-palette-group-header";

interface LocalGroup {
  type: string;
  label: string;
  rows: LocalSearchResult[];
}

interface QuickCreateRow {
  type: QuickCreateType;
  label: string;
  icon: React.ReactNode;
}

interface SelectableEntry {
  kind: "local" | "quick-create";
  index: number;
}

export function SearchPalette() {
  const { open, setOpen, requestQuickCreate } = useSearchPalette();
  const [query, setQuery] = useState("");
  const [localResults, setLocalResults] = useState<LocalSearchResult[]>([]);
  const [localPending, setLocalPending] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const pathname = usePathname();

  const clearAll = useCallback(() => {
    setQuery("");
    setLocalResults([]);
    setSelectedIndex(0);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen(!open);
      }
      if (e.key === "Escape") {
        if (open) {
          clearAll();
        }
        setOpen(false);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, setOpen, clearAll]);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => {
    if (!query || query.length < 2) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- clear in-effect fetch results when query is empty; deferred TanStack Query refactor
      setLocalResults([]);
      setLocalPending(false);
      return;
    }

    setLocalPending(true);
    setSelectedIndex(0);

    const timeout = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/search?q=${encodeURIComponent(query)}`,
        );
        if (!res.ok) throw new Error("Local search failed");
        const data = (await res.json()) as LocalSearchResult[];
        setLocalResults(data);
      } catch {
        setLocalResults([]);
      } finally {
        setLocalPending(false);
      }
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

  const showQuickCreate =
    query.length >= 2 && localResults.length === 0 && !localPending;

  const quickCreateRows: QuickCreateRow[] = useMemo(() => {
    if (!showQuickCreate) return [];
    return [
      {
        type: "task",
        label: `Create task titled "${query}"`,
        icon: <ListTodo className="h-4 w-4 text-primary" strokeWidth={1.75} />,
      },
      {
        type: "event",
        label: `Create event titled "${query}"`,
        icon: (
          <CalendarPlus className="h-4 w-4 text-primary" strokeWidth={1.75} />
        ),
      },
      {
        type: "note",
        label: `Create note titled "${query}"`,
        icon: <FilePlus2 className="h-4 w-4 text-primary" strokeWidth={1.75} />,
      },
    ];
  }, [showQuickCreate, query]);

  const selectable: SelectableEntry[] = useMemo(() => {
    const arr: SelectableEntry[] = [];
    let localIdx = 0;
    for (const g of localGroups) {
      for (let i = 0; i < g.rows.length; i++) {
        arr.push({ kind: "local", index: localIdx + i });
      }
      localIdx += g.rows.length;
    }
    for (let i = 0; i < quickCreateRows.length; i++) {
      arr.push({ kind: "quick-create", index: i });
    }
    return arr;
  }, [localGroups, quickCreateRows]);

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

  const handleQuickCreate = useCallback(
    (type: QuickCreateType) => {
      const title = query.trim();
      if (!title) return;
      requestQuickCreate(type, title);
      setOpen(false);
      if (pathname !== "/") {
        router.push("/");
      }
    },
    [query, requestQuickCreate, setOpen, pathname, router],
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
      } else if (entry.kind === "quick-create") {
        const qc = quickCreateRows[entry.index];
        if (qc) handleQuickCreate(qc.type);
      }
    }
  };

  if (!open) return null;

  const hasAnyResults = flatLocalRows.length > 0;

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

          {query.length >= 2 && localPending && (
            <div className="p-6 text-center text-[13px] text-muted-foreground">
              Searching…
            </div>
          )}

          {query.length >= 2 &&
            !localPending &&
            !hasAnyResults &&
            !showQuickCreate && (
              <div className="p-6 text-center text-[13px] text-muted-foreground">
                No results for &ldquo;{query}&rdquo;
              </div>
            )}

          {query.length >= 2 &&
            !localPending &&
            (hasAnyResults || showQuickCreate) && (
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

                  let quickCreateBlock: React.ReactNode = null;
                  if (showQuickCreate) {
                    const isFirst = !renderedAnyGroup;
                    renderedAnyGroup = true;
                    quickCreateBlock = (
                      <div key="quick-create">
                        <SearchPaletteGroupHeader
                          label="Create"
                          count={quickCreateRows.length}
                          isFirst={isFirst}
                        />
                        {!hasAnyResults && (
                          <p className="px-3 pb-1.5 pt-0.5 text-[12px] text-muted-foreground">
                            No results for &ldquo;{query}&rdquo;
                          </p>
                        )}
                        {quickCreateRows.map((row, i) => {
                          const entryIdx = selectable.findIndex(
                            (e) =>
                              e.kind === "quick-create" && e.index === i,
                          );
                          const isSelected = entryIdx === selectedIndex;
                          return (
                            <button
                              key={row.type}
                              type="button"
                              onClick={() => handleQuickCreate(row.type)}
                              onMouseEnter={() => setSelectedIndex(entryIdx)}
                              className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-[13px] transition-colors ${
                                isSelected
                                  ? "bg-accent text-accent-foreground"
                                  : "hover:bg-accent/60"
                              }`}
                            >
                              {row.icon}
                              <span className="truncate">{row.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    );
                  }

                  return (
                    <>
                      {localBlocks}
                      {quickCreateBlock}
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

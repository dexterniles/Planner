"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  GraduationCap,
  FolderKanban,
  FileText,
  ListChecks,
  PartyPopper,
  Wallet,
} from "lucide-react";
import { EVENT_CATEGORIES } from "@/components/events/event-categories";
import type { EventCategory } from "@/lib/validations/event";

interface SearchResult {
  id: string;
  type: string;
  title: string;
  subtitle: string | null;
  color: string | null;
  parentId: string | null;
  category: string | null;
}

const typeIcons: Record<string, typeof GraduationCap> = {
  course: GraduationCap,
  project: FolderKanban,
  assignment: FileText,
  task: ListChecks,
  event: PartyPopper,
  bill: Wallet,
};

const typeLabels: Record<string, string> = {
  course: "Course",
  project: "Project",
  assignment: "Assignment",
  task: "Task",
  event: "Event",
  bill: "Bill",
};

function getResultIcon(result: SearchResult) {
  if (result.type === "event" && result.category) {
    const meta = EVENT_CATEGORIES[result.category as EventCategory];
    if (meta) return meta.icon;
  }
  return typeIcons[result.type] ?? FileText;
}

function getResultLink(result: SearchResult): string {
  switch (result.type) {
    case "course":
      return `/academic/${result.id}`;
    case "project":
      return `/projects/${result.id}`;
    case "assignment":
      return `/academic/${result.parentId}`;
    case "task":
      return `/projects/${result.parentId}`;
    case "event":
      return `/events/${result.id}`;
    case "bill":
      return `/bills`;
    default:
      return "/";
  }
}

export function SearchPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Cmd+K to open
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
      if (e.key === "Escape") {
        setOpen(false);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery("");
      setResults([]);
      setSelectedIndex(0);
    }
  }, [open]);

  // Search on query change
  useEffect(() => {
    if (!query || query.length < 2) {
      setResults([]);
      return;
    }

    const timeout = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/search?q=${encodeURIComponent(query)}`,
        );
        if (res.ok) {
          const data = await res.json();
          setResults(data);
          setSelectedIndex(0);
        }
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => clearTimeout(timeout);
  }, [query]);

  const navigate = useCallback(
    (result: SearchResult) => {
      setOpen(false);
      router.push(getResultLink(result));
    },
    [router],
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && results[selectedIndex]) {
      e.preventDefault();
      navigate(results[selectedIndex]);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={() => setOpen(false)}
      />

      {/* Palette */}
      <div className="relative mx-auto mt-[12vh] md:mt-[20vh] w-full max-w-lg px-3 md:px-4">
        <div className="overflow-hidden rounded-xl bg-popover shadow-2xl ring-1 ring-border">
          {/* Input */}
          <div className="flex items-center gap-3 border-b px-4">
            <Search className="h-4 w-4 text-muted-foreground shrink-0" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search anything..."
              className="h-12 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
            <kbd className="hidden sm:inline-flex h-5 items-center gap-0.5 rounded border px-1.5 text-[10px] font-medium text-muted-foreground">
              ESC
            </kbd>
          </div>

          {/* Results */}
          {results.length > 0 && (
            <div className="max-h-72 overflow-y-auto p-2">
              {results.map((result, i) => {
                const Icon = getResultIcon(result);
                return (
                  <button
                    key={`${result.type}-${result.id}`}
                    onClick={() => navigate(result)}
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${
                      i === selectedIndex
                        ? "bg-accent text-accent-foreground"
                        : "hover:bg-accent/50"
                    }`}
                  >
                    <div
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md"
                      style={{
                        backgroundColor: result.color
                          ? `${result.color}20`
                          : undefined,
                      }}
                    >
                      <Icon
                        className="h-4 w-4"
                        style={{ color: result.color ?? undefined }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{result.title}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {typeLabels[result.type]}
                        {result.subtitle && ` · ${result.subtitle}`}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {query.length >= 2 && results.length === 0 && !loading && (
            <div className="p-6 text-center text-sm text-muted-foreground">
              No results for &ldquo;{query}&rdquo;
            </div>
          )}

          {loading && (
            <div className="p-6 text-center text-sm text-muted-foreground">
              Searching...
            </div>
          )}

          {query.length < 2 && (
            <div className="p-6 text-center text-sm text-muted-foreground">
              Type at least 2 characters to search
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

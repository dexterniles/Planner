"use client";

import { useMemo, useState } from "react";
import { Check, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface FacetSearchListProps {
  label: string;
  value: string | null;
  options: string[];
  onChange: (value: string | null) => void;
}

export function FacetSearchList({
  label,
  value,
  options,
  onChange,
}: FacetSearchListProps) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => o.toLowerCase().includes(q));
  }, [options, query]);

  // Stale-facet anchor: if a value is set but no longer in the live domain,
  // surface it at the top so the popover state matches the active chip strip.
  const displayed = useMemo(() => {
    if (value && !filtered.includes(value)) return [value, ...filtered];
    return filtered;
  }, [filtered, value]);

  const isEmptyDomain = options.length === 0 && !value;

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <span className="text-[12px] font-medium text-foreground">{label}</span>
        {value && (
          <button
            type="button"
            onClick={() => {
              onChange(null);
              setQuery("");
            }}
            className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-3 w-3" />
            Clear
          </button>
        )}
      </div>
      {isEmptyDomain ? (
        <p className="text-[11.5px] text-muted-foreground italic">
          Add titles to your library to filter by {label.toLowerCase()}.
        </p>
      ) : (
        <>
          <div className="relative">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={`Search ${label.toLowerCase()}…`}
              className="h-7 text-xs"
            />
          </div>
          <div className="max-h-[240px] overflow-y-auto rounded-md border border-border bg-card/50">
            {displayed.length === 0 ? (
              <p className="px-2 py-2 text-[11.5px] text-muted-foreground">
                No matches
              </p>
            ) : (
              <ul className="flex flex-col py-0.5">
                {displayed.map((opt) => {
                  const isSelected = opt === value;
                  return (
                    <li key={opt}>
                      <button
                        type="button"
                        aria-pressed={isSelected}
                        onClick={() =>
                          onChange(isSelected ? null : opt)
                        }
                        className={cn(
                          "flex w-full items-center justify-between gap-2 px-2 py-1 text-left text-[12.5px] transition-colors",
                          isSelected
                            ? "bg-primary/10 text-primary"
                            : "text-foreground hover:bg-muted",
                        )}
                      >
                        <span className="truncate">{opt}</span>
                        {isSelected && (
                          <Check className="h-3.5 w-3.5 shrink-0" />
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
}

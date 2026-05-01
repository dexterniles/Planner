"use client";

import { Sliders } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { FacetSearchList } from "@/components/movies/facet-search-list";

export interface MovieFiltersPatch {
  director?: string | null;
  composer?: string | null;
  actor?: string | null;
  yearMin?: number | null;
  yearMax?: number | null;
}

interface MovieFiltersPopoverProps {
  director: string | null;
  composer: string | null;
  actor: string | null;
  yearMin: number | null;
  yearMax: number | null;
  domains: {
    directors: string[];
    composers: string[];
    actors: string[];
    yearBounds: readonly [number, number] | null;
  };
  onChange: (patch: MovieFiltersPatch) => void;
  activeCount: number;
}

const CURRENT_YEAR = new Date().getFullYear();
const MIN_YEAR = 1888;
const MAX_YEAR = CURRENT_YEAR + 5;

function parseYear(raw: string): number | null {
  if (raw === "") return null;
  const n = parseInt(raw, 10);
  if (!Number.isFinite(n)) return null;
  if (n < MIN_YEAR || n > MAX_YEAR) return null;
  return n;
}

export function MovieFiltersPopover({
  director,
  composer,
  actor,
  yearMin,
  yearMax,
  domains,
  onChange,
  activeCount,
}: MovieFiltersPopoverProps) {
  const yearHint = domains.yearBounds
    ? `Library: ${domains.yearBounds[0]}–${domains.yearBounds[1]}`
    : null;

  const handleReset = () => {
    onChange({
      director: null,
      composer: null,
      actor: null,
      yearMin: null,
      yearMax: null,
    });
  };

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            variant="outline"
            size="sm"
            aria-label="Advanced filters"
            title="Advanced filters"
          />
        }
      >
        <Sliders className="h-3.5 w-3.5" />
        Filters
        {activeCount > 0 && (
          <span className="ml-1 rounded-full bg-primary/15 px-1.5 text-[10px] font-medium leading-[1.4] text-primary tabular-nums">
            {activeCount}
          </span>
        )}
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[340px] gap-3 p-3">
        <FacetSearchList
          label="Director"
          value={director}
          options={domains.directors}
          onChange={(v) => onChange({ director: v })}
        />
        <Separator />
        <FacetSearchList
          label="Composer"
          value={composer}
          options={domains.composers}
          onChange={(v) => onChange({ composer: v })}
        />
        <Separator />
        <FacetSearchList
          label="Actor"
          value={actor}
          options={domains.actors}
          onChange={(v) => onChange({ actor: v })}
        />
        <Separator />
        <div className="flex flex-col gap-1.5">
          <span className="text-[12px] font-medium text-foreground">Year</span>
          {domains.yearBounds === null ? (
            <p className="text-[11.5px] text-muted-foreground italic">
              Add titles to your library to filter by year.
            </p>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={MIN_YEAR}
                  max={MAX_YEAR}
                  value={yearMin ?? ""}
                  onChange={(e) =>
                    onChange({ yearMin: parseYear(e.target.value) })
                  }
                  placeholder="Min"
                  aria-label="Min year"
                  className="h-7 text-xs"
                />
                <span className="text-[11.5px] text-muted-foreground">to</span>
                <Input
                  type="number"
                  min={MIN_YEAR}
                  max={MAX_YEAR}
                  value={yearMax ?? ""}
                  onChange={(e) =>
                    onChange({ yearMax: parseYear(e.target.value) })
                  }
                  placeholder="Max"
                  aria-label="Max year"
                  className="h-7 text-xs"
                />
              </div>
              {yearHint && (
                <p className="text-[11px] text-muted-foreground">{yearHint}</p>
              )}
            </>
          )}
        </div>
        <Separator />
        <div className="flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            disabled={activeCount === 0}
          >
            Reset all
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

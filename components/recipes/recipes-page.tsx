"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { ChefHat, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/layout/page-header";
import { useRecipes } from "@/lib/hooks/use-recipes";
import { useTags } from "@/lib/hooks/use-tags";
import { RecipeTile, type RecipeRow } from "@/components/recipes/recipe-tile";
import { RecipeDialog } from "@/components/recipes/recipe-dialog";
import {
  SavedViewsButton,
  SavedViewsStrip,
} from "@/components/layout/saved-views";
import { cn } from "@/lib/utils";

interface TagRow {
  id: string;
  name: string;
  color: string | null;
}

export function RecipesPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [dialogOpen, setDialogOpen] = useState(false);

  const query = searchParams.get("q") ?? "";
  const tagFilter = searchParams.get("tag");

  const [inputValue, setInputValue] = useState(query);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const setParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams);
    if (!value) params.delete(key);
    else params.set(key, value);
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  const onSearchChange = (value: string) => {
    setInputValue(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setParam("q", value), 250);
  };

  // Sync local input back when URL changes (back/forward navigation).
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- mirror URL state on navigation
    setInputValue(searchParams.get("q") ?? "");
  }, [searchParams]);

  const trimmed = query.trim();
  const { data: recipes, isLoading } = useRecipes({
    ...(trimmed && { q: trimmed }),
    ...(tagFilter && { tagId: tagFilter }),
  });
  const { data: tags } = useTags();

  const tagList = (tags ?? []) as TagRow[];

  const visible = (recipes ?? []) as RecipeRow[];

  return (
    <div>
      <PageHeader
        title="Recipes"
        actions={
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="mr-1.5 h-4 w-4" />
            New Recipe
          </Button>
        }
      />

      <div className="space-y-5">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="relative max-w-sm flex-1">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground"
                strokeWidth={1.75}
              />
              <Input
                data-page-search
                value={inputValue}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search recipes..."
                className="pl-9"
              />
            </div>
            <SavedViewsButton routeKey="recipes" />
          </div>

          <SavedViewsStrip routeKey="recipes" />

          {tagList.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setParam("tag", "")}
                className={cn(
                  "px-3 py-1 text-xs font-medium rounded-full border transition-all",
                  tagFilter === null
                    ? "bg-primary text-primary-foreground border-primary shadow-sm"
                    : "bg-muted/50 text-muted-foreground border-border/60 hover:bg-muted hover:text-foreground",
                )}
              >
                All
              </button>
              {tagList.map((tag) => {
                const active = tagFilter === tag.id;
                return (
                  <button
                    key={tag.id}
                    onClick={() => setParam("tag", active ? "" : tag.id)}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-full border transition-all",
                      active
                        ? "bg-primary text-primary-foreground border-primary shadow-sm"
                        : "bg-muted/50 text-muted-foreground border-border/60 hover:bg-muted hover:text-foreground",
                    )}
                  >
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: tag.color ?? "#6B7280" }}
                    />
                    {tag.name}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-[220px] w-full rounded-xl" />
            ))}
          </div>
        ) : visible.length === 0 && !query && !tagFilter ? (
          <div className="mt-12 flex flex-col items-center text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
              <ChefHat className="h-6 w-6 text-primary" strokeWidth={1.75} />
            </div>
            <h3 className="font-serif text-[20px] font-medium leading-tight tracking-tight">
              Save what you cook
            </h3>
            <p className="mt-1 text-sm text-muted-foreground max-w-sm">
              Capture ingredients, steps, and timing — then scale portions when
              you&rsquo;re cooking for a crowd.
            </p>
            <Button className="mt-5" onClick={() => setDialogOpen(true)}>
              <Plus className="mr-1.5 h-4 w-4" />
              Add your first recipe
            </Button>
          </div>
        ) : visible.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">
            No recipes match the current filters.
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {visible.map((r) => (
              <RecipeTile key={r.id} recipe={r} />
            ))}
          </div>
        )}

        <RecipeDialog open={dialogOpen} onOpenChange={setDialogOpen} />
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { ChefHat, Clock, Users } from "lucide-react";
import { Card } from "@/components/ui/card";

export interface RecipeRow {
  id: string;
  title: string;
  description: string | null;
  prepTimeMinutes: number | null;
  cookTimeMinutes: number | null;
  portions: number;
  tags: { id: string; name: string; color: string | null }[];
}

interface RecipeTileProps {
  recipe: RecipeRow;
}

export function RecipeTile({ recipe }: RecipeTileProps) {
  const totalTime =
    (recipe.prepTimeMinutes ?? 0) + (recipe.cookTimeMinutes ?? 0);

  return (
    <Card hover className="group flex h-full flex-col p-0 overflow-hidden">
      <Link
        href={`/recipes/${recipe.id}`}
        className="flex flex-1 flex-col p-4"
        aria-label={`Open ${recipe.title}`}
      >
        <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
          <ChefHat className="h-4 w-4 text-primary" strokeWidth={1.75} />
        </div>

        <h3 className="font-serif text-[18px] font-medium leading-tight tracking-tight line-clamp-2">
          {recipe.title}
        </h3>

        {recipe.description && (
          <p className="mt-1.5 text-[12.5px] text-muted-foreground line-clamp-2">
            {recipe.description}
          </p>
        )}

        <div className="mt-auto pt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11.5px] text-muted-foreground">
          {totalTime > 0 && (
            <span className="flex items-center gap-1 tabular-nums">
              <Clock className="h-3 w-3" strokeWidth={1.75} />
              {totalTime} min
            </span>
          )}
          <span className="flex items-center gap-1 tabular-nums">
            <Users className="h-3 w-3" strokeWidth={1.75} />
            {recipe.portions}
          </span>
        </div>

        {recipe.tags.length > 0 && (
          <div className="mt-2.5 flex flex-wrap gap-1">
            {recipe.tags.slice(0, 4).map((tag) => (
              <span
                key={tag.id}
                className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium"
                style={{
                  backgroundColor: `${tag.color ?? "#6B7280"}20`,
                  color: tag.color ?? undefined,
                }}
              >
                {tag.name}
              </span>
            ))}
            {recipe.tags.length > 4 && (
              <span className="text-[10px] text-muted-foreground">
                +{recipe.tags.length - 4}
              </span>
            )}
          </div>
        )}
      </Link>
    </Card>
  );
}

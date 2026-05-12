"use client";

import { useState } from "react";
import { Plus, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FilterChip } from "@/components/ui/filter-chip";
import { cn } from "@/lib/utils";
import {
  useBillCategories,
  useCreateBillCategory,
} from "@/lib/hooks/use-bill-categories";
import { categoryInitial, defaultCategoryColor } from "./bill-utils";
import { toast } from "sonner";

export interface CategoryOption {
  id: string;
  name: string;
  color: string | null;
}

const CATEGORY_COLORS = [
  "#6366F1", // indigo
  "#8B5CF6", // violet
  "#EC4899", // pink
  "#F43F5E", // rose
  "#F97316", // orange
  "#F59E0B", // amber
  "#10B981", // emerald
  "#06B6D4", // cyan
  "#3B82F6", // blue
  "#64748B", // slate
];

interface CategoryPickerProps {
  value: string | null;
  onChange: (id: string | null) => void;
}

export function CategoryPicker({ value, onChange }: CategoryPickerProps) {
  const { data: categories } = useBillCategories();
  const createCategory = useCreateBillCategory();
  const [composing, setComposing] = useState(false);
  const [name, setName] = useState("");
  const [color, setColor] = useState(CATEGORY_COLORS[0]);

  const handleCreate = async () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    try {
      const cat = await createCategory.mutateAsync({ name: trimmed, color });
      onChange(cat.id);
      setName("");
      setColor(CATEGORY_COLORS[0]);
      setComposing(false);
      toast.success("Category created");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create");
    }
  };

  const cats = (categories ?? []) as CategoryOption[];

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        <FilterChip active={value === null} onClick={() => onChange(null)}>
          Uncategorized
        </FilterChip>

        {cats.map((cat) => (
          <FilterChip
            key={cat.id}
            active={value === cat.id}
            onClick={() => onChange(cat.id)}
          >
            <span
              className="flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold text-white"
              style={{ backgroundColor: cat.color ?? defaultCategoryColor }}
            >
              {categoryInitial(cat.name)}
            </span>
            {cat.name}
          </FilterChip>
        ))}

        {!composing && (
          <button
            type="button"
            onClick={() => setComposing(true)}
            className="inline-flex h-7 items-center gap-1 rounded-md border border-dashed border-border/60 px-2.5 text-[11.5px] font-medium text-muted-foreground transition-colors hover:border-foreground/40 hover:text-foreground"
          >
            <Plus className="h-3 w-3" />
            New
          </button>
        )}
      </div>

      {composing && (
        <div className="rounded-md border border-border/60 bg-muted/30 p-3 space-y-3">
          <div className="flex items-center gap-2">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Category name"
              autoFocus
              maxLength={60}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleCreate();
                }
                if (e.key === "Escape") {
                  e.preventDefault();
                  setComposing(false);
                  setName("");
                }
              }}
              className="h-8 flex-1"
            />
            <Button
              type="button"
              size="icon-sm"
              onClick={handleCreate}
              disabled={!name.trim() || createCategory.isPending}
              aria-label="Save category"
            >
              <Check className="h-3.5 w-3.5" />
            </Button>
            <Button
              type="button"
              size="icon-sm"
              variant="ghost"
              onClick={() => {
                setComposing(false);
                setName("");
              }}
              aria-label="Cancel"
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {CATEGORY_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                aria-label={`Select color ${c}`}
                className={cn(
                  "h-6 w-6 rounded-full border-2 transition-transform",
                  color === c
                    ? "border-foreground scale-110"
                    : "border-transparent",
                )}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

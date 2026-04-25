"use client";

import { useState } from "react";
import { Plus, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  useEventCategories,
  useCreateEventCategory,
} from "@/lib/hooks/use-event-categories";
import { getEventCategoryMeta } from "./event-categories";
import { toast } from "sonner";

export interface CategoryOption {
  id: string;
  name: string;
  color: string | null;
}

const CATEGORY_COLORS = [
  "#6366F1",
  "#8B5CF6",
  "#EC4899",
  "#F43F5E",
  "#F97316",
  "#F59E0B",
  "#10B981",
  "#06B6D4",
  "#3B82F6",
  "#64748B",
];

interface EventCategoryPickerProps {
  value: string | null;
  onChange: (id: string | null) => void;
}

export function EventCategoryPicker({ value, onChange }: EventCategoryPickerProps) {
  const { data: categories } = useEventCategories();
  const createCategory = useCreateEventCategory();
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
        <button
          type="button"
          onClick={() => onChange(null)}
          className={cn(
            "flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-all",
            value === null
              ? "bg-primary text-primary-foreground border-primary shadow-sm"
              : "bg-muted/50 text-muted-foreground border-border/60 hover:bg-muted",
          )}
        >
          Uncategorized
        </button>

        {cats.map((cat) => {
          const active = value === cat.id;
          const meta = getEventCategoryMeta(cat.name, cat.color);
          const Icon = meta.icon;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => onChange(cat.id)}
              className={cn(
                "flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-all",
                active
                  ? "bg-primary text-primary-foreground border-primary shadow-sm"
                  : "bg-muted/50 text-foreground border-border/60 hover:bg-muted",
              )}
            >
              <span
                className="flex h-4 w-4 items-center justify-center rounded-full"
                style={{ backgroundColor: cat.color ?? meta.defaultColor }}
              >
                <Icon className="h-2.5 w-2.5 text-white" strokeWidth={2.5} />
              </span>
              {cat.name}
            </button>
          );
        })}

        {!composing && (
          <button
            type="button"
            onClick={() => setComposing(true)}
            className="flex items-center gap-1 rounded-full border border-dashed border-border px-2.5 py-1 text-xs font-medium text-muted-foreground transition-all hover:border-primary hover:text-primary"
          >
            <Plus className="h-3 w-3" />
            New
          </button>
        )}
      </div>

      {composing && (
        <div className="rounded-lg border border-border/60 bg-muted/30 p-3 space-y-3">
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

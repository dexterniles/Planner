"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  useTags,
  useCreateTag,
} from "@/lib/hooks/use-tags";
import {
  useAttachRecipeTag,
  useDetachRecipeTag,
} from "@/lib/hooks/use-recipes";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Tag {
  id: string;
  name: string;
  color: string | null;
}

interface RecipeTagsProps {
  recipeId: string;
  attached: Tag[];
}

const TAG_COLORS = [
  "#3B82F6",
  "#EF4444",
  "#10B981",
  "#F59E0B",
  "#8B5CF6",
  "#EC4899",
  "#06B6D4",
  "#F97316",
  "#6B7280",
];

export function RecipeTags({ recipeId, attached }: RecipeTagsProps) {
  const { data: allTags } = useTags();
  const attachTag = useAttachRecipeTag();
  const detachTag = useDetachRecipeTag();
  const createTag = useCreateTag();

  const [picking, setPicking] = useState(false);
  const [composing, setComposing] = useState(false);
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState(TAG_COLORS[0]);

  const attachedIds = new Set(attached.map((t) => t.id));
  const available = ((allTags ?? []) as Tag[]).filter(
    (t) => !attachedIds.has(t.id),
  );

  const handleAttach = async (tagId: string) => {
    try {
      await attachTag.mutateAsync({ recipeId, tagId });
    } catch {
      toast.error("Failed to add tag");
    }
  };

  const handleDetach = async (tagId: string) => {
    try {
      await detachTag.mutateAsync({ recipeId, tagId });
    } catch {
      toast.error("Failed to remove tag");
    }
  };

  const handleCreateAndAttach = async () => {
    const name = newName.trim();
    if (!name) return;
    try {
      const tag = await createTag.mutateAsync({ name, color: newColor });
      await attachTag.mutateAsync({ recipeId, tagId: tag.id });
      setNewName("");
      setNewColor(TAG_COLORS[0]);
      setComposing(false);
      toast.success("Tag created and added");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create tag");
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-1.5">
        {attached.map((tag) => (
          <span
            key={tag.id}
            className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium"
            style={{
              backgroundColor: `${tag.color ?? "#6B7280"}20`,
              color: tag.color ?? undefined,
            }}
          >
            {tag.name}
            <button
              type="button"
              onClick={() => handleDetach(tag.id)}
              aria-label={`Remove ${tag.name}`}
              className="opacity-60 transition-opacity hover:opacity-100"
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}

        {!picking && (
          <button
            type="button"
            onClick={() => setPicking(true)}
            className="inline-flex items-center gap-1 rounded-full border border-dashed border-border px-2 py-0.5 text-[11px] font-medium text-muted-foreground transition-colors hover:border-primary hover:text-primary"
          >
            <Plus className="h-3 w-3" />
            Tag
          </button>
        )}
      </div>

      {picking && (
        <div className="rounded-lg border border-border/60 bg-muted/30 p-3 space-y-2">
          {available.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {available.map((tag) => (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => handleAttach(tag.id)}
                  className="inline-flex items-center gap-1 rounded-full bg-background border border-border/60 px-2 py-0.5 text-[11px] font-medium transition-colors hover:bg-accent/40"
                >
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: tag.color ?? "#6B7280" }}
                  />
                  {tag.name}
                </button>
              ))}
            </div>
          )}
          {!composing ? (
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={() => setComposing(true)}>
                <Plus className="mr-1.5 h-3.5 w-3.5" />
                New tag
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setPicking(false)}>
                Done
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Tag name"
                  autoFocus
                  maxLength={50}
                  className="h-8 flex-1"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleCreateAndAttach();
                    }
                    if (e.key === "Escape") setComposing(false);
                  }}
                />
                <Button
                  size="sm"
                  onClick={handleCreateAndAttach}
                  disabled={!newName.trim() || createTag.isPending}
                >
                  Create
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setComposing(false);
                    setNewName("");
                  }}
                >
                  Cancel
                </Button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {TAG_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setNewColor(c)}
                    aria-label={`Color ${c}`}
                    className={cn(
                      "h-5 w-5 rounded-full border-2 transition-transform",
                      newColor === c
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
      )}
    </div>
  );
}

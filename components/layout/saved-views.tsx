"use client";

import { useState } from "react";
import { Star, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { useSavedViews } from "@/lib/hooks/use-saved-views";
import { cn } from "@/lib/utils";

interface SavedViewsProps {
  routeKey: string;
}

export function SavedViewsButton({ routeKey }: SavedViewsProps) {
  const { saveCurrentView, currentQuery } = useSavedViews(routeKey);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const canSave = currentQuery.length > 0;

  const handleSave = () => {
    const view = saveCurrentView(name);
    if (view) {
      setName("");
      setOpen(false);
    }
  };

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        if (!canSave && next) return;
        setOpen(next);
        if (!next) setName("");
      }}
    >
      <PopoverTrigger
        render={
          <Button
            variant="outline"
            size="sm"
            disabled={!canSave}
            title={
              canSave
                ? "Save current filters as a view"
                : "No filters to save."
            }
            aria-label="Save current view"
            className="h-8 w-8 px-0"
          />
        }
      >
        <Star className="h-3.5 w-3.5" />
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72">
        <p className="text-[12px] font-medium">Save view</p>
        <Input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleSave();
            }
          }}
          placeholder="e.g. Watching now"
        />
        <div className="flex justify-end gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setOpen(false);
              setName("");
            }}
          >
            Cancel
          </Button>
          <Button size="sm" onClick={handleSave} disabled={!name.trim()}>
            Save
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function SavedViewsStrip({ routeKey }: SavedViewsProps) {
  const { views, applyView, deleteView, activeViewId } = useSavedViews(routeKey);
  const confirm = useConfirm();

  if (views.length === 0) return null;

  const handleDelete = async (id: string, name: string) => {
    const ok = await confirm({
      title: `Delete "${name}"?`,
      description: "This view will be removed from this device.",
      destructive: true,
    });
    if (ok) deleteView(id);
  };

  return (
    <div className="flex flex-wrap gap-1.5">
      {views.map((view) => {
        const isActive = view.id === activeViewId;
        return (
          <span
            key={view.id}
            className={cn(
              "group inline-flex items-center gap-1 rounded-full border text-xs font-medium transition-all",
              isActive
                ? "bg-primary text-primary-foreground border-primary shadow-sm"
                : "bg-muted/50 text-muted-foreground border-border/60 hover:bg-muted hover:text-foreground",
            )}
          >
            <button
              type="button"
              onClick={() => applyView(view.id)}
              className="flex items-center gap-1.5 py-1 pl-3 pr-1.5"
              title={`Apply view "${view.name}"`}
            >
              <Star
                className={cn(
                  "h-3 w-3",
                  isActive ? "fill-current" : "opacity-60",
                )}
              />
              {view.name}
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(view.id, view.name);
              }}
              className={cn(
                "rounded-full p-0.5 mr-1 transition-opacity",
                isActive
                  ? "opacity-70 hover:opacity-100 hover:bg-primary-foreground/20"
                  : "opacity-50 hover:opacity-100 hover:bg-foreground/10",
              )}
              aria-label={`Delete view "${view.name}"`}
              title="Delete view"
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        );
      })}
    </div>
  );
}

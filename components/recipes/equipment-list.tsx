"use client";

import { useState } from "react";
import { Plus, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  useCreateEquipment,
  useDeleteEquipment,
} from "@/lib/hooks/use-recipes";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { toast } from "sonner";

export interface Equipment {
  id: string;
  sortOrder: number;
  name: string;
}

interface EquipmentListProps {
  recipeId: string;
  equipment: Equipment[];
}

export function EquipmentList({ recipeId, equipment }: EquipmentListProps) {
  const [composing, setComposing] = useState(false);
  const [draft, setDraft] = useState("");

  const createEq = useCreateEquipment();
  const deleteEq = useDeleteEquipment();
  const confirm = useConfirm();

  const save = async () => {
    const name = draft.trim();
    if (!name) return;
    try {
      await createEq.mutateAsync({
        recipeId,
        data: { name, sortOrder: equipment.length },
      });
      setDraft("");
      setComposing(false);
      toast.success("Equipment added");
    } catch {
      toast.error("Failed to add");
    }
  };

  const handleDelete = async (id: string) => {
    if (
      !(await confirm({
        title: "Remove this from equipment?",
        destructive: true,
      }))
    ) {
      return;
    }
    try {
      await deleteEq.mutateAsync({ recipeId, itemId: id });
      toast.success("Removed");
    } catch {
      toast.error("Failed to delete");
    }
  };

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-serif text-[18px] font-medium leading-tight tracking-tight">
          Equipment
        </h3>
        {!composing && (
          <Button size="sm" variant="outline" onClick={() => setComposing(true)}>
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Add
          </Button>
        )}
      </div>

      {equipment.length === 0 && !composing ? (
        <p className="text-sm text-muted-foreground">
          No equipment listed. Pots, pans, gadgets — anything you need on hand.
        </p>
      ) : (
        <ul className="flex flex-wrap gap-1.5">
          {equipment.map((e) => (
            <li
              key={e.id}
              className="group inline-flex items-center gap-1 rounded-full border border-border/60 bg-muted/40 px-2.5 py-1 text-xs"
            >
              <span>{e.name}</span>
              <button
                type="button"
                onClick={() => handleDelete(e.id)}
                aria-label={`Remove ${e.name}`}
                className="text-muted-foreground/70 transition-colors hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {composing && (
        <div className="mt-2 flex items-center gap-2">
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="e.g. Cast-iron skillet"
            className="h-8 max-w-xs"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                save();
              }
              if (e.key === "Escape") {
                setComposing(false);
                setDraft("");
              }
            }}
          />
          <Button
            size="icon-sm"
            onClick={save}
            disabled={!draft.trim() || createEq.isPending}
            aria-label="Save"
          >
            <Check className="h-3.5 w-3.5" />
          </Button>
          <Button
            size="icon-sm"
            variant="ghost"
            onClick={() => {
              setComposing(false);
              setDraft("");
            }}
            aria-label="Cancel"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}
    </div>
  );
}

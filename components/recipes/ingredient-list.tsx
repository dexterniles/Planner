"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  useCreateIngredient,
  useUpdateIngredient,
  useDeleteIngredient,
} from "@/lib/hooks/use-recipes";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { toast } from "sonner";

export interface Ingredient {
  id: string;
  sortOrder: number;
  quantity: string | null;
  unit: string | null;
  name: string;
}

interface IngredientListProps {
  recipeId: string;
  ingredients: Ingredient[];
  /** Multiplier applied to displayed quantities (portion converter). */
  scale?: number;
}

function formatScaledQuantity(qty: string | null, scale: number): string {
  if (qty == null) return "";
  const n = parseFloat(qty);
  if (isNaN(n)) return qty;
  const scaled = n * scale;
  if (scaled === 0) return "0";
  // Prefer common fractions for halves/quarters/thirds.
  const whole = Math.floor(scaled);
  const frac = scaled - whole;
  const fracMap: { value: number; label: string }[] = [
    { value: 0.125, label: "⅛" },
    { value: 0.25, label: "¼" },
    { value: 1 / 3, label: "⅓" },
    { value: 0.5, label: "½" },
    { value: 2 / 3, label: "⅔" },
    { value: 0.75, label: "¾" },
  ];
  for (const f of fracMap) {
    if (Math.abs(frac - f.value) < 0.04) {
      return whole > 0 ? `${whole} ${f.label}` : f.label;
    }
  }
  // Otherwise round to 2 decimals, trim trailing zeros.
  return scaled
    .toFixed(2)
    .replace(/\.?0+$/, "");
}

export function IngredientList({
  recipeId,
  ingredients,
  scale = 1,
}: IngredientListProps) {
  const [composing, setComposing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftQty, setDraftQty] = useState("");
  const [draftUnit, setDraftUnit] = useState("");
  const [draftName, setDraftName] = useState("");

  const createIng = useCreateIngredient();
  const updateIng = useUpdateIngredient();
  const deleteIng = useDeleteIngredient();
  const confirm = useConfirm();

  const resetDraft = () => {
    setDraftQty("");
    setDraftUnit("");
    setDraftName("");
  };

  const startCompose = () => {
    setEditingId(null);
    resetDraft();
    setComposing(true);
  };

  const startEdit = (ing: Ingredient) => {
    setComposing(false);
    setEditingId(ing.id);
    setDraftQty(ing.quantity ?? "");
    setDraftUnit(ing.unit ?? "");
    setDraftName(ing.name);
  };

  const cancel = () => {
    setComposing(false);
    setEditingId(null);
    resetDraft();
  };

  const save = async () => {
    const trimmedName = draftName.trim();
    if (!trimmedName) {
      toast.error("Ingredient name is required");
      return;
    }
    const qty = draftQty.trim() ? parseFloat(draftQty) : null;
    if (draftQty.trim() && (qty == null || isNaN(qty))) {
      toast.error("Quantity must be a number");
      return;
    }
    const data = {
      quantity: qty,
      unit: draftUnit.trim() || null,
      name: trimmedName,
    };
    try {
      if (editingId) {
        await updateIng.mutateAsync({
          recipeId,
          itemId: editingId,
          data,
        });
        toast.success("Ingredient updated");
      } else {
        await createIng.mutateAsync({
          recipeId,
          data: {
            ...data,
            sortOrder: ingredients.length,
          },
        });
        toast.success("Ingredient added");
      }
      cancel();
    } catch {
      toast.error("Failed to save ingredient");
    }
  };

  const handleDelete = async (id: string) => {
    if (
      !(await confirm({
        title: "Delete this ingredient?",
        destructive: true,
      }))
    ) {
      return;
    }
    try {
      await deleteIng.mutateAsync({ recipeId, itemId: id });
      toast.success("Ingredient deleted");
    } catch {
      toast.error("Failed to delete");
    }
  };

  const editor = (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border/60 bg-muted/30 px-3 py-2">
      <Input
        value={draftQty}
        onChange={(e) => setDraftQty(e.target.value)}
        placeholder="2"
        className="h-8 w-16 tabular-nums"
        inputMode="decimal"
      />
      <Input
        value={draftUnit}
        onChange={(e) => setDraftUnit(e.target.value)}
        placeholder="cups"
        className="h-8 w-24"
      />
      <Input
        value={draftName}
        onChange={(e) => setDraftName(e.target.value)}
        placeholder="Ingredient name"
        className="h-8 flex-1 min-w-[160px]"
        autoFocus
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            save();
          }
          if (e.key === "Escape") cancel();
        }}
      />
      <Button
        size="icon-sm"
        onClick={save}
        disabled={createIng.isPending || updateIng.isPending}
        aria-label="Save"
      >
        <Check className="h-3.5 w-3.5" />
      </Button>
      <Button size="icon-sm" variant="ghost" onClick={cancel} aria-label="Cancel">
        <X className="h-3.5 w-3.5" />
      </Button>
    </div>
  );

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-serif text-[18px] font-medium leading-tight tracking-tight">
          Ingredients
        </h3>
        {!composing && !editingId && (
          <Button size="sm" variant="outline" onClick={startCompose}>
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Add
          </Button>
        )}
      </div>

      {ingredients.length === 0 && !composing ? (
        <p className="text-sm text-muted-foreground">
          No ingredients yet. Add the first one above.
        </p>
      ) : (
        <ul className="space-y-1.5">
          {ingredients.map((ing) =>
            editingId === ing.id ? (
              <li key={ing.id}>{editor}</li>
            ) : (
              <li
                key={ing.id}
                className="group flex items-center gap-3 rounded-md px-2 py-1.5 transition-colors hover:bg-accent/40"
              >
                <span className="flex-1 text-[13.5px] leading-tight">
                  <span className="font-medium tabular-nums">
                    {formatScaledQuantity(ing.quantity, scale)}
                    {ing.unit ? ` ${ing.unit}` : ""}
                  </span>
                  {(ing.quantity || ing.unit) && " "}
                  <span>{ing.name}</span>
                </span>
                <div className="flex shrink-0 gap-0.5 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => startEdit(ing)}
                    aria-label={`Edit ${ing.name}`}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="text-destructive"
                    onClick={() => handleDelete(ing.id)}
                    aria-label={`Delete ${ing.name}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </li>
            ),
          )}
        </ul>
      )}

      {composing && <div className="mt-2">{editor}</div>}
    </div>
  );
}

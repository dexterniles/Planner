"use client";

import { useState } from "react";
import { Check, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  useBillCategories,
  useCreateBillCategory,
  useDeleteBillCategory,
  useUpdateBillCategory,
} from "@/lib/hooks/use-bill-categories";
import { defaultCategoryColor } from "@/components/bills/bill-utils";
import { ColorTile } from "@/components/ui/color-tile";
import { toast } from "sonner";

const COLORS = [
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

interface Category {
  id: string;
  name: string;
  color: string | null;
}

export function BillCategoriesSettings() {
  const { data: categories, isLoading } = useBillCategories();
  const createCat = useCreateBillCategory();
  const updateCat = useUpdateBillCategory();
  const deleteCat = useDeleteBillCategory();

  const [composing, setComposing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [color, setColor] = useState(COLORS[0]);

  const resetForm = () => {
    setComposing(false);
    setEditingId(null);
    setName("");
    setColor(COLORS[0]);
  };

  const startEdit = (cat: Category) => {
    setEditingId(cat.id);
    setComposing(false);
    setName(cat.name);
    setColor(cat.color ?? COLORS[0]);
  };

  const handleSave = async () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    try {
      if (editingId) {
        await updateCat.mutateAsync({
          id: editingId,
          data: { name: trimmed, color },
        });
        toast.success("Category updated");
      } else {
        await createCat.mutateAsync({ name: trimmed, color });
        toast.success("Category created");
      }
      resetForm();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this category? Bills using it become uncategorized.")) return;
    try {
      await deleteCat.mutateAsync(id);
      toast.success("Category deleted");
    } catch {
      toast.error("Failed to delete");
    }
  };

  return (
    <div>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex-1">
          <h2 className="font-serif text-[20px] font-medium leading-tight tracking-tight">Bill Categories</h2>
          <p className="mt-1 text-[13px] text-muted-foreground">
            Create your own — Housing, Subscriptions, Car… whatever fits your bills.
          </p>
        </div>
        {!composing && !editingId && (
          <Button size="sm" onClick={() => setComposing(true)}>
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            New
          </Button>
        )}
      </div>

      {(composing || editingId) && (
        <Card className="p-3 mb-3 space-y-3">
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
                  handleSave();
                }
                if (e.key === "Escape") resetForm();
              }}
            />
            <Button
              size="icon-sm"
              onClick={handleSave}
              disabled={
                !name.trim() || createCat.isPending || updateCat.isPending
              }
              aria-label="Save"
            >
              <Check className="h-3.5 w-3.5" />
            </Button>
            <Button
              size="icon-sm"
              variant="ghost"
              onClick={resetForm}
              aria-label="Cancel"
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className={`h-6 w-6 rounded-full border-2 transition-transform ${
                  color === c
                    ? "border-foreground scale-110"
                    : "border-transparent"
                }`}
                style={{ backgroundColor: c }}
                aria-label={`Select color ${c}`}
              />
            ))}
          </div>
        </Card>
      )}

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : !categories || categories.length === 0 ? (
        !composing && (
          <p className="text-sm text-muted-foreground">
            No categories yet. Add one or create them on the fly from the Bills
            page.
          </p>
        )
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {(categories as Category[]).map((cat) => (
            <ColorTile
              key={cat.id}
              color={cat.color ?? defaultCategoryColor}
              name={cat.name}
              onEdit={() => startEdit(cat)}
              onDelete={() => handleDelete(cat.id)}
              ariaPrefix="category"
            />
          ))}
        </div>
      )}
    </div>
  );
}

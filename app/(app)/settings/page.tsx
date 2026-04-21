"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { useTags, useCreateTag, useUpdateTag, useDeleteTag } from "@/lib/hooks/use-tags";
import { Skeleton } from "@/components/ui/skeleton";
import { PayScheduleSettings } from "@/components/bills/pay-schedule-settings";
import { BillCategoriesSettings } from "@/components/bills/bill-categories-settings";
import { toast } from "sonner";

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

interface Tag {
  id: string;
  name: string;
  color: string | null;
}

export default function SettingsPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [tagName, setTagName] = useState("");
  const [tagColor, setTagColor] = useState(TAG_COLORS[0]);

  const { data: tags, isLoading } = useTags();
  const createTag = useCreateTag();
  const updateTag = useUpdateTag();
  const deleteTag = useDeleteTag();

  const openDialog = (tag?: Tag) => {
    if (tag) {
      setEditingTag(tag);
      setTagName(tag.name);
      setTagColor(tag.color ?? TAG_COLORS[0]);
    } else {
      setEditingTag(null);
      setTagName("");
      setTagColor(TAG_COLORS[0]);
    }
    setDialogOpen(true);
  };

  const handleSaveTag = async () => {
    if (!tagName.trim()) return;
    try {
      if (editingTag) {
        await updateTag.mutateAsync({
          id: editingTag.id,
          data: { name: tagName.trim(), color: tagColor },
        });
        toast.success("Tag updated");
      } else {
        await createTag.mutateAsync({ name: tagName.trim(), color: tagColor });
        toast.success("Tag created");
      }
      setDialogOpen(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to save tag",
      );
    }
  };

  const handleDeleteTag = async (id: string) => {
    if (!confirm("Delete this tag?")) return;
    try {
      await deleteTag.mutateAsync(id);
      toast.success("Tag deleted");
    } catch {
      toast.error("Failed to delete tag");
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold">Settings</h1>

      <Separator />

      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold">Tags</h2>
            <p className="text-sm text-muted-foreground">
              Labels for organizing items.
            </p>
          </div>
          <Button size="sm" onClick={() => openDialog()}>
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            New Tag
          </Button>
        </div>

        {isLoading ? (
          <div className="flex flex-wrap gap-2">
            <Skeleton className="h-10 w-24 rounded-xl" />
            <Skeleton className="h-10 w-28 rounded-xl" />
            <Skeleton className="h-10 w-20 rounded-xl" />
          </div>
        ) : tags?.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No tags yet. Create tags to categorize your items.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {tags?.map((tag: Tag) => (
              <Card
                key={tag.id}
                className="group flex items-center gap-2 px-3 py-2"
              >
                <div
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: tag.color ?? "#6B7280" }}
                />
                <span className="text-sm font-medium">{tag.name}</span>
                <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => openDialog(tag)}
                  >
                    <Pencil className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    className="text-destructive"
                    onClick={() => handleDeleteTag(tag.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Separator />

      <PayScheduleSettings />

      <Separator />

      <BillCategoriesSettings />

      <Separator />

      <div>
        <div className="mb-4">
          <h2 className="text-lg font-semibold">Export</h2>
          <p className="text-sm text-muted-foreground">
            JSON is a full backup. CSV is an items summary.
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => window.open("/api/export?format=json", "_blank")}
          >
            <Download className="mr-1.5 h-3.5 w-3.5" />
            Export JSON
          </Button>
          <Button
            variant="outline"
            onClick={() => window.open("/api/export?format=csv", "_blank")}
          >
            <Download className="mr-1.5 h-3.5 w-3.5" />
            Export CSV
          </Button>
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {editingTag ? "Edit Tag" : "New Tag"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="tag-name">Name</Label>
              <Input
                id="tag-name"
                value={tagName}
                onChange={(e) => setTagName(e.target.value)}
                placeholder="e.g. Important"
                onKeyDown={(e) => e.key === "Enter" && handleSaveTag()}
              />
            </div>
            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex gap-2">
                {TAG_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className="h-7 w-7 rounded-full border-2 transition-transform hover:scale-110"
                    style={{
                      backgroundColor: color,
                      borderColor:
                        tagColor === color ? "currentColor" : "transparent",
                    }}
                    onClick={() => setTagColor(color)}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>
              Cancel
            </DialogClose>
            <Button
              onClick={handleSaveTag}
              disabled={
                !tagName.trim() ||
                createTag.isPending ||
                updateTag.isPending
              }
            >
              {createTag.isPending || updateTag.isPending
                ? "Saving..."
                : editingTag
                  ? "Update"
                  : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

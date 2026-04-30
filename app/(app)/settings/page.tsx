"use client";

import { useEffect, useState } from "react";
import { Plus, Download } from "lucide-react";
import { ColorTile } from "@/components/ui/color-tile";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  POMODORO_STORAGE_KEY,
  POMODORO_DEFAULT_MINUTES,
  POMODORO_MIN_MINUTES,
  POMODORO_MAX_MINUTES,
} from "@/components/layout/timer";
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
import { EventCategoriesSettings } from "@/components/events/event-categories-settings";
import { PageHeader } from "@/components/layout/page-header";
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
  const confirm = useConfirm();

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
    if (
      !(await confirm({
        title: "Delete this tag?",
        description:
          "Items currently tagged with it will lose the association.",
        destructive: true,
      }))
    ) {
      return;
    }
    try {
      await deleteTag.mutateAsync(id);
      toast.success("Tag deleted");
    } catch {
      toast.error("Failed to delete tag");
    }
  };

  return (
    <div className="max-w-3xl">
      <PageHeader title="Settings" />

      <div className="space-y-10">

      <section>
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="font-serif text-[20px] font-medium leading-tight tracking-tight">Tags</h2>
            <p className="mt-1 text-[13px] text-muted-foreground">
              Labels for organizing items.
            </p>
          </div>
          <Button size="sm" onClick={() => openDialog()}>
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            New Tag
          </Button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            <Skeleton className="h-[80px] w-full rounded-xl" />
            <Skeleton className="h-[80px] w-full rounded-xl" />
            <Skeleton className="h-[80px] w-full rounded-xl" />
            <Skeleton className="h-[80px] w-full rounded-xl" />
          </div>
        ) : tags?.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No tags yet. Create tags to categorize your items.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {tags?.map((tag: Tag) => (
              <ColorTile
                key={tag.id}
                color={tag.color ?? "#6B7280"}
                name={tag.name}
                onEdit={() => openDialog(tag)}
                onDelete={() => handleDeleteTag(tag.id)}
                ariaPrefix="tag"
              />
            ))}
          </div>
        )}
      </section>

      <section>
        <PayScheduleSettings />
      </section>

      <section>
        <BillCategoriesSettings />
      </section>

      <section>
        <EventCategoriesSettings />
      </section>

      <section>
        <PomodoroLengthSetting />
      </section>

      <section>
        <div className="mb-4">
          <h2 className="font-serif text-[20px] font-medium leading-tight tracking-tight">Export</h2>
          <p className="mt-1 text-[13px] text-muted-foreground">
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
      </section>

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
    </div>
  );
}

function PomodoroLengthSetting() {
  const [value, setValue] = useState<string>(String(POMODORO_DEFAULT_MINUTES));

  useEffect(() => {
    const raw = window.localStorage.getItem(POMODORO_STORAGE_KEY);
    if (raw) {
      const n = parseInt(raw, 10);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- read localStorage after hydration
      if (Number.isFinite(n)) setValue(String(n));
    }
  }, []);

  const commit = (next: string) => {
    setValue(next);
    const n = parseInt(next, 10);
    if (!Number.isFinite(n)) return;
    const clamped = Math.min(
      POMODORO_MAX_MINUTES,
      Math.max(POMODORO_MIN_MINUTES, n),
    );
    window.localStorage.setItem(POMODORO_STORAGE_KEY, String(clamped));
  };

  return (
    <div>
      <div className="mb-4">
        <h2 className="font-serif text-[20px] font-medium leading-tight tracking-tight">
          Timer
        </h2>
        <p className="mt-1 text-[13px] text-muted-foreground">
          Pomodoro length in minutes ({POMODORO_MIN_MINUTES}–
          {POMODORO_MAX_MINUTES}). Stored locally.
        </p>
      </div>
      <div className="flex items-end gap-3">
        <div className="space-y-2">
          <Label htmlFor="pomodoro-minutes">Pomodoro length</Label>
          <Input
            id="pomodoro-minutes"
            type="number"
            min={POMODORO_MIN_MINUTES}
            max={POMODORO_MAX_MINUTES}
            value={value}
            onChange={(e) => commit(e.target.value)}
            className="w-28"
          />
        </div>
        <span className="pb-2 text-[13px] text-muted-foreground">minutes</span>
      </div>
    </div>
  );
}

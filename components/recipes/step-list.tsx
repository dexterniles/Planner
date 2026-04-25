"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, Check, X, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  useCreateStep,
  useUpdateStep,
  useDeleteStep,
} from "@/lib/hooks/use-recipes";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { toast } from "sonner";

export interface Step {
  id: string;
  sortOrder: number;
  body: string;
  durationMinutes: number | null;
}

interface StepListProps {
  recipeId: string;
  steps: Step[];
}

export function StepList({ recipeId, steps }: StepListProps) {
  const [composing, setComposing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftBody, setDraftBody] = useState("");
  const [draftDuration, setDraftDuration] = useState("");

  const createStep = useCreateStep();
  const updateStep = useUpdateStep();
  const deleteStep = useDeleteStep();
  const confirm = useConfirm();

  const resetDraft = () => {
    setDraftBody("");
    setDraftDuration("");
  };

  const startCompose = () => {
    setEditingId(null);
    resetDraft();
    setComposing(true);
  };

  const startEdit = (s: Step) => {
    setComposing(false);
    setEditingId(s.id);
    setDraftBody(s.body);
    setDraftDuration(s.durationMinutes != null ? String(s.durationMinutes) : "");
  };

  const cancel = () => {
    setComposing(false);
    setEditingId(null);
    resetDraft();
  };

  const save = async () => {
    const body = draftBody.trim();
    if (!body) {
      toast.error("Step description is required");
      return;
    }
    const durationMinutes = draftDuration.trim()
      ? parseInt(draftDuration, 10)
      : null;
    if (
      draftDuration.trim() &&
      (durationMinutes == null || isNaN(durationMinutes) || durationMinutes < 0)
    ) {
      toast.error("Duration must be a positive number");
      return;
    }

    const data = { body, durationMinutes };
    try {
      if (editingId) {
        await updateStep.mutateAsync({ recipeId, itemId: editingId, data });
        toast.success("Step updated");
      } else {
        const nextSortOrder =
          steps.length > 0
            ? Math.max(...steps.map((s) => s.sortOrder)) + 1
            : 0;
        await createStep.mutateAsync({
          recipeId,
          data: { ...data, sortOrder: nextSortOrder },
        });
        toast.success("Step added");
      }
      cancel();
    } catch {
      toast.error("Failed to save step");
    }
  };

  const handleDelete = async (id: string) => {
    if (
      !(await confirm({
        title: "Delete this step?",
        destructive: true,
      }))
    ) {
      return;
    }
    try {
      await deleteStep.mutateAsync({ recipeId, itemId: id });
      toast.success("Step deleted");
    } catch {
      toast.error("Failed to delete");
    }
  };

  const editor = (
    <div className="space-y-2 rounded-lg border border-border/60 bg-muted/30 p-3">
      <Textarea
        value={draftBody}
        onChange={(e) => setDraftBody(e.target.value)}
        placeholder="Describe the step..."
        rows={3}
        autoFocus
      />
      <div className="flex items-center gap-2">
        <Input
          value={draftDuration}
          onChange={(e) => setDraftDuration(e.target.value)}
          placeholder="Duration (min)"
          className="h-8 w-36 tabular-nums"
          inputMode="numeric"
        />
        <div className="ml-auto flex gap-1">
          <Button size="sm" variant="ghost" onClick={cancel}>
            <X className="mr-1.5 h-3.5 w-3.5" />
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={save}
            disabled={createStep.isPending || updateStep.isPending}
          >
            <Check className="mr-1.5 h-3.5 w-3.5" />
            Save
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-serif text-[18px] font-medium leading-tight tracking-tight">
          Method
        </h3>
        {!composing && !editingId && (
          <Button size="sm" variant="outline" onClick={startCompose}>
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Add Step
          </Button>
        )}
      </div>

      {steps.length === 0 && !composing ? (
        <p className="text-sm text-muted-foreground">
          No steps yet. Walk through the method one step at a time.
        </p>
      ) : (
        <ol className="space-y-2.5">
          {steps.map((s, idx) =>
            editingId === s.id ? (
              <li key={s.id}>{editor}</li>
            ) : (
              <li key={s.id} className="group flex gap-3">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 font-mono text-[11px] font-medium tabular-nums text-primary">
                  {idx + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] leading-relaxed whitespace-pre-wrap">
                    {s.body}
                  </p>
                  {s.durationMinutes != null && (
                    <p className="mt-1 flex items-center gap-1 text-[11.5px] text-muted-foreground tabular-nums">
                      <Clock className="h-3 w-3" strokeWidth={1.75} />
                      {s.durationMinutes} min
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 gap-0.5 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => startEdit(s)}
                    aria-label="Edit step"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="text-destructive"
                    onClick={() => handleDelete(s.id)}
                    aria-label="Delete step"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </li>
            ),
          )}
        </ol>
      )}

      {composing && <div className="mt-3">{editor}</div>}
    </div>
  );
}

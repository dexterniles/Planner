"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, Check, Flag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  useMilestones,
  useUpdateMilestone,
  useDeleteMilestone,
} from "@/lib/hooks/use-milestones";
import { MilestoneDialog } from "./milestone-dialog";
import { toast } from "sonner";

interface MilestoneListProps {
  projectId: string;
}

interface Milestone {
  id: string;
  title: string;
  description: string | null;
  targetDate: string | null;
  completedAt: string | null;
}

export function MilestoneList({ projectId }: MilestoneListProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMilestone, setEditingMilestone] =
    useState<Milestone | null>(null);
  const { data: milestones, isLoading } = useMilestones(projectId);
  const updateMilestone = useUpdateMilestone();
  const deleteMilestone = useDeleteMilestone();

  const handleToggleComplete = async (milestone: Milestone) => {
    try {
      await updateMilestone.mutateAsync({
        id: milestone.id,
        data: {
          completedAt: milestone.completedAt
            ? null
            : new Date().toISOString(),
        },
      });
      toast.success(
        milestone.completedAt ? "Milestone reopened" : "Milestone completed!",
      );
    } catch {
      toast.error("Failed to update milestone");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this milestone?")) return;
    try {
      await deleteMilestone.mutateAsync(id);
      toast.success("Milestone deleted");
    } catch {
      toast.error("Failed to delete milestone");
    }
  };

  if (isLoading) return <p className="text-muted-foreground">Loading...</p>;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold">Milestones</h3>
        <Button
          size="sm"
          onClick={() => {
            setEditingMilestone(null);
            setDialogOpen(true);
          }}
        >
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          Add
        </Button>
      </div>

      {milestones?.length === 0 ? (
        <div className="flex flex-col items-center py-10 text-center">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500/15 to-amber-500/5">
            <Flag className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          </div>
          <p className="text-sm text-muted-foreground">
            Set key milestones to mark progress on the big stuff.
          </p>
        </div>
      ) : (
        <div className="grid gap-3">
          {milestones?.map((ms: Milestone) => (
            <Card
              key={ms.id}
              className={`group p-4 ${ms.completedAt ? "opacity-60" : ""}`}
            >
              <div className="flex items-start gap-3">
                <button
                  onClick={() => handleToggleComplete(ms)}
                  className={`group/check relative mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-200 ${
                    ms.completedAt
                      ? "border-emerald-500 bg-gradient-to-br from-emerald-400 to-emerald-500 text-white"
                      : "border-muted-foreground/60 hover:border-emerald-500 hover:scale-110"
                  }`}
                  aria-label={
                    ms.completedAt
                      ? "Mark milestone as incomplete"
                      : "Mark milestone as complete"
                  }
                >
                  {ms.completedAt && (
                    <Check key={ms.completedAt} className="h-3 w-3 check-burst" strokeWidth={3} />
                  )}
                </button>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Flag className="h-4 w-4 text-muted-foreground" />
                    <h4
                      className={`font-medium transition-all duration-300 ${ms.completedAt ? "line-through text-muted-foreground" : ""}`}
                    >
                      {ms.title}
                    </h4>
                  </div>
                  {ms.description && (
                    <p className="mt-1 text-sm text-muted-foreground">
                      {ms.description}
                    </p>
                  )}
                  <div className="mt-1 flex gap-3 text-xs text-muted-foreground">
                    {ms.targetDate && (
                      <span>
                        Target:{" "}
                        {new Date(ms.targetDate).toLocaleDateString()}
                      </span>
                    )}
                    {ms.completedAt && (
                      <span>
                        Completed:{" "}
                        {new Date(ms.completedAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-1 md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => {
                      setEditingMilestone(ms);
                      setDialogOpen(true);
                    }}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="text-destructive"
                    onClick={() => handleDelete(ms.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <MilestoneDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        projectId={projectId}
        milestone={editingMilestone ?? undefined}
      />
    </div>
  );
}

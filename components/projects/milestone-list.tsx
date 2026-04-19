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
        <p className="text-sm text-muted-foreground">
          No milestones yet. Add milestones to track key deliverables.
        </p>
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
                  className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                    ms.completedAt
                      ? "border-green-500 bg-green-500 text-white"
                      : "border-muted-foreground hover:border-green-500"
                  }`}
                >
                  {ms.completedAt && <Check className="h-3 w-3" />}
                </button>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Flag className="h-4 w-4 text-muted-foreground" />
                    <h4
                      className={`font-medium ${ms.completedAt ? "line-through" : ""}`}
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
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
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

"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, Check, Flag } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  useMilestones,
  useUpdateMilestone,
  useDeleteMilestone,
} from "@/lib/hooks/use-milestones";
import { MilestoneDialog } from "./milestone-dialog";
import { useConfirm } from "@/components/ui/confirm-dialog";
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
  const [editingMilestone, setEditingMilestone] = useState<Milestone | null>(
    null,
  );
  const { data: milestones, isLoading } = useMilestones(projectId);
  const updateMilestone = useUpdateMilestone();
  const deleteMilestone = useDeleteMilestone();
  const confirm = useConfirm();

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
    if (
      !(await confirm({
        title: "Delete this milestone?",
        destructive: true,
      }))
    ) {
      return;
    }
    try {
      await deleteMilestone.mutateAsync(id);
      toast.success("Milestone deleted");
    } catch {
      toast.error("Failed to delete milestone");
    }
  };

  if (isLoading) return <p className="text-muted-foreground">Loading...</p>;

  const rows = (milestones ?? []) as Milestone[];

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-serif text-[20px] font-medium leading-tight tracking-tight">
          Milestones
        </h3>
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

      {rows.length === 0 ? (
        <div className="flex flex-col items-center py-10 text-center">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <Flag className="h-4 w-4 text-primary" strokeWidth={1.75} />
          </div>
          <p className="text-sm text-muted-foreground">
            Set key milestones to mark progress on the big stuff.
          </p>
        </div>
      ) : (
        <ol className="relative space-y-5 pl-7">
          {/* Vertical line */}
          <span
            aria-hidden="true"
            className="absolute left-[9px] top-2 bottom-2 w-px bg-border"
          />
          {rows.map((ms) => {
            const done = !!ms.completedAt;
            return (
              <li key={ms.id} className="group relative">
                {/* Timeline dot */}
                <button
                  onClick={() => handleToggleComplete(ms)}
                  aria-label={
                    done
                      ? "Mark milestone as incomplete"
                      : "Mark milestone as complete"
                  }
                  className={`absolute -left-7 top-0.5 flex h-[19px] w-[19px] items-center justify-center rounded-full border-2 transition-all ring-4 ring-background ${
                    done
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-muted-foreground/40 bg-card hover:border-primary hover:scale-110"
                  }`}
                >
                  {done && (
                    <Check
                      key={ms.completedAt}
                      className="h-3 w-3 check-burst"
                      strokeWidth={3}
                    />
                  )}
                </button>

                <div
                  className={`flex items-start gap-3 transition-opacity ${done ? "opacity-60" : ""}`}
                >
                  <div className="min-w-0 flex-1">
                    <h4
                      className={`font-serif text-[16px] font-medium leading-tight tracking-tight ${done ? "line-through" : ""}`}
                    >
                      {ms.title}
                    </h4>
                    {ms.description && (
                      <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
                        {ms.description}
                      </p>
                    )}
                    <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 font-mono text-[11px] text-muted-foreground">
                      {ms.targetDate && (
                        <span>
                          target{" "}
                          <span className="tabular-nums">
                            {new Date(ms.targetDate).toLocaleDateString()}
                          </span>
                        </span>
                      )}
                      {done && ms.completedAt && (
                        <span>
                          done{" "}
                          <span className="tabular-nums">
                            {new Date(ms.completedAt).toLocaleDateString()}
                          </span>
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex shrink-0 gap-0.5 md:opacity-60 md:group-hover:opacity-100 md:group-focus-within:opacity-100 transition-opacity">
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
              </li>
            );
          })}
        </ol>
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

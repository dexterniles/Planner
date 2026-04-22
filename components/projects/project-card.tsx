"use client";

import Link from "next/link";
import { Pencil, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useDeleteProject } from "@/lib/hooks/use-projects";
import { toast } from "sonner";

interface ProjectCardProps {
  project: {
    id: string;
    name: string;
    description: string | null;
    goal: string | null;
    status: string;
    priority: string;
    startDate: string | null;
    targetDate: string | null;
    color: string | null;
  };
  onEdit: () => void;
}

const statusLabels: Record<string, string> = {
  planning: "Planning",
  active: "Active",
  paused: "Paused",
  done: "Done",
};

const priorityLabels: Record<string, string> = {
  low: "low",
  medium: "med",
  high: "high",
  urgent: "urgent",
};

const priorityColors: Record<string, string> = {
  low: "text-muted-foreground",
  medium: "text-chart-4",
  high: "text-chart-3",
  urgent: "text-destructive",
};

export function ProjectCard({ project, onEdit }: ProjectCardProps) {
  const deleteProject = useDeleteProject();

  const handleDelete = async () => {
    if (!confirm("Delete this project and all its tasks?")) return;
    try {
      await deleteProject.mutateAsync(project.id);
      toast.success("Project deleted");
    } catch {
      toast.error("Failed to delete project");
    }
  };

  const accent = project.color ?? "#8B5CF6";

  return (
    <Card hover className="group relative overflow-hidden p-0">
      <div
        className="absolute inset-y-0 left-0 w-1"
        style={{ backgroundColor: accent }}
        aria-hidden="true"
      />
      <div className="flex items-start gap-4 p-5 pl-6">
        <Link
          href={`/projects/${project.id}`}
          className="flex-1 min-w-0 space-y-1.5"
        >
          <h3 className="font-serif text-[20px] font-medium leading-tight tracking-tight">
            {project.name}
          </h3>
          {project.description && (
            <p className="text-[13px] text-muted-foreground line-clamp-1">
              {project.description}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-muted-foreground">
            <span>
              <span
                className={`mr-1 font-medium ${priorityColors[project.priority] ?? ""}`}
              >
                {priorityLabels[project.priority] ?? project.priority}
              </span>
              priority
            </span>
            {project.targetDate && (
              <>
                <span>·</span>
                <span>
                  due{" "}
                  <span className="text-foreground/80 tabular-nums">
                    {new Date(project.targetDate).toLocaleDateString()}
                  </span>
                </span>
              </>
            )}
          </div>
        </Link>
        <div className="flex items-center gap-1 shrink-0">
          <Badge variant="outline" className="text-[10.5px] capitalize">
            {statusLabels[project.status] ?? project.status}
          </Badge>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onEdit}
            aria-label={`Edit ${project.name}`}
            className="md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100 transition-opacity"
          >
            <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={handleDelete}
            disabled={deleteProject.isPending}
            aria-label={`Delete ${project.name}`}
            className="md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100 transition-opacity text-destructive"
          >
            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
          </Button>
        </div>
      </div>
    </Card>
  );
}

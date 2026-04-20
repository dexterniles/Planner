"use client";

import Link from "next/link";
import { FolderKanban, Pencil, Trash2 } from "lucide-react";
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
  low: "Low",
  medium: "Medium",
  high: "High",
  urgent: "Urgent",
};

const priorityColors: Record<string, string> = {
  low: "text-muted-foreground",
  medium: "text-blue-500",
  high: "text-orange-500",
  urgent: "text-red-500",
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

  return (
    <Card className="group relative overflow-hidden">
      <div
        className="absolute inset-y-0 left-0 w-1"
        style={{ backgroundColor: project.color ?? "#8B5CF6" }}
      />
      <div className="flex items-start justify-between p-4 pl-5">
        <Link
          href={`/projects/${project.id}`}
          className="flex-1 space-y-1 hover:opacity-80"
        >
          <div className="flex items-center gap-2">
            <FolderKanban
              className="h-4 w-4"
              style={{ color: project.color ?? "#8B5CF6" }}
            />
            <h3 className="font-semibold leading-none">{project.name}</h3>
          </div>
          {project.description && (
            <p className="text-sm text-muted-foreground line-clamp-1">
              {project.description}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            {project.targetDate && (
              <span>
                Target: {new Date(project.targetDate).toLocaleDateString()}
              </span>
            )}
          </div>
        </Link>
        <div className="flex items-center gap-1">
          <span
            className={`text-xs font-medium ${priorityColors[project.priority] ?? ""}`}
          >
            {priorityLabels[project.priority] ?? project.priority}
          </span>
          <Badge variant="secondary">
            {statusLabels[project.status] ?? project.status}
          </Badge>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onEdit}
            aria-label={`Edit ${project.name}`}
            className="opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={handleDelete}
            disabled={deleteProject.isPending}
            aria-label={`Delete ${project.name}`}
            className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive"
          >
            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
          </Button>
        </div>
      </div>
    </Card>
  );
}

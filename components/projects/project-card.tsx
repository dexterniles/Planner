"use client";

import Link from "next/link";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  const isDone = project.status === "done";
  const isPaused = project.status === "paused";

  return (
    <Card
      hover
      className={`group relative flex h-full flex-col overflow-hidden p-0 transition-opacity ${
        isPaused ? "opacity-60" : ""
      }`}
    >
      {/* Color band */}
      <Link
        href={`/projects/${project.id}`}
        className="relative block h-[88px] shrink-0"
        style={{ backgroundColor: accent }}
        aria-label={`Open ${project.name}`}
      >
        <span className="absolute left-4 top-3 inline-flex">
          <span
            className={`text-[11px] font-medium uppercase tracking-[0.12em] text-white/85 ${
              priorityColors[project.priority] ?? ""
            }`}
            style={{ color: "rgba(255,255,255,0.85)" }}
          >
            {priorityLabels[project.priority] ?? project.priority} priority
          </span>
        </span>
        <span className="absolute right-3 top-3 inline-flex">
          <Badge
            variant="outline"
            className="border-white/30 bg-white/15 text-[10px] uppercase tracking-[0.08em] text-white backdrop-blur-sm"
          >
            {statusLabels[project.status] ?? project.status}
          </Badge>
        </span>
      </Link>

      {/* Body */}
      <div className="flex flex-1 flex-col p-4">
        <Link
          href={`/projects/${project.id}`}
          className="block flex-1"
          aria-label={`Open ${project.name}`}
        >
          <h3
            className={`font-serif text-[18px] font-medium leading-tight tracking-tight line-clamp-2 ${
              isDone ? "line-through text-muted-foreground" : ""
            }`}
          >
            {project.name}
          </h3>
          {project.description && (
            <p className="mt-1.5 text-[12.5px] text-muted-foreground line-clamp-2">
              {project.description}
            </p>
          )}
          {project.targetDate && (
            <p className="mt-2 font-mono text-[10.5px] tabular-nums text-muted-foreground/80">
              due {new Date(project.targetDate + "T12:00:00").toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          )}
        </Link>

        <div className="mt-3 flex items-center justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Actions for ${project.name}`}
                />
              }
            >
              <MoreHorizontal className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onEdit}>
                <Pencil className="mr-1.5 h-3.5 w-3.5" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                variant="destructive"
                onClick={handleDelete}
                disabled={deleteProject.isPending}
              >
                <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </Card>
  );
}

"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useProjects } from "@/lib/hooks/use-projects";
import { useWorkspaces } from "@/lib/hooks/use-workspaces";
import { ProjectCard } from "@/components/projects/project-card";
import { ProjectDialog } from "@/components/projects/project-dialog";

type Project = {
  id: string;
  name: string;
  description: string | null;
  goal: string | null;
  status: "planning" | "active" | "paused" | "done";
  priority: "low" | "medium" | "high" | "urgent";
  startDate: string | null;
  targetDate: string | null;
  color: string | null;
};

export default function ProjectsPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  const { data: workspaces, isLoading: loadingWorkspaces } = useWorkspaces();
  const projectsWorkspace = workspaces?.find(
    (w: { type: string }) => w.type === "projects",
  );

  const { data: projects, isLoading: loadingProjects } = useProjects(
    projectsWorkspace?.id,
  );

  if (loadingWorkspaces || loadingProjects) {
    return (
      <div>
        <h1 className="text-2xl font-bold">Projects</h1>
        <p className="mt-4 text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!projectsWorkspace) {
    return (
      <div>
        <h1 className="text-2xl font-bold">Projects</h1>
        <p className="mt-4 text-muted-foreground">
          No projects workspace found. Please run the seed script.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Projects</h1>
        <Button
          onClick={() => {
            setEditingProject(null);
            setDialogOpen(true);
          }}
        >
          <Plus className="mr-1.5 h-4 w-4" />
          New Project
        </Button>
      </div>

      {projects?.length === 0 ? (
        <div className="mt-12 text-center">
          <p className="text-muted-foreground">No projects yet.</p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => {
              setEditingProject(null);
              setDialogOpen(true);
            }}
          >
            <Plus className="mr-1.5 h-4 w-4" />
            Start your first project
          </Button>
        </div>
      ) : (
        <div className="mt-6 grid gap-3">
          {projects?.map((project: Project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onEdit={() => {
                setEditingProject(project);
                setDialogOpen(true);
              }}
            />
          ))}
        </div>
      )}

      <ProjectDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        workspaceId={projectsWorkspace.id}
        project={editingProject ?? undefined}
      />
    </div>
  );
}

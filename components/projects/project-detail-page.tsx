"use client";

import { ArrowLeft } from "lucide-react";
import { BackLink } from "@/components/layout/back-link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useProject } from "@/lib/hooks/use-projects";
import { TaskList } from "@/components/projects/task-list";
import { MilestoneList } from "@/components/projects/milestone-list";
import { ProjectSnapshot } from "@/components/projects/project-snapshot";
import { TimerStartButton } from "@/components/layout/timer";
import { TimeLogHistory } from "@/components/time-log-history";
import { NotesList } from "@/components/notes-list";
import { Skeleton } from "@/components/ui/skeleton";

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

interface ProjectDetailPageProps {
  projectId: string;
}

export function ProjectDetailPage({ projectId }: ProjectDetailPageProps) {
  const { data: project, isLoading } = useProject(projectId);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-start gap-4">
          <Skeleton className="h-8 w-8 rounded-lg" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-7 w-64" />
            <Skeleton className="h-4 w-96" />
          </div>
        </div>
        <Skeleton className="h-9 w-60 rounded-lg" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!project) {
    return (
      <div>
        <p className="text-muted-foreground">Project not found.</p>
        <BackLink href="/projects">
          <Button variant="outline" className="mt-4">
            Back to Projects
          </Button>
        </BackLink>
      </div>
    );
  }

  return (
    <div>
      <BackLink
        href="/projects"
        className="mb-3 inline-flex items-center gap-1.5 text-[12.5px] text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.75} />
        Projects
      </BackLink>

      <div className="mb-7 flex flex-col gap-3 border-b border-border pb-5 md:flex-row md:items-end md:justify-between md:gap-6">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <span
              className="h-3 w-3 shrink-0 rounded-full"
              style={{ backgroundColor: project.color ?? "#8B5CF6" }}
              aria-hidden="true"
            />
            <h1 className="font-serif text-[26px] md:text-[34px] font-medium leading-tight tracking-tight">
              {project.name}
            </h1>
            <Badge variant="outline" className="text-[10.5px]">
              {statusLabels[project.status] ?? project.status}
            </Badge>
          </div>
          {project.description && (
            <p className="mt-2.5 text-[13px] text-muted-foreground">
              {project.description}
            </p>
          )}
          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12.5px] text-muted-foreground">
            <span>
              <span
                className={`font-medium ${priorityColors[project.priority] ?? ""}`}
              >
                {priorityLabels[project.priority] ?? project.priority}
              </span>{" "}
              priority
            </span>
            {project.startDate && (
              <>
                <span>·</span>
                <span>
                  started{" "}
                  <span className="text-foreground/80 tabular-nums">
                    {new Date(project.startDate).toLocaleDateString()}
                  </span>
                </span>
              </>
            )}
            {project.targetDate && (
              <>
                <span>·</span>
                <span>
                  target{" "}
                  <span className="text-foreground/80 tabular-nums">
                    {new Date(project.targetDate).toLocaleDateString()}
                  </span>
                </span>
              </>
            )}
            {project.goal && (
              <>
                <span>·</span>
                <span className="italic">{project.goal}</span>
              </>
            )}
          </div>
        </div>
        <TimerStartButton loggableType="project" loggableId={projectId} />
      </div>

      <div className="space-y-6">
      <ProjectSnapshot projectId={projectId} />

      <Tabs defaultValue="tasks">
        <TabsList>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="milestones">Milestones</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
          <TabsTrigger value="time">Time Log</TabsTrigger>
        </TabsList>

        <TabsContent value="tasks" className="mt-4">
          <TaskList projectId={projectId} />
        </TabsContent>

        <TabsContent value="milestones" className="mt-4">
          <MilestoneList projectId={projectId} />
        </TabsContent>

        <TabsContent value="notes" className="mt-4">
          <NotesList parentType="project" parentId={projectId} />
        </TabsContent>

        <TabsContent value="time" className="mt-4">
          <TimeLogHistory loggableType="project" loggableId={projectId} />
        </TabsContent>
      </Tabs>
      </div>
    </div>
  );
}

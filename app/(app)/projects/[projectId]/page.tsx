"use client";

import { use } from "react";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useProject } from "@/lib/hooks/use-projects";
import { TaskList } from "@/components/projects/task-list";
import { MilestoneList } from "@/components/projects/milestone-list";
import { TimerStartButton } from "@/components/layout/timer";
import { TimeLogHistory } from "@/components/time-log-history";

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

export default function ProjectDetailPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = use(params);
  const { data: project, isLoading } = useProject(projectId);

  if (isLoading) {
    return (
      <div>
        <p className="text-muted-foreground">Loading project...</p>
      </div>
    );
  }

  if (!project) {
    return (
      <div>
        <p className="text-muted-foreground">Project not found.</p>
        <Link href="/projects">
          <Button variant="outline" className="mt-4">
            Back to Projects
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4">
        <Link href="/projects">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2 md:gap-3">
            <div
              className="h-3 w-3 rounded-full shrink-0"
              style={{ backgroundColor: project.color ?? "#8B5CF6" }}
            />
            <h1 className="text-xl md:text-2xl font-bold">{project.name}</h1>
            <Badge variant="secondary">
              {statusLabels[project.status] ?? project.status}
            </Badge>
            <TimerStartButton loggableType="project" loggableId={projectId} />
            <span
              className={`text-sm font-medium ${priorityColors[project.priority] ?? ""}`}
            >
              {priorityLabels[project.priority] ?? project.priority}
            </span>
          </div>
          <div className="mt-1 flex flex-wrap gap-3 text-sm text-muted-foreground">
            {project.description && <span>{project.description}</span>}
          </div>
          <div className="mt-1 flex flex-wrap gap-3 text-xs text-muted-foreground">
            {project.startDate && (
              <span>
                Started: {new Date(project.startDate).toLocaleDateString()}
              </span>
            )}
            {project.targetDate && (
              <span>
                Target: {new Date(project.targetDate).toLocaleDateString()}
              </span>
            )}
            {project.goal && <span>Goal: {project.goal}</span>}
          </div>
        </div>
      </div>

      <Tabs defaultValue="tasks">
        <TabsList>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="milestones">Milestones</TabsTrigger>
          <TabsTrigger value="time">Time Log</TabsTrigger>
        </TabsList>

        <TabsContent value="tasks" className="mt-4">
          <TaskList projectId={projectId} />
        </TabsContent>

        <TabsContent value="milestones" className="mt-4">
          <MilestoneList projectId={projectId} />
        </TabsContent>

        <TabsContent value="time" className="mt-4">
          <TimeLogHistory loggableType="project" loggableId={projectId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { redirect } from "next/navigation";
import { getServerAuth } from "@/lib/server/auth";
import { getQueryClient } from "@/lib/server/get-query-client";
import { prefetch } from "@/lib/server/prefetch";
import { getProjectById } from "@/lib/server/data/projects";
import { getTasks } from "@/lib/server/data/tasks";
import { getMilestones } from "@/lib/server/data/milestones";
import { getTimeLogs } from "@/lib/server/data/time-logs";
import { ProjectDetailPage } from "@/components/projects/project-detail-page";

export default async function Page({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const auth = await getServerAuth();
  if (!auth.ok) redirect("/login");
  const { userId } = auth;

  const queryClient = getQueryClient();

  await Promise.all([
    prefetch(queryClient, ["projects", projectId], () =>
      getProjectById(userId, projectId),
    ),
    prefetch(queryClient, ["tasks", projectId], () =>
      getTasks(userId, { projectId }),
    ),
    prefetch(queryClient, ["milestones", projectId], () =>
      getMilestones(userId, { projectId }),
    ),
    prefetch(queryClient, ["time-logs", "project", projectId], () =>
      getTimeLogs(userId, { loggableType: "project", loggableId: projectId }),
    ),
  ]);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ProjectDetailPage projectId={projectId} />
    </HydrationBoundary>
  );
}

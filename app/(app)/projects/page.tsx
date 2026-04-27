import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { redirect } from "next/navigation";
import { getServerAuth } from "@/lib/server/auth";
import { getQueryClient } from "@/lib/server/get-query-client";
import { prefetch } from "@/lib/server/prefetch";
import { getWorkspaces } from "@/lib/server/data/workspaces";
import { getProjects } from "@/lib/server/data/projects";
import { ProjectsPage } from "@/components/projects/projects-page";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ workspace?: string }>;
}) {
  const sp = await searchParams;
  const requestedWorkspace = sp.workspace;

  const auth = await getServerAuth();
  if (!auth.ok) redirect("/login");
  const { userId } = auth;

  const queryClient = getQueryClient();

  const workspaces = await getWorkspaces(userId);
  queryClient.setQueryData(
    ["workspaces"],
    JSON.parse(JSON.stringify(workspaces)),
  );

  const projectsWorkspace =
    workspaces.find(
      (w) => w.id === requestedWorkspace && w.type === "projects",
    ) ?? workspaces.find((w) => w.type === "projects");

  await prefetch(queryClient, ["projects", projectsWorkspace?.id], () =>
    getProjects(userId, { workspaceId: projectsWorkspace?.id }),
  );

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ProjectsPage />
    </HydrationBoundary>
  );
}

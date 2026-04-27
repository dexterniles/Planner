import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { redirect } from "next/navigation";
import { getServerAuth } from "@/lib/server/auth";
import { getQueryClient } from "@/lib/server/get-query-client";
import { prefetch } from "@/lib/server/prefetch";
import { getWorkspaces } from "@/lib/server/data/workspaces";
import { getCourses } from "@/lib/server/data/courses";
import { AcademicPage } from "@/components/academic/academic-page";

export default async function Page() {
  const auth = await getServerAuth();
  if (!auth.ok) redirect("/login");
  const { userId } = auth;

  const queryClient = getQueryClient();

  const workspaces = await getWorkspaces(userId);
  queryClient.setQueryData(
    ["workspaces"],
    JSON.parse(JSON.stringify(workspaces)),
  );

  const academicWorkspace = workspaces.find((w) => w.type === "academic");

  await prefetch(queryClient, ["courses", academicWorkspace?.id], () =>
    getCourses(userId, { workspaceId: academicWorkspace?.id }),
  );

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <AcademicPage />
    </HydrationBoundary>
  );
}

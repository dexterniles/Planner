import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { redirect } from "next/navigation";
import { getServerAuth } from "@/lib/server/auth";
import { getQueryClient } from "@/lib/server/get-query-client";
import { prefetch } from "@/lib/server/prefetch";
import { getCourseById } from "@/lib/server/data/courses";
import { getAssignments } from "@/lib/server/data/assignments";
import { getGradeCategories } from "@/lib/server/data/grade-categories";
import { getTimeLogs } from "@/lib/server/data/time-logs";
import { CourseDetailPage } from "@/components/academic/course-detail-page";

export default async function Page({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;
  const auth = await getServerAuth();
  if (!auth.ok) redirect("/login");
  const { userId } = auth;

  const queryClient = getQueryClient();

  await Promise.all([
    prefetch(queryClient, ["courses", courseId], () =>
      getCourseById(userId, courseId),
    ),
    prefetch(queryClient, ["assignments", courseId], () =>
      getAssignments(userId, { courseId }),
    ),
    prefetch(queryClient, ["grade-categories", courseId], () =>
      getGradeCategories(userId, courseId),
    ),
    prefetch(queryClient, ["time-logs", "course", courseId], () =>
      getTimeLogs(userId, { loggableType: "course", loggableId: courseId }),
    ),
  ]);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <CourseDetailPage courseId={courseId} />
    </HydrationBoundary>
  );
}

import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { redirect } from "next/navigation";
import { getServerAuth } from "@/lib/server/auth";
import { getQueryClient } from "@/lib/server/get-query-client";
import { prefetch } from "@/lib/server/prefetch";
import {
  getDashboardStats,
  getDashboardGrades,
} from "@/lib/server/data/dashboard";
import { getAllItems } from "@/lib/server/data/all-items";
import { getUpcomingEvents } from "@/lib/server/data/events";
import { getUpcomingMilestones } from "@/lib/server/data/milestones";
import { getInbox } from "@/lib/server/data/inbox";
import { getBills, getPaySchedule } from "@/lib/server/data/bills";
import { DashboardPage } from "@/components/dashboard/dashboard-page";

export default async function Page() {
  const auth = await getServerAuth();
  if (!auth.ok) redirect("/login");
  const { userId } = auth;

  const queryClient = getQueryClient();

  await Promise.all([
    prefetch(queryClient, ["dashboard", "stats"], () =>
      getDashboardStats(userId),
    ),
    prefetch(queryClient, ["dashboard", "grades"], () =>
      getDashboardGrades(userId),
    ),
    prefetch(queryClient, ["all-items"], () => getAllItems(userId)),
    prefetch(queryClient, ["events", "upcoming", 5], () =>
      getUpcomingEvents(userId, 5),
    ),
    prefetch(queryClient, ["milestones", "upcoming", 3], () =>
      getUpcomingMilestones(userId, 3),
    ),
    prefetch(queryClient, ["inbox"], () => getInbox(userId)),
    prefetch(queryClient, ["pay-schedule"], () => getPaySchedule(userId)),
    prefetch(
      queryClient,
      ["bills", undefined, undefined, undefined, undefined, 500],
      () => getBills(userId, { limit: 500 }),
    ),
  ]);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <DashboardPage />
    </HydrationBoundary>
  );
}

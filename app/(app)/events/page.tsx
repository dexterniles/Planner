import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { redirect } from "next/navigation";
import { getServerAuth } from "@/lib/server/auth";
import { getQueryClient } from "@/lib/server/get-query-client";
import { prefetch } from "@/lib/server/prefetch";
import { getEvents, getEventCategories } from "@/lib/server/data/events";
import { EventsPage } from "@/components/events/events-page";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const sp = await searchParams;
  const categoryId = sp.category || undefined;

  const auth = await getServerAuth();
  if (!auth.ok) redirect("/login");
  const { userId } = auth;

  const queryClient = getQueryClient();

  await Promise.all([
    prefetch(
      queryClient,
      ["events", undefined, undefined, categoryId, undefined, 500],
      () => getEvents(userId, { categoryId, limit: 500 }),
    ),
    prefetch(queryClient, ["event-categories"], () =>
      getEventCategories(userId),
    ),
  ]);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <EventsPage />
    </HydrationBoundary>
  );
}

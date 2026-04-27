import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { redirect } from "next/navigation";
import { getServerAuth } from "@/lib/server/auth";
import { getQueryClient } from "@/lib/server/get-query-client";
import { prefetch } from "@/lib/server/prefetch";
import { getCalendarItemsMonth } from "@/lib/server/data/calendar-items";
import { CalendarPage } from "@/components/calendar/calendar-page";

export default async function Page() {
  const auth = await getServerAuth();
  if (!auth.ok) redirect("/login");
  const { userId } = auth;

  const queryClient = getQueryClient();

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const monthStr = `${year}-${String(month).padStart(2, "0")}`;

  await prefetch(queryClient, ["calendar-items", "month", monthStr], () =>
    getCalendarItemsMonth(userId, { year, month }),
  );

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <CalendarPage />
    </HydrationBoundary>
  );
}

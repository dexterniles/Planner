import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { redirect } from "next/navigation";
import { getServerAuth } from "@/lib/server/auth";
import { getQueryClient } from "@/lib/server/get-query-client";
import { prefetch } from "@/lib/server/prefetch";
import { getCalendarItemsMonth } from "@/lib/server/data/calendar-items";
import { CalendarPage } from "@/components/calendar/calendar-page";

const VIEWS = ["month", "week", "day"] as const;
type View = (typeof VIEWS)[number];

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; date?: string }>;
}) {
  const sp = await searchParams;
  const view: View = VIEWS.includes(sp.view as View)
    ? (sp.view as View)
    : "month";

  const auth = await getServerAuth();
  if (!auth.ok) redirect("/login");
  const { userId } = auth;

  const queryClient = getQueryClient();

  if (view === "month") {
    let date: Date;
    if (sp.date && /^\d{4}-\d{2}-\d{2}$/.test(sp.date)) {
      const parsed = new Date(sp.date + "T12:00:00");
      date = Number.isNaN(parsed.getTime()) ? new Date() : parsed;
    } else {
      date = new Date();
    }
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const monthStr = `${year}-${String(month).padStart(2, "0")}`;
    await prefetch(queryClient, ["calendar-items", "month", monthStr], () =>
      getCalendarItemsMonth(userId, { year, month }),
    );
  }
  // week/day: skip prefetch — server (UTC) and client (local) diverge on the
  // ISO range bounds, so the queryKey wouldn't match the client's. Client fetches.

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <CalendarPage />
    </HydrationBoundary>
  );
}

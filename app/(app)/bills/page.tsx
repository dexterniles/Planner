import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { redirect } from "next/navigation";
import { getServerAuth } from "@/lib/server/auth";
import { getQueryClient } from "@/lib/server/get-query-client";
import { prefetch } from "@/lib/server/prefetch";
import {
  getBills,
  getBillCategories,
  getPaySchedule,
} from "@/lib/server/data/bills";
import { BillsPage } from "@/components/bills/bills-page";

export default async function Page() {
  const auth = await getServerAuth();
  if (!auth.ok) redirect("/login");
  const { userId } = auth;

  const queryClient = getQueryClient();

  await Promise.all([
    prefetch(
      queryClient,
      ["bills", undefined, undefined, undefined, undefined, 500],
      () => getBills(userId, { limit: 500 }),
    ),
    prefetch(queryClient, ["bill-categories"], () => getBillCategories(userId)),
    prefetch(queryClient, ["pay-schedule"], () => getPaySchedule(userId)),
  ]);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <BillsPage />
    </HydrationBoundary>
  );
}

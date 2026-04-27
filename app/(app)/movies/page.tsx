import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { redirect } from "next/navigation";
import { getServerAuth } from "@/lib/server/auth";
import { getQueryClient } from "@/lib/server/get-query-client";
import { prefetch } from "@/lib/server/prefetch";
import { getMediaList } from "@/lib/server/data/movies";
import { MoviesPage } from "@/components/movies/movies-page";

export default async function Page() {
  const auth = await getServerAuth();
  if (!auth.ok) redirect("/login");
  const { userId } = auth;

  const queryClient = getQueryClient();

  await prefetch(queryClient, ["media", null, null], () =>
    getMediaList(userId, { status: null, mediaType: null }),
  );

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <MoviesPage />
    </HydrationBoundary>
  );
}

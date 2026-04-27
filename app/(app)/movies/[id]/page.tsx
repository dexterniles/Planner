import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { redirect } from "next/navigation";
import { getServerAuth } from "@/lib/server/auth";
import { getQueryClient } from "@/lib/server/get-query-client";
import { prefetch } from "@/lib/server/prefetch";
import { getMediaById } from "@/lib/server/data/movies";
import { MovieDetailPage } from "@/components/movies/movie-detail-page";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const auth = await getServerAuth();
  if (!auth.ok) redirect("/login");
  const { userId } = auth;

  const queryClient = getQueryClient();

  await prefetch(queryClient, ["media", "item", id], () =>
    getMediaById(userId, id),
  );

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <MovieDetailPage id={id} />
    </HydrationBoundary>
  );
}

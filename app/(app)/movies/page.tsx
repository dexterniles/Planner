import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { redirect } from "next/navigation";
import { getServerAuth } from "@/lib/server/auth";
import { getQueryClient } from "@/lib/server/get-query-client";
import { prefetch } from "@/lib/server/prefetch";
import { getMediaList } from "@/lib/server/data/movies";
import { MoviesPage } from "@/components/movies/movies-page";
import type { MediaStatus, MediaType } from "@/lib/validations/media";

const STATUS_VALUES: MediaStatus[] = ["watchlist", "watching", "watched"];
const TYPE_VALUES: MediaType[] = ["movie", "tv"];

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; type?: string }>;
}) {
  const sp = await searchParams;
  const status = STATUS_VALUES.includes(sp.status as MediaStatus)
    ? (sp.status as MediaStatus)
    : null;
  const mediaType = TYPE_VALUES.includes(sp.type as MediaType)
    ? (sp.type as MediaType)
    : null;

  const auth = await getServerAuth();
  if (!auth.ok) redirect("/login");
  const { userId } = auth;

  const queryClient = getQueryClient();

  await prefetch(queryClient, ["media", status, mediaType], () =>
    getMediaList(userId, { status, mediaType }),
  );

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <MoviesPage />
    </HydrationBoundary>
  );
}

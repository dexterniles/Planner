import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { redirect } from "next/navigation";
import { getServerAuth } from "@/lib/server/auth";
import { getQueryClient } from "@/lib/server/get-query-client";
import { prefetch } from "@/lib/server/prefetch";
import { getRecipes } from "@/lib/server/data/recipes";
import { getTags } from "@/lib/server/data/tags";
import { RecipesPage } from "@/components/recipes/recipes-page";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; tag?: string }>;
}) {
  const sp = await searchParams;
  const q = sp.q?.trim() || undefined;
  const tagId = sp.tag || undefined;

  const auth = await getServerAuth();
  if (!auth.ok) redirect("/login");
  const { userId } = auth;

  const queryClient = getQueryClient();

  await Promise.all([
    prefetch(queryClient, ["recipes", q, tagId], () =>
      getRecipes(userId, { search: q, tagId }),
    ),
    prefetch(queryClient, ["tags"], () => getTags(userId)),
  ]);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <RecipesPage />
    </HydrationBoundary>
  );
}

import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { redirect } from "next/navigation";
import { getServerAuth } from "@/lib/server/auth";
import { getQueryClient } from "@/lib/server/get-query-client";
import { prefetch } from "@/lib/server/prefetch";
import { getRecipeById } from "@/lib/server/data/recipes";
import { getTags } from "@/lib/server/data/tags";
import { RecipeDetailPage } from "@/components/recipes/recipe-detail-page";

export default async function Page({
  params,
}: {
  params: Promise<{ recipeId: string }>;
}) {
  const { recipeId } = await params;
  const auth = await getServerAuth();
  if (!auth.ok) redirect("/login");
  const { userId } = auth;

  const queryClient = getQueryClient();

  await Promise.all([
    prefetch(queryClient, ["recipes", recipeId], () =>
      getRecipeById(userId, recipeId),
    ),
    prefetch(queryClient, ["tags"], () => getTags(userId)),
  ]);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <RecipeDetailPage recipeId={recipeId} />
    </HydrationBoundary>
  );
}

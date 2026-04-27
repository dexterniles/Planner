import type { QueryClient, QueryKey } from "@tanstack/react-query";

// JSON-roundtrips Drizzle's Date columns into ISO strings so the dehydrated cache
// matches the shape `res.json()` produces on subsequent client refetches.
export function prefetch<T>(
  qc: QueryClient,
  queryKey: QueryKey,
  fn: () => Promise<T>,
): Promise<void> {
  return qc.prefetchQuery({
    queryKey,
    queryFn: async () => JSON.parse(JSON.stringify(await fn())) as T,
  });
}

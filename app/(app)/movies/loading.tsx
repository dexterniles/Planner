import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/layout/page-header";

export default function Loading() {
  return (
    <div>
      <PageHeader title="TV & Movies" />

      <div className="mb-5 flex flex-wrap items-center gap-3">
        <Skeleton className="h-8 w-[280px] rounded-md" />
        <Skeleton className="h-8 w-[200px] rounded-md" />
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <Skeleton className="h-8 w-[140px] rounded-md" />
          <Skeleton className="h-8 w-[180px] rounded-md" />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10">
        {Array.from({ length: 20 }).map((_, i) => (
          <Skeleton key={i} className="aspect-[2/3] w-full rounded-lg" />
        ))}
      </div>
    </div>
  );
}

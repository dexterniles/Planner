import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div>
      <Skeleton className="mb-3 h-4 w-24" />

      <Card className="relative overflow-hidden p-0">
        <Skeleton className="h-[200px] w-full sm:h-[280px] md:h-[360px] rounded-none" />
        <div className="relative -mt-16 flex flex-col gap-4 p-5 sm:-mt-20 sm:flex-row sm:items-end sm:p-6">
          <Skeleton className="h-[150px] w-[100px] shrink-0 rounded-lg sm:h-[180px] sm:w-[120px]" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-3.5 w-48" />
          </div>
        </div>
      </Card>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <Skeleton className="h-9 w-72 rounded-md" />
        <Skeleton className="h-6 w-32" />
        <div className="ml-auto flex items-center gap-2">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-8" />
        </div>
      </div>

      <div className="mt-6 space-y-2">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-3/4" />
      </div>

      <div className="mt-6 space-y-2">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-24 w-full rounded-md" />
      </div>
    </div>
  );
}

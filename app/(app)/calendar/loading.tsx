import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="flex h-full flex-col gap-4">
      <div className="flex flex-col gap-3 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between shrink-0">
        <Skeleton className="h-9 w-40" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-[200px] rounded-md" />
        </div>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <Skeleton className="h-9 w-9 rounded-md" />
        <Skeleton className="h-7 flex-1 sm:flex-none sm:w-[260px]" />
        <Skeleton className="h-9 w-9 rounded-md" />
      </div>

      <div className="flex-1 min-h-0">
        <Skeleton className="h-full min-h-[500px] w-full rounded-xl" />
      </div>
    </div>
  );
}

import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/layout/page-header";

function StatCardSkeleton() {
  return (
    <Card className="p-4 sm:p-5">
      <div className="flex flex-col gap-2">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-8 w-16" />
        <Skeleton className="h-3 w-24" />
      </div>
    </Card>
  );
}

function PanelSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <Card className="p-5">
      <div className="mb-3 flex items-center justify-between">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-4 w-4 rounded-full" />
      </div>
      <div className="space-y-2">
        {Array.from({ length: rows }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-full" />
        ))}
      </div>
    </Card>
  );
}

export default function Loading() {
  return (
    <div>
      <PageHeader title="Dashboard" />

      <div className="space-y-6">
        {/* Stats Row */}
        <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
        </div>

        {/* Today's Focus + Reminders */}
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="relative overflow-hidden p-5 sm:p-6">
            <div className="space-y-3">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          </Card>
          <Card className="p-5">
            <div className="mb-3 flex items-center justify-between">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4 rounded-full" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-9 flex-1" />
              <Skeleton className="h-9 w-9" />
            </div>
          </Card>
        </div>

        {/* This week + Coming up */}
        <div className="grid gap-6 lg:grid-cols-2">
          <PanelSkeleton rows={4} />
          <PanelSkeleton rows={4} />
        </div>

        {/* Bills + Milestones */}
        <div className="grid gap-6 lg:grid-cols-2">
          <PanelSkeleton rows={3} />
          <PanelSkeleton rows={3} />
        </div>

        {/* Grade snapshot */}
        <Card className="p-5">
          <div className="mb-3 flex items-center justify-between">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-4 rounded-full" />
          </div>
          <div className="space-y-3.5">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-1.5 w-full rounded-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-1.5 w-full rounded-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-1.5 w-full rounded-full" />
          </div>
        </Card>
      </div>
    </div>
  );
}

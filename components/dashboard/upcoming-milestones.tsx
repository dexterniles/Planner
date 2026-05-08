"use client";

import Link from "next/link";
import { useUpcomingMilestones } from "@/lib/hooks/use-dashboard";
import { formatDaysUntil } from "@/lib/format";
import { StatusDot } from "@/components/ui/status-dot";

interface Milestone {
  id: string;
  title: string;
  description: string | null;
  targetDate: string | null;
  projectId: string;
  projectName: string;
  projectColor: string | null;
}

export function UpcomingMilestones() {
  const { data: milestones } = useUpcomingMilestones(3);

  if (!milestones || milestones.length === 0) {
    return (
      <p className="text-[12.5px] text-muted-foreground">
        No milestones on the horizon.
      </p>
    );
  }

  return (
    <div className="space-y-0">
      {milestones.map((ms: Milestone) => (
        <Link
          key={ms.id}
          href={`/projects/${ms.projectId}`}
          className="flex items-start gap-2 rounded-md px-1 py-1.5 transition-colors hover:bg-muted/50"
        >
          <StatusDot
            tone="muted"
            className="mt-1.5"
            style={
              ms.projectColor
                ? { backgroundColor: ms.projectColor }
                : undefined
            }
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-medium">{ms.title}</p>
            <p className="truncate text-[11.5px] text-muted-foreground">
              {ms.projectName}
            </p>
          </div>
          <span className="whitespace-nowrap text-[11.5px] tabular-nums text-muted-foreground">
            {formatDaysUntil(ms.targetDate, { prefix: "In " })}
          </span>
        </Link>
      ))}
    </div>
  );
}

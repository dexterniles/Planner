"use client";

import Link from "next/link";
import { Flag } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useUpcomingMilestones } from "@/lib/hooks/use-dashboard";
import { formatDaysUntil } from "@/lib/format";

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

  return (
    <Card className="p-5">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-serif text-[18px] font-medium leading-none tracking-tight">
          Milestones
        </h2>
        <Flag className="h-4 w-4 text-muted-foreground" strokeWidth={1.75} />
      </div>
      {!milestones || milestones.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No milestones on the horizon.
        </p>
      ) : (
        <div>
          {milestones.map((ms: Milestone, idx: number) => (
            <Link
              key={ms.id}
              href={`/projects/${ms.projectId}`}
              className={`flex items-start gap-3 rounded-md px-2 py-2 transition-colors hover:bg-accent/60 ${idx > 0 ? "border-t border-border/60" : ""}`}
            >
              <div
                className="mt-1.5 h-2 w-2 shrink-0 rounded-full"
                style={{ backgroundColor: ms.projectColor ?? "#888" }}
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{ms.title}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {ms.projectName}
                </p>
              </div>
              <span className="whitespace-nowrap font-mono text-[11.5px] text-muted-foreground">
                {formatDaysUntil(ms.targetDate, { prefix: "In " })}
              </span>
            </Link>
          ))}
        </div>
      )}
    </Card>
  );
}

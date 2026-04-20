"use client";

import Link from "next/link";
import { Flag } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useUpcomingMilestones } from "@/lib/hooks/use-dashboard";

interface Milestone {
  id: string;
  title: string;
  description: string | null;
  targetDate: string | null;
  projectId: string;
  projectName: string;
  projectColor: string | null;
}

function formatDaysUntil(dateStr: string | null): string {
  if (!dateStr) return "No date";
  const target = new Date(dateStr);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const days = Math.round((target.getTime() - now.getTime()) / 86400000);
  if (days < 0) return `${Math.abs(days)}d overdue`;
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  if (days < 7) return `In ${days}d`;
  if (days < 30) return `In ${Math.floor(days / 7)}w`;
  return target.toLocaleDateString();
}

export function UpcomingMilestones() {
  const { data: milestones } = useUpcomingMilestones(3);

  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-3">
        <Flag className="h-4 w-4 text-muted-foreground" />
        <h2 className="font-semibold">Upcoming Milestones</h2>
      </div>
      {!milestones || milestones.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No milestones on the horizon.
        </p>
      ) : (
        <div className="space-y-2">
          {milestones.map((ms: Milestone) => (
            <Link
              key={ms.id}
              href={`/projects/${ms.projectId}`}
              className="flex items-start gap-3 rounded-md px-2 py-2 hover:bg-accent transition-colors"
            >
              <div
                className="mt-1 h-2 w-2 rounded-full shrink-0"
                style={{ backgroundColor: ms.projectColor ?? "#888" }}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{ms.title}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {ms.projectName}
                </p>
              </div>
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {formatDaysUntil(ms.targetDate)}
              </span>
            </Link>
          ))}
        </div>
      )}
    </Card>
  );
}

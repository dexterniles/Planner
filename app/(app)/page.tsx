"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, X, Check, Inbox, CalendarDays, ListChecks } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  useInbox,
  useCreateInboxItem,
  useDeleteInboxItem,
  useTriageInboxItem,
} from "@/lib/hooks/use-inbox";
import { useAllItems } from "@/lib/hooks/use-all-items";
import { StatsRow } from "@/components/dashboard/stats-row";
import { TodaysFocus } from "@/components/dashboard/todays-focus";
import { UpcomingMilestones } from "@/components/dashboard/upcoming-milestones";
import { GradeSnapshot } from "@/components/dashboard/grade-snapshot";
import { RecentDailyLogs } from "@/components/dashboard/recent-daily-logs";
import { toast } from "sonner";

interface InboxItem {
  id: string;
  content: string;
  capturedAt: string;
  triagedAt: string | null;
}

interface AllItem {
  id: string;
  type: string;
  title: string;
  status: string;
  dueDate: string | null;
  parentId: string;
  parentName: string;
  parentColor: string | null;
}

function getItemLink(item: AllItem): string {
  if (item.type === "assignment") return `/academic/${item.parentId}`;
  return `/projects/${item.parentId}`;
}

const statusLabels: Record<string, string> = {
  not_started: "Not Started",
  in_progress: "In Progress",
  submitted: "Submitted",
  graded: "Graded",
  done: "Done",
};

export default function DashboardPage() {
  const [newCapture, setNewCapture] = useState("");
  const { data: inboxItems } = useInbox();
  const createInboxItem = useCreateInboxItem();
  const deleteInboxItem = useDeleteInboxItem();
  const triageInboxItem = useTriageInboxItem();
  const { data: allItems } = useAllItems();

  const untriagedItems = (inboxItems ?? []).filter(
    (item: InboxItem) => !item.triagedAt,
  );

  const now = new Date();
  const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const upcomingItems = (allItems ?? [])
    .filter((item: AllItem) => {
      if (!item.dueDate) return false;
      if (["done", "cancelled", "graded"].includes(item.status)) return false;
      const due = new Date(item.dueDate);
      return due >= now && due <= weekFromNow;
    })
    .slice(0, 10);

  const overdueItems = (allItems ?? [])
    .filter((item: AllItem) => {
      if (!item.dueDate) return false;
      if (["done", "cancelled", "graded"].includes(item.status)) return false;
      return new Date(item.dueDate) < now;
    })
    .slice(0, 5);

  const handleCapture = async () => {
    if (!newCapture.trim()) return;
    try {
      await createInboxItem.mutateAsync({ content: newCapture.trim() });
      setNewCapture("");
      toast.success("Captured!");
    } catch {
      toast.error("Failed to capture");
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      {/* Stats Row */}
      <StatsRow />

      {/* Quick Capture */}
      <Card className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Inbox className="h-4 w-4 text-muted-foreground" />
          <h2 className="font-semibold">Quick Capture</h2>
          {untriagedItems.length > 0 && (
            <Badge variant="secondary" className="text-xs">
              {untriagedItems.length}
            </Badge>
          )}
        </div>
        <div className="flex gap-2">
          <Input
            value={newCapture}
            onChange={(e) => setNewCapture(e.target.value)}
            placeholder="Capture a thought, idea, or todo..."
            onKeyDown={(e) => e.key === "Enter" && handleCapture()}
          />
          <Button
            onClick={handleCapture}
            disabled={!newCapture.trim() || createInboxItem.isPending}
            size="icon"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {untriagedItems.length > 0 && (
          <div className="mt-3 space-y-1">
            {untriagedItems.map((item: InboxItem) => (
              <div
                key={item.id}
                className="group flex items-center gap-2 rounded-md border px-3 py-2 text-sm"
              >
                <span className="flex-1">{item.content}</span>
                <span className="text-xs text-muted-foreground">
                  {new Date(item.capturedAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  title="Mark as triaged"
                  onClick={() => triageInboxItem.mutate(item.id)}
                >
                  <Check className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  className="text-destructive"
                  title="Dismiss"
                  onClick={() => deleteInboxItem.mutate(item.id)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Today's Focus + Overdue */}
      <div className="grid gap-6 lg:grid-cols-2">
        <TodaysFocus />

        {overdueItems.length > 0 && (
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <ListChecks className="h-4 w-4 text-red-500" />
              <h2 className="font-semibold text-red-500">
                Overdue ({overdueItems.length})
              </h2>
            </div>
            <div className="space-y-1">
              {overdueItems.map((item: AllItem) => (
                <Link
                  key={`${item.type}-${item.id}`}
                  href={getItemLink(item)}
                  className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent transition-colors"
                >
                  <div
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: item.parentColor ?? "#888" }}
                  />
                  <span className="flex-1 font-medium">{item.title}</span>
                  <span className="text-xs text-muted-foreground">
                    {item.parentName}
                  </span>
                  <span className="text-xs text-red-500">
                    {new Date(item.dueDate!).toLocaleDateString()}
                  </span>
                </Link>
              ))}
            </div>
          </Card>
        )}
      </div>

      {/* Upcoming + Milestones */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
            <h2 className="font-semibold">Upcoming (7 days)</h2>
          </div>
          {upcomingItems.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nothing due in the next 7 days.
            </p>
          ) : (
            <div className="space-y-1">
              {upcomingItems.map((item: AllItem) => (
                <Link
                  key={`${item.type}-${item.id}`}
                  href={getItemLink(item)}
                  className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent transition-colors"
                >
                  <div
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: item.parentColor ?? "#888" }}
                  />
                  <span className="flex-1 font-medium">{item.title}</span>
                  <Badge variant="outline" className="text-xs capitalize">
                    {item.type}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {new Date(item.dueDate!).toLocaleDateString()}
                  </span>
                  <Badge variant="secondary" className="text-xs">
                    {statusLabels[item.status] ?? item.status}
                  </Badge>
                </Link>
              ))}
            </div>
          )}
        </Card>

        <UpcomingMilestones />
      </div>

      {/* Grade Snapshot + Recent Daily Logs */}
      <div className="grid gap-6 lg:grid-cols-2">
        <GradeSnapshot />
        <RecentDailyLogs />
      </div>
    </div>
  );
}

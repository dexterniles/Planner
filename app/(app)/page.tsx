"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Plus,
  X,
  Check,
  Bell,
  CalendarDays,
  ListChecks,
  CalendarClock,
} from "lucide-react";
import { parseDate } from "@/lib/parse-date";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
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
import { UpcomingEvents } from "@/components/dashboard/upcoming-events";
import { BillsThisPeriod } from "@/components/dashboard/bills-this-period";
import { GradeSnapshot } from "@/components/dashboard/grade-snapshot";
import { PageHeader } from "@/components/layout/page-header";
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

export default function DashboardPage() {
  const [newCapture, setNewCapture] = useState("");
  const parsedCaptureDate = useMemo(
    () => parseDate(newCapture),
    [newCapture],
  );
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
      if (["done", "cancelled", "graded", "submitted"].includes(item.status)) return false;
      const due = new Date(item.dueDate);
      return due >= now && due <= weekFromNow;
    })
    .slice(0, 10);

  const overdueItems = (allItems ?? [])
    .filter((item: AllItem) => {
      if (!item.dueDate) return false;
      if (["done", "cancelled", "graded", "submitted"].includes(item.status)) return false;
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
    <div>
      <PageHeader title="Dashboard" />

      <div className="space-y-6">
      {/* Stats Row */}
      <StatsRow />

      {/* Overdue (full-width alert when items exist) */}
      {overdueItems.length > 0 && (
        <Card className="p-5 border-destructive/40 bg-destructive/5">
          <div className="mb-3 flex items-center gap-2">
            <ListChecks className="h-4 w-4 text-destructive" />
            <p className="text-[10.5px] font-medium uppercase tracking-[0.12em] text-destructive">
              Overdue · {overdueItems.length}
            </p>
          </div>
          <div className="space-y-1">
            {overdueItems.map((item: AllItem) => (
              <Link
                key={`${item.type}-${item.id}`}
                href={getItemLink(item)}
                className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent/60 transition-colors"
              >
                <div
                  className="h-2 w-2 rounded-full shrink-0"
                  style={{ backgroundColor: item.parentColor ?? "#888" }}
                />
                <span className="flex-1 font-medium truncate">{item.title}</span>
                <span className="hidden md:inline text-xs text-muted-foreground">
                  {item.parentName}
                </span>
                <span className="text-xs text-destructive whitespace-nowrap">
                  {new Date(item.dueDate!).toLocaleDateString()}
                </span>
              </Link>
            ))}
          </div>
        </Card>
      )}

      {/* Today's Focus + Quick Capture */}
      <div className="grid gap-6 lg:grid-cols-2">
        <TodaysFocus />

        <Card className="p-5">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-baseline gap-2">
              <h2 className="font-serif text-[18px] font-medium leading-none tracking-tight">
                Reminders
              </h2>
              {untriagedItems.length > 0 && (
                <span className="font-mono text-[12px] text-muted-foreground">
                  {untriagedItems.length}
                </span>
              )}
            </div>
            <Bell className="h-4 w-4 text-muted-foreground" strokeWidth={1.75} />
          </div>
          <div className="flex gap-2">
            <Input
              value={newCapture}
              onChange={(e) => setNewCapture(e.target.value)}
              placeholder="Capture anything…"
              onKeyDown={(e) => e.key === "Enter" && handleCapture()}
            />
            <Button
              onClick={handleCapture}
              disabled={!newCapture.trim() || createInboxItem.isPending}
              size="icon"
              variant="outline"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {parsedCaptureDate && (
            <div className="mt-2 flex items-center gap-1.5 text-xs text-primary">
              <CalendarClock className="h-3 w-3" />
              <span>Detected: {parsedCaptureDate.preview}</span>
            </div>
          )}

          {untriagedItems.length > 0 && (
            <div className="mt-3 space-y-1">
              {untriagedItems.map((item: InboxItem) => {
                const itemDate = parseDate(item.content);
                return (
                <div
                  key={item.id}
                  className="group flex items-center gap-2 rounded-md border px-3 py-2 text-sm"
                >
                  <span className="flex-1">{item.content}</span>
                  {itemDate && (
                    <span className="flex items-center gap-1 text-xs text-primary whitespace-nowrap">
                      <CalendarClock className="h-3 w-3" />
                      {itemDate.preview}
                    </span>
                  )}
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
                );
              })}
            </div>
          )}
        </Card>
      </div>

      {/* Upcoming (7 days) + Upcoming Events */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-5">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-baseline gap-2">
              <h2 className="font-serif text-[18px] font-medium leading-none tracking-tight">
                This week
              </h2>
              {upcomingItems.length > 0 && (
                <span className="font-mono text-[12px] text-muted-foreground">
                  {upcomingItems.length}
                </span>
              )}
            </div>
            <CalendarDays className="h-4 w-4 text-muted-foreground" strokeWidth={1.75} />
          </div>
          {upcomingItems.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nothing due in the next 7 days.
            </p>
          ) : (
            <div>
              {upcomingItems.map((item: AllItem, idx: number) => {
                const due = new Date(item.dueDate!);
                const dayLbl = due.toLocaleDateString("en-US", { weekday: "short" });
                return (
                  <Link
                    key={`${item.type}-${item.id}`}
                    href={getItemLink(item)}
                    className={`flex items-center gap-3 rounded-md px-2 py-2 text-sm hover:bg-accent/60 transition-colors ${idx > 0 ? "border-t border-border/60" : ""}`}
                  >
                    <div className="w-9 shrink-0 text-right">
                      <div className="font-serif text-[18px] leading-none tabular-nums">
                        {due.getDate()}
                      </div>
                      <div className="mt-0.5 text-[10px] font-medium uppercase tracking-[0.1em] text-muted-foreground">
                        {dayLbl}
                      </div>
                    </div>
                    <span
                      className="h-6 w-px shrink-0 bg-border"
                      aria-hidden="true"
                    />
                    <span className="flex-1 font-medium truncate">{item.title}</span>
                    <span className="hidden md:inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-border bg-card px-2 py-0.5 text-[11.5px] text-muted-foreground">
                      <span
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ backgroundColor: item.parentColor ?? "#888" }}
                      />
                      {item.parentName}
                    </span>
                  </Link>
                );
              })}
            </div>
          )}
        </Card>

        <UpcomingEvents />
      </div>

      {/* Bills + Milestones */}
      <div className="grid gap-6 lg:grid-cols-2">
        <BillsThisPeriod />
        <UpcomingMilestones />
      </div>

      {/* Grade Snapshot */}
      <GradeSnapshot />
      </div>
    </div>
  );
}

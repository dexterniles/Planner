"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useAllItems } from "@/lib/hooks/use-all-items";
import { useCurrentDate } from "@/lib/hooks/use-current-date";
import { StatsRow } from "@/components/dashboard/stats-row";
import { TodaysFocus } from "@/components/dashboard/todays-focus";
import { UpcomingMilestones } from "@/components/dashboard/upcoming-milestones";
import { UpcomingEvents } from "@/components/dashboard/upcoming-events";
import {
  BillsThisPeriod,
  useBillsThisPeriodSummary,
} from "@/components/dashboard/bills-this-period";
import { GradeSnapshot } from "@/components/dashboard/grade-snapshot";
import { InboxCapture } from "@/components/dashboard/inbox-capture";
import { DashboardLayout } from "@/components/dashboard/dashboard-layout";
import { DashboardSection } from "@/components/dashboard/dashboard-section";
import { PageHeader } from "@/components/layout/page-header";
import { formatCurrency } from "@/components/bills/bill-utils";
import { getItemLink, cn } from "@/lib/utils";
import { StatusDot } from "@/components/ui/status-dot";

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

const FINISHED_STATUSES = new Set([
  "done",
  "cancelled",
  "graded",
  "submitted",
]);

export function DashboardPage() {
  const { data: allItems } = useAllItems();
  const now = useCurrentDate();

  const dateLabel = now.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  const todayStart = useMemo(() => {
    const d = new Date(now);
    d.setHours(0, 0, 0, 0);
    return d;
  }, [now]);

  const weekFromNow = useMemo(
    () => new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
    [now],
  );

  const { todayCount, upcomingItems, overdueItems } = useMemo(() => {
    const list = (allItems ?? []) as AllItem[];
    const overdue: AllItem[] = [];
    const upcoming: AllItem[] = [];
    let today = 0;
    for (const item of list) {
      if (!item.dueDate) continue;
      if (FINISHED_STATUSES.has(item.status)) continue;
      const due = new Date(item.dueDate);
      if (due < now) {
        overdue.push(item);
        continue;
      }
      const isToday =
        due.getFullYear() === now.getFullYear() &&
        due.getMonth() === now.getMonth() &&
        due.getDate() === now.getDate();
      if (isToday) {
        today += 1;
        continue;
      }
      if (due >= todayStart && due <= weekFromNow) {
        upcoming.push(item);
      }
    }
    return {
      todayCount: today,
      upcomingItems: upcoming.slice(0, 10),
      overdueItems: overdue.slice(0, 5),
    };
  }, [allItems, now, todayStart, weekFromNow]);

  const { totalDue, label: billsPeriodLabel } = useBillsThisPeriodSummary();
  const billsActionLabel = totalDue > 0 ? `${formatCurrency(totalDue)} due` : "—";

  const main = (
    <>
      <PageHeader title="Dashboard" subtitle={dateLabel} />

      <DashboardSection label="STATS" noTopBorder>
        <StatsRow />
      </DashboardSection>

      {overdueItems.length > 0 && (
        <DashboardSection
          label="OVERDUE"
          count={overdueItems.length}
          tone="danger"
        >
          <div className="space-y-0">
            {overdueItems.map((item) => (
              <Link
                key={`${item.type}-${item.id}`}
                href={getItemLink(item)}
                className="flex items-center gap-2 rounded-md px-1 py-1.5 text-[13px] transition-colors hover:bg-muted/50"
              >
                <StatusDot
                  tone="danger"
                  style={
                    item.parentColor
                      ? { backgroundColor: item.parentColor }
                      : undefined
                  }
                />
                <span className="flex-1 truncate font-medium">
                  {item.title}
                </span>
                <span className="hidden md:inline text-[11.5px] text-muted-foreground">
                  {item.parentName}
                </span>
                <span className="text-[11.5px] text-destructive whitespace-nowrap tabular-nums">
                  {new Date(item.dueDate!).toLocaleDateString()}
                </span>
              </Link>
            ))}
          </div>
        </DashboardSection>
      )}

      <DashboardSection label="TODAY" count={todayCount > 0 ? todayCount : undefined}>
        <TodaysFocus />
      </DashboardSection>

      <DashboardSection
        label="THIS WEEK"
        count={upcomingItems.length > 0 ? upcomingItems.length : undefined}
      >
        {upcomingItems.length === 0 ? (
          <p className="text-[13px] text-muted-foreground">
            Nothing due in the next 7 days.
          </p>
        ) : (
          <div className="space-y-0">
            {upcomingItems.map((item) => {
              const due = new Date(item.dueDate!);
              const dayLbl = due.toLocaleDateString("en-US", {
                weekday: "short",
              });
              return (
                <Link
                  key={`${item.type}-${item.id}`}
                  href={getItemLink(item)}
                  className="flex items-center gap-3 rounded-md px-1 py-1.5 text-[13px] transition-colors hover:bg-muted/50"
                >
                  <span className="inline-block w-[42px] shrink-0 text-[11.5px] tabular-nums text-muted-foreground">
                    {dayLbl} {due.getDate()}
                  </span>
                  <StatusDot
                    tone="muted"
                    style={
                      item.parentColor
                        ? { backgroundColor: item.parentColor }
                        : undefined
                    }
                  />
                  <span className="flex-1 truncate font-medium">
                    {item.title}
                  </span>
                  <span className="hidden md:inline text-[11.5px] text-muted-foreground truncate max-w-[140px]">
                    {item.parentName}
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </DashboardSection>

      <DashboardSection
        label={`BILLS · ${billsPeriodLabel.toUpperCase()}`}
        action={
          <Link
            href="/bills"
            className={cn(
              "text-[11px] tabular-nums transition-colors",
              totalDue > 0
                ? "text-foreground hover:text-primary"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {billsActionLabel} →
          </Link>
        }
      >
        <BillsThisPeriod />
      </DashboardSection>

      <DashboardSection
        label="GRADE SNAPSHOT"
        action={
          <Link
            href="/academic"
            className="text-[11px] text-muted-foreground transition-colors hover:text-foreground"
          >
            Academic →
          </Link>
        }
      >
        <GradeSnapshot />
      </DashboardSection>
    </>
  );

  const rail = (
    <>
      <DashboardSection label="QUICK CAPTURE" noTopBorder>
        <InboxCapture />
      </DashboardSection>

      <DashboardSection
        label="UPCOMING"
        action={
          <Link
            href="/events"
            className="text-[11px] text-muted-foreground transition-colors hover:text-foreground"
          >
            All events →
          </Link>
        }
      >
        <UpcomingEvents />
      </DashboardSection>

      <DashboardSection label="MILESTONES">
        <UpcomingMilestones />
      </DashboardSection>
    </>
  );

  return <DashboardLayout main={main} rail={rail} />;
}

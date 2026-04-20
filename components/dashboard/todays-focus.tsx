"use client";

import Link from "next/link";
import { Target } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAllItems } from "@/lib/hooks/use-all-items";

interface Item {
  id: string;
  type: string;
  title: string;
  status: string;
  dueDate: string | null;
  parentId: string;
  parentName: string;
  parentColor: string | null;
}

const statusLabels: Record<string, string> = {
  not_started: "Not Started",
  in_progress: "In Progress",
  submitted: "Submitted",
  graded: "Graded",
  done: "Done",
};

function isToday(dateStr: string | null): boolean {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

function getItemLink(item: Item): string {
  if (item.type === "assignment") return `/academic/${item.parentId}`;
  return `/projects/${item.parentId}`;
}

export function TodaysFocus() {
  const { data: allItems } = useAllItems();

  const todayItems = (allItems ?? []).filter(
    (item: Item) =>
      isToday(item.dueDate) &&
      !["done", "cancelled", "graded"].includes(item.status),
  );

  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-3">
        <Target className="h-4 w-4 text-muted-foreground" />
        <h2 className="font-semibold">Today&apos;s Focus</h2>
        {todayItems.length > 0 && (
          <Badge variant="secondary" className="text-xs">
            {todayItems.length}
          </Badge>
        )}
      </div>
      {todayItems.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Nothing due today. Take a breath.
        </p>
      ) : (
        <div className="space-y-1">
          {todayItems.map((item: Item) => (
            <Link
              key={`${item.type}-${item.id}`}
              href={getItemLink(item)}
              className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent transition-colors"
            >
              <div
                className="h-2 w-2 rounded-full shrink-0"
                style={{ backgroundColor: item.parentColor ?? "#888" }}
              />
              <span className="flex-1 font-medium truncate">{item.title}</span>
              <Badge variant="outline" className="text-xs capitalize">
                {item.type}
              </Badge>
              <Badge variant="secondary" className="text-xs">
                {statusLabels[item.status] ?? item.status}
              </Badge>
            </Link>
          ))}
        </div>
      )}
    </Card>
  );
}

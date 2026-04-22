"use client";

import Link from "next/link";
import { Card } from "@/components/ui/card";
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
      !["done", "cancelled", "graded", "submitted"].includes(item.status),
  );

  const tagline =
    todayItems.length === 0
      ? "Nothing due today. Take a breath."
      : todayItems.length === 1
        ? "One thing, then rest."
        : `${todayItems.length} things, then rest.`;

  return (
    <Card className="relative overflow-hidden p-5 sm:p-6">
      {/* concentric circle accent — editorial flourish */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -right-8 -top-8 h-44 w-44 rounded-full border border-primary/20 opacity-60"
      />
      <div className="relative">
        <p className="text-[10.5px] font-medium uppercase tracking-[0.12em] text-primary">
          Today&apos;s focus
        </p>
        <h2 className="mt-1 font-serif text-[19px] sm:text-[22px] font-medium leading-tight tracking-tight">
          {tagline}
        </h2>
        {todayItems.length > 0 && (
          <div className="mt-4 space-y-1">
            {todayItems.map((item: Item) => (
              <Link
                key={`${item.type}-${item.id}`}
                href={getItemLink(item)}
                className="group/row flex items-center gap-3 rounded-md px-2 py-2 text-sm transition-colors hover:bg-accent/60"
              >
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: item.parentColor ?? "#888" }}
                />
                <span className="flex-1 font-medium truncate">
                  {item.title}
                </span>
                <span className="hidden md:inline text-xs text-muted-foreground truncate max-w-[140px]">
                  {item.parentName}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}

"use client";

import Link from "next/link";
import { Card } from "@/components/ui/card";
import { useAllItems } from "@/lib/hooks/use-all-items";
import { useUpdateTask } from "@/lib/hooks/use-tasks";
import { useUpdateAssignment } from "@/lib/hooks/use-assignments";
import { getItemLink } from "@/lib/utils";

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

const ASSIGNMENT_FINISHED = new Set(["submitted", "graded"]);

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

export function TodaysFocus() {
  const { data: allItems } = useAllItems();
  const updateTask = useUpdateTask();
  const updateAssignment = useUpdateAssignment();

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

  const handleToggle = (item: Item) => {
    if (item.type === "task") {
      const next = item.status === "done" ? "not_started" : "done";
      updateTask.mutate({ id: item.id, data: { status: next } });
    } else if (item.type === "assignment") {
      if (item.status === "graded") return;
      const next = item.status === "submitted" ? "not_started" : "submitted";
      updateAssignment.mutate({
        id: item.id,
        data: { status: next as "not_started" | "submitted" },
      });
    }
  };

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
            {todayItems.map((item: Item) => {
              const checkable = item.type === "task" || item.type === "assignment";
              const isDone =
                item.type === "task"
                  ? item.status === "done"
                  : item.type === "assignment"
                    ? ASSIGNMENT_FINISHED.has(item.status)
                    : false;
              return (
                <div
                  key={`${item.type}-${item.id}`}
                  className={`group/row flex items-center gap-3 rounded-md px-2 py-2 text-sm transition-colors hover:bg-accent/60 ${isDone ? "opacity-60" : ""}`}
                >
                  {checkable && (
                    <input
                      type="checkbox"
                      checked={isDone}
                      onChange={() => handleToggle(item)}
                      onClick={(e) => e.stopPropagation()}
                      aria-label={isDone ? "Mark as not done" : "Mark as done"}
                      className="h-4 w-4 shrink-0 cursor-pointer rounded border-input accent-primary"
                    />
                  )}
                  <span
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{ backgroundColor: item.parentColor ?? "#888" }}
                  />
                  <Link
                    href={getItemLink(item)}
                    className={`flex flex-1 min-w-0 items-center gap-3 ${isDone ? "line-through" : ""}`}
                  >
                    <span className="flex-1 font-medium truncate">
                      {item.title}
                    </span>
                    <span className="hidden md:inline text-xs text-muted-foreground truncate max-w-[140px]">
                      {item.parentName}
                    </span>
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Card>
  );
}

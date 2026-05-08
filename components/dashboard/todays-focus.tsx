"use client";

import Link from "next/link";
import { useAllItems } from "@/lib/hooks/use-all-items";
import { useUpdateTask } from "@/lib/hooks/use-tasks";
import { useUpdateAssignment } from "@/lib/hooks/use-assignments";
import { getItemLink, cn } from "@/lib/utils";
import { StatusDot } from "@/components/ui/status-dot";

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

  if (todayItems.length === 0) {
    return (
      <p className="text-[13px] text-muted-foreground">
        Nothing due today. Take a breath.
      </p>
    );
  }

  return (
    <div className="space-y-0">
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
            className={cn(
              "group/row flex items-center gap-2 rounded-md px-1 py-1.5 text-[13px] transition-colors hover:bg-muted/50",
              isDone && "opacity-60",
            )}
          >
            {checkable && (
              <input
                type="checkbox"
                checked={isDone}
                onChange={() => handleToggle(item)}
                onClick={(e) => e.stopPropagation()}
                aria-label={isDone ? "Mark as not done" : "Mark as done"}
                className="h-3.5 w-3.5 shrink-0 cursor-pointer rounded border-input accent-primary"
              />
            )}
            <StatusDot
              tone="muted"
              style={
                item.parentColor
                  ? { backgroundColor: item.parentColor }
                  : undefined
              }
            />
            <Link
              href={getItemLink(item)}
              className={cn(
                "flex flex-1 min-w-0 items-center gap-2",
                isDone && "line-through",
              )}
            >
              <span className="flex-1 truncate font-medium">
                {item.title}
              </span>
              <span className="hidden md:inline text-[11.5px] text-muted-foreground truncate max-w-[140px]">
                {item.parentName}
              </span>
            </Link>
          </div>
        );
      })}
    </div>
  );
}

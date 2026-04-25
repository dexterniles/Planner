"use client";

import Link from "next/link";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useDeleteCourse } from "@/lib/hooks/use-courses";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { toast } from "sonner";

interface CourseCardProps {
  course: {
    id: string;
    name: string;
    code: string | null;
    instructor: string | null;
    semester: string | null;
    credits: number | null;
    color: string | null;
    status: string;
    startDate?: string | null;
    endDate?: string | null;
  };
  onEdit: () => void;
}

const statusLabels: Record<string, string> = {
  active: "Active",
  completed: "Completed",
  dropped: "Dropped",
  planned: "Planned",
};

export function CourseCard({ course, onEdit }: CourseCardProps) {
  const deleteCourse = useDeleteCourse();
  const confirm = useConfirm();

  const handleDelete = async () => {
    if (
      !(await confirm({
        title: `Delete ${course.name}?`,
        description:
          "All assignments and grade categories for this course will also be removed. This can't be undone.",
        destructive: true,
      }))
    ) {
      return;
    }
    try {
      await deleteCourse.mutateAsync(course.id);
      toast.success("Course deleted");
    } catch {
      toast.error("Failed to delete course");
    }
  };

  const accent = course.color ?? "#8B5CF6";
  const isCompleted = course.status === "completed";
  const isDropped = course.status === "dropped";

  return (
    <Card
      hover
      className={`group relative flex h-full flex-col overflow-hidden p-0 transition-opacity ${
        isDropped ? "opacity-60" : ""
      }`}
    >
      {/* Color band */}
      <Link
        href={`/academic/${course.id}`}
        className="relative block h-[88px] shrink-0"
        style={{ backgroundColor: accent }}
        aria-label={`Open ${course.name}`}
      >
        {course.code && (
          <span className="absolute left-4 top-3 font-mono text-[11px] uppercase tracking-[0.12em] text-white/85">
            {course.code}
          </span>
        )}
        <span className="absolute right-3 top-3 inline-flex">
          <Badge
            variant="outline"
            className={`border-white/30 bg-white/15 text-[10px] uppercase tracking-[0.08em] text-white backdrop-blur-sm ${
              isCompleted ? "" : ""
            }`}
          >
            {statusLabels[course.status] ?? course.status}
          </Badge>
        </span>
      </Link>

      {/* Body */}
      <div className="flex flex-1 flex-col p-4">
        <Link
          href={`/academic/${course.id}`}
          className="block flex-1"
          aria-label={`Open ${course.name}`}
        >
          <h3
            className={`font-serif text-[18px] font-medium leading-tight tracking-tight line-clamp-2 ${
              isCompleted ? "line-through text-muted-foreground" : ""
            }`}
          >
            {course.name}
          </h3>
          <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[12px] text-muted-foreground">
            {(() => {
              const parts: string[] = [];
              if (course.instructor) parts.push(course.instructor);
              if (course.semester) parts.push(course.semester);
              if (course.credits != null) parts.push(`${course.credits} cr`);
              return parts.map((p, i) => (
                <span key={i} className="flex items-center gap-x-2">
                  {i > 0 && <span aria-hidden="true">·</span>}
                  <span>{p}</span>
                </span>
              ));
            })()}
          </div>
          {(course.startDate || course.endDate) && (
            <p className="mt-1.5 font-mono text-[10.5px] tabular-nums text-muted-foreground/80">
              {(() => {
                const fmt = (d: string) =>
                  new Date(d + "T12:00:00").toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  });
                if (course.startDate && course.endDate)
                  return `${fmt(course.startDate)} – ${fmt(course.endDate)}`;
                if (course.endDate) return `ends ${fmt(course.endDate)}`;
                return `starts ${fmt(course.startDate!)}`;
              })()}
            </p>
          )}
        </Link>

        {/* Action menu */}
        <div className="mt-3 flex items-center justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Actions for ${course.name}`}
                />
              }
            >
              <MoreHorizontal className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onEdit}>
                <Pencil className="mr-1.5 h-3.5 w-3.5" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                variant="destructive"
                onClick={handleDelete}
                disabled={deleteCourse.isPending}
              >
                <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </Card>
  );
}

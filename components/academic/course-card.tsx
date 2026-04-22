"use client";

import Link from "next/link";
import { Pencil, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useDeleteCourse } from "@/lib/hooks/use-courses";
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

  const handleDelete = async () => {
    if (!confirm("Delete this course and all its assignments?")) return;
    try {
      await deleteCourse.mutateAsync(course.id);
      toast.success("Course deleted");
    } catch {
      toast.error("Failed to delete course");
    }
  };

  const accent = course.color ?? "#8B5CF6";

  return (
    <Card hover className="group relative overflow-hidden p-0">
      <div
        className="absolute inset-y-0 left-0 w-1"
        style={{ backgroundColor: accent }}
        aria-hidden="true"
      />
      <div className="flex items-center gap-5 p-5 pl-6">
        <Link
          href={`/academic/${course.id}`}
          className="flex-1 min-w-0 space-y-1"
        >
          <div className="flex items-baseline gap-2.5 flex-wrap">
            {course.code && (
              <span className="font-mono text-[11.5px] text-muted-foreground">
                {course.code}
              </span>
            )}
            <h3 className="font-serif text-[20px] font-medium leading-tight tracking-tight">
              {course.name}
            </h3>
          </div>
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[12.5px] text-muted-foreground">
            {course.instructor && <span>{course.instructor}</span>}
            {course.instructor && course.semester && <span>·</span>}
            {course.semester && <span>{course.semester}</span>}
            {(course.instructor || course.semester) &&
              course.credits != null && <span>·</span>}
            {course.credits != null && <span>{course.credits} credits</span>}
          </div>
        </Link>
        <div className="flex items-center gap-1 shrink-0">
          <Badge variant="outline" className="text-[10.5px]">
            {statusLabels[course.status] ?? course.status}
          </Badge>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onEdit}
            aria-label={`Edit ${course.name}`}
            className="md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100 transition-opacity"
          >
            <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={handleDelete}
            disabled={deleteCourse.isPending}
            aria-label={`Delete ${course.name}`}
            className="md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100 transition-opacity text-destructive"
          >
            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
          </Button>
        </div>
      </div>
    </Card>
  );
}

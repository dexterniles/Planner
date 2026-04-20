"use client";

import Link from "next/link";
import { GraduationCap, Pencil, Trash2 } from "lucide-react";
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

  return (
    <Card className="group relative overflow-hidden">
      <div
        className="absolute inset-y-0 left-0 w-1"
        style={{ backgroundColor: course.color ?? "#3B82F6" }}
      />
      <div className="flex items-start justify-between p-4 pl-5">
        <Link
          href={`/academic/${course.id}`}
          className="flex-1 space-y-1 hover:opacity-80"
        >
          <div className="flex items-center gap-2">
            <GraduationCap
              className="h-4 w-4"
              style={{ color: course.color ?? "#3B82F6" }}
            />
            <h3 className="font-semibold leading-none">{course.name}</h3>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            {course.code && <span>{course.code}</span>}
            {course.instructor && <span>· {course.instructor}</span>}
            {course.semester && <span>· {course.semester}</span>}
            {course.credits != null && <span>· {course.credits} cr</span>}
          </div>
        </Link>
        <div className="flex items-center gap-1">
          <Badge variant="secondary">{statusLabels[course.status] ?? course.status}</Badge>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onEdit}
            aria-label={`Edit ${course.name}`}
            className="opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={handleDelete}
            disabled={deleteCourse.isPending}
            aria-label={`Delete ${course.name}`}
            className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive"
          >
            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
          </Button>
        </div>
      </div>
    </Card>
  );
}

"use client";

import { useState } from "react";
import { Plus, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCourses } from "@/lib/hooks/use-courses";
import { useWorkspaces } from "@/lib/hooks/use-workspaces";
import { CourseCard } from "@/components/academic/course-card";
import { CourseDialog } from "@/components/academic/course-dialog";
import { Skeleton } from "@/components/ui/skeleton";

export default function AcademicPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Record<string, unknown> | null>(null);

  const { data: workspaces, isLoading: loadingWorkspaces } = useWorkspaces();
  const academicWorkspace = workspaces?.find(
    (w: { type: string }) => w.type === "academic",
  );

  const { data: courses, isLoading: loadingCourses } = useCourses(
    academicWorkspace?.id,
  );

  if (loadingWorkspaces || loadingCourses) {
    return (
      <div>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Academic</h1>
        </div>
        <div className="mt-6 grid gap-3">
          <Skeleton className="h-[76px] w-full" />
          <Skeleton className="h-[76px] w-full" />
          <Skeleton className="h-[76px] w-full" />
        </div>
      </div>
    );
  }

  if (!academicWorkspace) {
    return (
      <div>
        <h1 className="text-2xl font-bold">Academic</h1>
        <p className="mt-4 text-muted-foreground">
          No academic workspace found. Please run the seed script.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Academic</h1>
        <Button onClick={() => { setEditingCourse(null); setDialogOpen(true); }}>
          <Plus className="mr-1.5 h-4 w-4" />
          New Course
        </Button>
      </div>

      {courses?.length === 0 ? (
        <div className="mt-16 flex flex-col items-center text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500/15 to-blue-500/5">
            <GraduationCap className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <h3 className="text-base font-medium">Start your semester</h3>
          <p className="mt-1 text-sm text-muted-foreground max-w-sm">
            Add your classes to track assignments, calculate grades, and never
            miss a deadline.
          </p>
          <Button
            className="mt-5"
            onClick={() => { setEditingCourse(null); setDialogOpen(true); }}
          >
            <Plus className="mr-1.5 h-4 w-4" />
            Add your first course
          </Button>
        </div>
      ) : (
        <div className="mt-6 grid gap-3">
          {courses?.map((course: Record<string, unknown>) => (
            <CourseCard
              key={course.id as string}
              course={course as CourseCardCourse}
              onEdit={() => { setEditingCourse(course); setDialogOpen(true); }}
            />
          ))}
        </div>
      )}

      <CourseDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        workspaceId={academicWorkspace.id}
        course={editingCourse as CourseDialogCourse | undefined}
      />
    </div>
  );
}

type CourseCardCourse = {
  id: string;
  name: string;
  code: string | null;
  instructor: string | null;
  semester: string | null;
  credits: number | null;
  color: string | null;
  status: string;
};

type CourseDialogCourse = {
  id: string;
  name: string;
  code: string | null;
  instructor: string | null;
  semester: string | null;
  credits: number | null;
  color: string | null;
  status: "active" | "completed" | "dropped" | "planned";
};

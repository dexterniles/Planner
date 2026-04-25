"use client";

import { useState } from "react";
import { Plus, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCourses } from "@/lib/hooks/use-courses";
import { useWorkspaces } from "@/lib/hooks/use-workspaces";
import { CourseCard } from "@/components/academic/course-card";
import { CourseDialog } from "@/components/academic/course-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/layout/page-header";

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
        <PageHeader title="Academic" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <Skeleton className="h-[200px] w-full rounded-xl" />
          <Skeleton className="h-[200px] w-full rounded-xl" />
          <Skeleton className="h-[200px] w-full rounded-xl" />
          <Skeleton className="h-[200px] w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (!academicWorkspace) {
    return (
      <div>
        <PageHeader title="Academic" />
        <p className="text-muted-foreground">
          No academic workspace found. Please run the seed script.
        </p>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Academic"
        actions={
          <Button onClick={() => { setEditingCourse(null); setDialogOpen(true); }}>
            <Plus className="mr-1.5 h-4 w-4" />
            New Course
          </Button>
        }
      />

      {courses?.length === 0 ? (
        <div className="mt-10 flex flex-col items-center text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
            <GraduationCap className="h-6 w-6 text-primary" strokeWidth={1.75} />
          </div>
          <h3 className="font-serif text-[20px] font-medium leading-tight tracking-tight">Start your semester</h3>
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
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
  startDate?: string | null;
  endDate?: string | null;
};

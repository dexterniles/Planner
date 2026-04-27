"use client";

import { ArrowLeft, Check, RotateCcw } from "lucide-react";
import { BackLink } from "@/components/layout/back-link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useCourse, useUpdateCourse } from "@/lib/hooks/use-courses";
import { toast } from "sonner";
import { AssignmentList } from "@/components/academic/assignment-list";
import { GradeCategoryList } from "@/components/academic/grade-category-list";
import { GradeCalculator } from "@/components/academic/grade-calculator";
import { GradeProjector } from "@/components/academic/grade-projector";
import { CourseSnapshot } from "@/components/academic/course-snapshot";
import { SyllabusCard } from "@/components/academic/syllabus-card";
import { TimerStartButton } from "@/components/layout/timer";
import { TimeLogHistory } from "@/components/time-log-history";
import { NotesList } from "@/components/notes-list";
import { Skeleton } from "@/components/ui/skeleton";

const statusLabels: Record<string, string> = {
  active: "Active",
  completed: "Completed",
  dropped: "Dropped",
  planned: "Planned",
};

interface CourseDetailPageProps {
  courseId: string;
}

export function CourseDetailPage({ courseId }: CourseDetailPageProps) {
  const { data: course, isLoading } = useCourse(courseId);
  const updateCourse = useUpdateCourse();

  const handleToggleComplete = async () => {
    if (!course) return;
    const nextStatus = course.status === "completed" ? "active" : "completed";
    try {
      await updateCourse.mutateAsync({
        id: courseId,
        data: { status: nextStatus },
      });
      toast.success(
        nextStatus === "completed" ? "Course marked complete" : "Course reopened",
      );
    } catch {
      toast.error("Failed to update status");
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-start gap-4">
          <Skeleton className="h-8 w-8 rounded-lg" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-7 w-64" />
            <Skeleton className="h-4 w-96" />
          </div>
        </div>
        <Skeleton className="h-9 w-80 rounded-lg" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!course) {
    return (
      <div>
        <p className="text-muted-foreground">Course not found.</p>
        <BackLink href="/academic">
          <Button variant="outline" className="mt-4">
            Back to Academic
          </Button>
        </BackLink>
      </div>
    );
  }

  return (
    <div>
      <BackLink
        href="/academic"
        className="mb-3 inline-flex items-center gap-1.5 text-[12.5px] text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.75} />
        Academic
      </BackLink>

      <div className="mb-7 flex flex-col gap-3 border-b border-border pb-5 md:flex-row md:items-end md:justify-between md:gap-6">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <span
              className="h-3 w-3 shrink-0 rounded-full"
              style={{ backgroundColor: course.color ?? "#3B82F6" }}
              aria-hidden="true"
            />
            <h1 className="font-serif text-[26px] md:text-[34px] font-medium leading-tight tracking-tight">
              {course.name}
            </h1>
            <Badge variant="outline" className="text-[10.5px]">
              {statusLabels[course.status] ?? course.status}
            </Badge>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-muted-foreground">
            {(() => {
              const items: React.ReactNode[] = [];
              if (course.code)
                items.push(
                  <span key="code" className="font-mono text-[12px]">
                    {course.code}
                  </span>,
                );
              if (course.instructor)
                items.push(<span key="instr">{course.instructor}</span>);
              if (course.semester)
                items.push(<span key="sem">{course.semester}</span>);
              if (course.credits != null)
                items.push(
                  <span key="cred">{course.credits} credits</span>,
                );
              if (course.startDate || course.endDate) {
                const fmt = (d: string) =>
                  new Date(d + "T12:00:00").toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  });
                const range =
                  course.startDate && course.endDate
                    ? `${fmt(course.startDate)} – ${fmt(course.endDate)}`
                    : course.endDate
                      ? `ends ${fmt(course.endDate)}`
                      : `starts ${fmt(course.startDate!)}`;
                items.push(
                  <span key="dates" className="tabular-nums">
                    {range}
                  </span>,
                );
              }
              return items.map((node, i) => (
                <span key={i} className="flex items-center gap-x-3">
                  {i > 0 && <span aria-hidden="true">·</span>}
                  {node}
                </span>
              ));
            })()}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={handleToggleComplete}
            disabled={updateCourse.isPending}
          >
            {course.status === "completed" ? (
              <>
                <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
                Reopen
              </>
            ) : (
              <>
                <Check className="mr-1.5 h-3.5 w-3.5" />
                Mark complete
              </>
            )}
          </Button>
          <TimerStartButton loggableType="course" loggableId={courseId} />
        </div>
      </div>

      <div className="space-y-6">
      <CourseSnapshot courseId={courseId} />

      <SyllabusCard courseId={courseId} />

      <Tabs defaultValue="assignments">
        <TabsList>
          <TabsTrigger value="assignments">Assignments</TabsTrigger>
          <TabsTrigger value="categories">Grade Categories</TabsTrigger>
          <TabsTrigger value="grades">Grade Calculator</TabsTrigger>
          <TabsTrigger value="projections">Projections</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
          <TabsTrigger value="time">Time Log</TabsTrigger>
        </TabsList>

        <TabsContent value="assignments" className="mt-4">
          <AssignmentList courseId={courseId} />
        </TabsContent>

        <TabsContent value="categories" className="mt-4">
          <GradeCategoryList courseId={courseId} />
        </TabsContent>

        <TabsContent value="grades" className="mt-4">
          <GradeCalculator courseId={courseId} />
        </TabsContent>

        <TabsContent value="projections" className="mt-4">
          <GradeProjector courseId={courseId} />
        </TabsContent>

        <TabsContent value="notes" className="mt-4">
          <NotesList parentType="course" parentId={courseId} showSessionDate />
        </TabsContent>

        <TabsContent value="time" className="mt-4">
          <TimeLogHistory loggableType="course" loggableId={courseId} />
        </TabsContent>
      </Tabs>
      </div>
    </div>
  );
}

"use client";

import { use } from "react";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useCourse } from "@/lib/hooks/use-courses";
import { AssignmentList } from "@/components/academic/assignment-list";
import { GradeCategoryList } from "@/components/academic/grade-category-list";
import { GradeCalculator } from "@/components/academic/grade-calculator";
import { TimerStartButton } from "@/components/layout/timer";
import { TimeLogHistory } from "@/components/time-log-history";
import { Skeleton } from "@/components/ui/skeleton";

const statusLabels: Record<string, string> = {
  active: "Active",
  completed: "Completed",
  dropped: "Dropped",
  planned: "Planned",
};

export default function CourseDetailPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = use(params);
  const { data: course, isLoading } = useCourse(courseId);

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
        <Link href="/academic">
          <Button variant="outline" className="mt-4">
            Back to Academic
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4">
        <Link href="/academic">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2 md:gap-3">
            <div
              className="h-3 w-3 rounded-full shrink-0"
              style={{ backgroundColor: course.color ?? "#3B82F6" }}
            />
            <h1 className="text-xl md:text-2xl font-bold">{course.name}</h1>
            <Badge variant="secondary">
              {statusLabels[course.status] ?? course.status}
            </Badge>
            <TimerStartButton loggableType="course" loggableId={courseId} />
          </div>
          <div className="mt-1 flex flex-wrap gap-3 text-sm text-muted-foreground">
            {course.code && <span>{course.code}</span>}
            {course.instructor && <span>· {course.instructor}</span>}
            {course.semester && <span>· {course.semester}</span>}
            {course.credits != null && <span>· {course.credits} credits</span>}
          </div>
        </div>
      </div>

      <Tabs defaultValue="assignments">
        <TabsList>
          <TabsTrigger value="assignments">Assignments</TabsTrigger>
          <TabsTrigger value="categories">Grade Categories</TabsTrigger>
          <TabsTrigger value="grades">Grade Calculator</TabsTrigger>
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

        <TabsContent value="time" className="mt-4">
          <TimeLogHistory loggableType="course" loggableId={courseId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

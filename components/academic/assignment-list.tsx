"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, Repeat, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAssignments, useDeleteAssignment } from "@/lib/hooks/use-assignments";
import { useGradeCategories } from "@/lib/hooks/use-grade-categories";
import { AssignmentDialog } from "./assignment-dialog";
import { toast } from "sonner";

interface AssignmentListProps {
  courseId: string;
}

const statusVariants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  not_started: "outline",
  in_progress: "secondary",
  submitted: "default",
  graded: "default",
};

const statusLabels: Record<string, string> = {
  not_started: "Not Started",
  in_progress: "In Progress",
  submitted: "Submitted",
  graded: "Graded",
};

interface Assignment {
  id: string;
  title: string;
  description: string | null;
  dueDate: string | null;
  categoryId: string | null;
  status: "not_started" | "in_progress" | "submitted" | "graded";
  pointsEarned: string | null;
  pointsPossible: string | null;
  notes: string | null;
  recurrenceRuleId: string | null;
}

export function AssignmentList({ courseId }: AssignmentListProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);
  const { data: assignments, isLoading } = useAssignments(courseId);
  const { data: categories } = useGradeCategories(courseId);
  const deleteAssignment = useDeleteAssignment();

  const categoryMap = new Map<string, string>(
    (categories ?? []).map((c: { id: string; name: string }) => [c.id, c.name]),
  );

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this assignment?")) return;
    try {
      await deleteAssignment.mutateAsync(id);
      toast.success("Assignment deleted");
    } catch {
      toast.error("Failed to delete assignment");
    }
  };

  if (isLoading) return <p className="text-muted-foreground">Loading...</p>;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold">Assignments</h3>
        <Button
          size="sm"
          onClick={() => {
            setEditingAssignment(null);
            setDialogOpen(true);
          }}
        >
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          Add
        </Button>
      </div>

      {assignments?.length === 0 ? (
        <div className="flex flex-col items-center py-10 text-center">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/15 to-blue-500/5">
            <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </div>
          <p className="text-sm text-muted-foreground">
            Nothing due yet. Add homework, papers, or exams to track them.
          </p>
        </div>
      ) : (
        <>
          <div className="hidden md:block rounded-lg border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Due</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Score</TableHead>
                  <TableHead className="w-20" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {assignments?.map((a: Assignment) => (
                  <TableRow key={a.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-1.5">
                        {a.title}
                        {a.recurrenceRuleId && (
                          <Repeat className="h-3 w-3 text-primary" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {a.categoryId ? (categoryMap.get(a.categoryId) ?? "—") : "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {a.dueDate
                        ? new Date(a.dueDate).toLocaleDateString()
                        : "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusVariants[a.status] ?? "outline"}>
                        {statusLabels[a.status] ?? a.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {a.pointsEarned != null && a.pointsPossible != null
                        ? `${a.pointsEarned}/${a.pointsPossible}`
                        : a.pointsPossible != null
                          ? `—/${a.pointsPossible}`
                          : "—"}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => {
                            setEditingAssignment(a);
                            setDialogOpen(true);
                          }}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="text-destructive"
                          onClick={() => handleDelete(a.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="md:hidden space-y-2">
            {assignments?.map((a: Assignment) => {
              const categoryName = a.categoryId
                ? categoryMap.get(a.categoryId)
                : null;
              const score =
                a.pointsEarned != null && a.pointsPossible != null
                  ? `${a.pointsEarned}/${a.pointsPossible}`
                  : a.pointsPossible != null
                    ? `—/${a.pointsPossible}`
                    : null;
              return (
                <div
                  key={a.id}
                  className="rounded-lg border bg-card p-3"
                >
                  <div className="flex items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-medium">{a.title}</span>
                        {a.recurrenceRuleId && (
                          <Repeat className="h-3 w-3 shrink-0 text-primary" />
                        )}
                      </div>
                      <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
                        <Badge
                          variant={statusVariants[a.status] ?? "outline"}
                          className="text-[10px]"
                        >
                          {statusLabels[a.status] ?? a.status}
                        </Badge>
                        {categoryName && (
                          <span className="text-muted-foreground">
                            {categoryName}
                          </span>
                        )}
                        {a.dueDate && (
                          <span className="text-muted-foreground">
                            Due {new Date(a.dueDate).toLocaleDateString()}
                          </span>
                        )}
                        {score && (
                          <span className="font-medium tabular-nums">
                            {score}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex shrink-0 gap-0.5">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => {
                          setEditingAssignment(a);
                          setDialogOpen(true);
                        }}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="text-destructive"
                        onClick={() => handleDelete(a.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      <AssignmentDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        courseId={courseId}
        assignment={editingAssignment ?? undefined}
      />
    </div>
  );
}

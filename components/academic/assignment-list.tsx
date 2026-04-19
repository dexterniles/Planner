"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
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
        <p className="text-sm text-muted-foreground">
          No assignments yet. Add one to get started.
        </p>
      ) : (
        <div className="rounded-lg border">
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
                  <TableCell className="font-medium">{a.title}</TableCell>
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

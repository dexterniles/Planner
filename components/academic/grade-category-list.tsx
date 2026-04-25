"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, PieChart } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  useGradeCategories,
  useDeleteGradeCategory,
} from "@/lib/hooks/use-grade-categories";
import { GradeCategoryDialog } from "./grade-category-dialog";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { toast } from "sonner";

interface GradeCategoryListProps {
  courseId: string;
}

interface Category {
  id: string;
  name: string;
  weight: string;
  dropLowestN: number;
}

export function GradeCategoryList({ courseId }: GradeCategoryListProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const { data: categories, isLoading } = useGradeCategories(courseId);
  const deleteCategory = useDeleteGradeCategory();
  const confirm = useConfirm();

  const handleDelete = async (id: string) => {
    if (
      !(await confirm({
        title: "Delete this grade category?",
        description:
          "Assignments in this category will become uncategorized.",
        destructive: true,
      }))
    ) {
      return;
    }
    try {
      await deleteCategory.mutateAsync(id);
      toast.success("Category deleted");
    } catch {
      toast.error("Failed to delete category");
    }
  };

  const totalWeight = (categories ?? []).reduce(
    (sum: number, c: Category) => sum + Number(c.weight),
    0,
  );

  if (isLoading) return <p className="text-muted-foreground">Loading...</p>;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="font-serif text-[20px] font-medium leading-tight tracking-tight">Grade Categories</h3>
          {categories && categories.length > 0 && (
            <p className="text-sm text-muted-foreground">
              Total weight: {totalWeight}%
              {totalWeight !== 100 && (
                <span className="ml-1 text-chart-3">(should be 100%)</span>
              )}
            </p>
          )}
        </div>
        <Button
          size="sm"
          onClick={() => {
            setEditingCategory(null);
            setDialogOpen(true);
          }}
        >
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          Add
        </Button>
      </div>

      {categories?.length === 0 ? (
        <div className="flex flex-col items-center py-10 text-center">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <PieChart className="h-4 w-4 text-primary" strokeWidth={1.75} />
          </div>
          <p className="text-sm text-muted-foreground max-w-xs">
            Set categories like Homework (30%) and Exams (40%) to calculate
            weighted grades.
          </p>
        </div>
      ) : (
        <>
          <div className="hidden md:block rounded-lg border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Weight</TableHead>
                  <TableHead className="text-right">Drop Lowest</TableHead>
                  <TableHead className="w-20" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories?.map((cat: Category) => (
                  <TableRow key={cat.id}>
                    <TableCell className="font-medium">{cat.name}</TableCell>
                    <TableCell className="text-right">{cat.weight}%</TableCell>
                    <TableCell className="text-right">
                      {cat.dropLowestN}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => {
                            setEditingCategory(cat);
                            setDialogOpen(true);
                          }}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="text-destructive"
                          onClick={() => handleDelete(cat.id)}
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
            {categories?.map((cat: Category) => (
              <div
                key={cat.id}
                className="rounded-lg border bg-card p-3"
              >
                <div className="flex items-center gap-2">
                  <span className="flex-1 text-sm font-medium truncate">
                    {cat.name}
                  </span>
                  <span className="text-sm font-semibold tabular-nums">
                    {cat.weight}%
                  </span>
                  <div className="flex shrink-0 gap-0.5">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => {
                        setEditingCategory(cat);
                        setDialogOpen(true);
                      }}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="text-destructive"
                      onClick={() => handleDelete(cat.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
                {cat.dropLowestN > 0 && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    Drop lowest: {cat.dropLowestN}
                  </p>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      <GradeCategoryDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        courseId={courseId}
        category={editingCategory ?? undefined}
      />
    </div>
  );
}

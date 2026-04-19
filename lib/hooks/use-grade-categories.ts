"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  CreateGradeCategoryInput,
  UpdateGradeCategoryInput,
} from "@/lib/validations/grade-category";

export function useGradeCategories(courseId: string) {
  return useQuery({
    queryKey: ["grade-categories", courseId],
    queryFn: async () => {
      const res = await fetch(`/api/grade-categories?courseId=${courseId}`);
      if (!res.ok) throw new Error("Failed to fetch grade categories");
      return res.json();
    },
    enabled: !!courseId,
  });
}

export function useCreateGradeCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateGradeCategoryInput) => {
      const res = await fetch("/api/grade-categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create grade category");
      return res.json();
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["grade-categories"] }),
  });
}

export function useUpdateGradeCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: UpdateGradeCategoryInput;
    }) => {
      const res = await fetch(`/api/grade-categories/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update grade category");
      return res.json();
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["grade-categories"] }),
  });
}

export function useDeleteGradeCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/grade-categories/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete grade category");
      return res.json();
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["grade-categories"] }),
  });
}

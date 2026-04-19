"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  CreateAssignmentInput,
  UpdateAssignmentInput,
} from "@/lib/validations/assignment";

export function useAssignments(courseId?: string) {
  return useQuery({
    queryKey: ["assignments", courseId],
    queryFn: async () => {
      const params = courseId ? `?courseId=${courseId}` : "";
      const res = await fetch(`/api/assignments${params}`);
      if (!res.ok) throw new Error("Failed to fetch assignments");
      return res.json();
    },
  });
}

export function useCreateAssignment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateAssignmentInput) => {
      const res = await fetch("/api/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create assignment");
      return res.json();
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["assignments"] }),
  });
}

export function useUpdateAssignment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: UpdateAssignmentInput;
    }) => {
      const res = await fetch(`/api/assignments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update assignment");
      return res.json();
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["assignments"] }),
  });
}

export function useDeleteAssignment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/assignments/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete assignment");
      return res.json();
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["assignments"] }),
  });
}

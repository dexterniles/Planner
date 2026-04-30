"use client";

import { useMutation, useQuery, useQueryClient, type QueryKey } from "@tanstack/react-query";
import { toast } from "sonner";
import type {
  CreateAssignmentInput,
  UpdateAssignmentInput,
} from "@/lib/validations/assignment";

type AssignmentCacheItem = { id: string; updatedAt?: string } & Record<string, unknown>;

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
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["assignments"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["all-items"] });
    },
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
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: ["assignments"] });
      const itemSnapshot = queryClient.getQueryData<AssignmentCacheItem>(["assignments", id]);
      const listSnapshots = queryClient.getQueriesData<AssignmentCacheItem[]>({
        queryKey: ["assignments"],
      });
      const now = new Date().toISOString();
      const { pointsEarned, pointsPossible, ...rest } = data;
      const patch: Partial<AssignmentCacheItem> = {
        ...rest,
        ...(pointsEarned !== undefined && {
          pointsEarned: pointsEarned === null ? null : pointsEarned.toFixed(2),
        }),
        ...(pointsPossible !== undefined && {
          pointsPossible: pointsPossible === null ? null : pointsPossible.toFixed(2),
        }),
        updatedAt: now,
      };
      queryClient.setQueryData<AssignmentCacheItem>(["assignments", id], (old) =>
        old ? { ...old, ...patch } : old,
      );
      queryClient.setQueriesData<AssignmentCacheItem[]>(
        { queryKey: ["assignments"] },
        (old) =>
          Array.isArray(old)
            ? old.map((row) => (row.id === id ? { ...row, ...patch } : row))
            : old,
      );
      return { id, itemSnapshot, listSnapshots };
    },
    onError: (_err, _vars, context) => {
      if (!context) return;
      queryClient.setQueryData(["assignments", context.id], context.itemSnapshot);
      for (const [key, data] of context.listSnapshots) {
        queryClient.setQueryData(key as QueryKey, data);
      }
      toast.error("Failed to update assignment");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["assignments"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["all-items"] });
    },
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
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["assignments"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["all-items"] });
    },
  });
}

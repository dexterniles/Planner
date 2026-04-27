"use client";

import { useMutation, useQuery, useQueryClient, type QueryKey } from "@tanstack/react-query";
import { toast } from "sonner";
import type {
  CreateTaskInput,
  UpdateTaskInput,
} from "@/lib/validations/task";

type TaskCacheItem = { id: string; updatedAt?: string } & Record<string, unknown>;

export function useTasks(projectId?: string) {
  return useQuery({
    queryKey: ["tasks", projectId],
    queryFn: async () => {
      const params = projectId ? `?projectId=${projectId}` : "";
      const res = await fetch(`/api/tasks${params}`);
      if (!res.ok) throw new Error("Failed to fetch tasks");
      return res.json();
    },
  });
}

export function useCreateTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateTaskInput) => {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create task");
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tasks"] }),
  });
}

export function useUpdateTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: UpdateTaskInput;
    }) => {
      const res = await fetch(`/api/tasks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update task");
      return res.json();
    },
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: ["tasks"] }); // prevent in-flight refetch from clobbering the patch
      const itemSnapshot = queryClient.getQueryData<TaskCacheItem>(["tasks", id]);
      const listSnapshots = queryClient.getQueriesData<TaskCacheItem[]>({
        queryKey: ["tasks"],
      });
      const now = new Date().toISOString();
      queryClient.setQueryData<TaskCacheItem>(["tasks", id], (old) =>
        old ? { ...old, ...data, updatedAt: now } : old,
      );
      queryClient.setQueriesData<TaskCacheItem[]>(
        { queryKey: ["tasks"] },
        (old) =>
          Array.isArray(old)
            ? old.map((row) =>
                row.id === id ? { ...row, ...data, updatedAt: now } : row,
              )
            : old,
      );
      return { id, itemSnapshot, listSnapshots };
    },
    onError: (_err, _vars, context) => {
      if (!context) return;
      queryClient.setQueryData(["tasks", context.id], context.itemSnapshot);
      for (const [key, data] of context.listSnapshots) {
        queryClient.setQueryData(key as QueryKey, data);
      }
      toast.error("Failed to update task");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/tasks/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete task");
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tasks"] }),
  });
}

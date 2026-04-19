"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  CreateTaskInput,
  UpdateTaskInput,
} from "@/lib/validations/task";

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
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tasks"] }),
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

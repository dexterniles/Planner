"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  CreateWorkspaceInput,
  UpdateWorkspaceInput,
} from "@/lib/validations/workspace";

export function useWorkspaces() {
  return useQuery({
    queryKey: ["workspaces"],
    queryFn: async () => {
      const res = await fetch("/api/workspaces");
      if (!res.ok) throw new Error("Failed to fetch workspaces");
      return res.json();
    },
  });
}

export function useCreateWorkspace() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateWorkspaceInput) => {
      const res = await fetch("/api/workspaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create workspace");
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["workspaces"] }),
  });
}

export function useUpdateWorkspace() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: UpdateWorkspaceInput;
    }) => {
      const res = await fetch(`/api/workspaces/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update workspace");
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["workspaces"] }),
  });
}

export function useDeleteWorkspace() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/workspaces/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete workspace");
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["workspaces"] }),
  });
}

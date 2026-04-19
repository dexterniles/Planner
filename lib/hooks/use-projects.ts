"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  CreateProjectInput,
  UpdateProjectInput,
} from "@/lib/validations/project";

export function useProjects(workspaceId?: string) {
  return useQuery({
    queryKey: ["projects", workspaceId],
    queryFn: async () => {
      const params = workspaceId ? `?workspaceId=${workspaceId}` : "";
      const res = await fetch(`/api/projects${params}`);
      if (!res.ok) throw new Error("Failed to fetch projects");
      return res.json();
    },
  });
}

export function useProject(id: string) {
  return useQuery({
    queryKey: ["projects", id],
    queryFn: async () => {
      const res = await fetch(`/api/projects/${id}`);
      if (!res.ok) throw new Error("Failed to fetch project");
      return res.json();
    },
    enabled: !!id,
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateProjectInput) => {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create project");
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["projects"] }),
  });
}

export function useUpdateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: UpdateProjectInput;
    }) => {
      const res = await fetch(`/api/projects/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update project");
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["projects"] }),
  });
}

export function useDeleteProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/projects/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete project");
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["projects"] }),
  });
}

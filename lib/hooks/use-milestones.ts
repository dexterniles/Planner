"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  CreateMilestoneInput,
  UpdateMilestoneInput,
} from "@/lib/validations/milestone";

export function useMilestones(projectId: string) {
  return useQuery({
    queryKey: ["milestones", projectId],
    queryFn: async () => {
      const res = await fetch(`/api/milestones?projectId=${projectId}`);
      if (!res.ok) throw new Error("Failed to fetch milestones");
      return res.json();
    },
    enabled: !!projectId,
  });
}

export function useCreateMilestone() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateMilestoneInput) => {
      const res = await fetch("/api/milestones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create milestone");
      return res.json();
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["milestones"] }),
  });
}

export function useUpdateMilestone() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: UpdateMilestoneInput;
    }) => {
      const res = await fetch(`/api/milestones/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update milestone");
      return res.json();
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["milestones"] }),
  });
}

export function useDeleteMilestone() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/milestones/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete milestone");
      return res.json();
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["milestones"] }),
  });
}

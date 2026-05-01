"use client";

import { useMutation, useQuery, useQueryClient, type QueryKey } from "@tanstack/react-query";
import { toast } from "sonner";
import type {
  CreateMilestoneInput,
  UpdateMilestoneInput,
} from "@/lib/validations/milestone";

type MilestoneCacheItem = { id: string; updatedAt?: string } & Record<string, unknown>;

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
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: ["milestones"] }); // prevent in-flight refetch from clobbering the patch
      const itemSnapshot = queryClient.getQueryData<MilestoneCacheItem>(["milestones", id]);
      const listSnapshots = queryClient.getQueriesData<MilestoneCacheItem[]>({
        queryKey: ["milestones"],
      });
      const now = new Date().toISOString();
      queryClient.setQueryData<MilestoneCacheItem>(["milestones", id], (old) =>
        old ? { ...old, ...data, updatedAt: now } : old,
      );
      queryClient.setQueriesData<MilestoneCacheItem[]>(
        { queryKey: ["milestones"] },
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
      queryClient.setQueryData(["milestones", context.id], context.itemSnapshot);
      for (const [key, data] of context.listSnapshots) {
        queryClient.setQueryData(key as QueryKey, data);
      }
      toast.error("Failed to update milestone");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["milestones"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
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

export interface BulkMilestonesPayload {
  ids: string[];
  action: "mark-done" | "delete" | "reschedule";
  days?: number;
}

export function useBulkMilestones() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: BulkMilestonesPayload) => {
      const res = await fetch("/api/milestones/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Bulk milestone action failed");
      return res.json() as Promise<{ count: number }>;
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["milestones"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["all-items"] });
    },
  });
}

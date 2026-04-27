"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { StartTimeLogInput } from "@/lib/validations/time-log";

export function useTimeLogs(loggableType?: string, loggableId?: string) {
  return useQuery({
    queryKey: ["time-logs", loggableType, loggableId],
    queryFn: async () => {
      const params =
        loggableType && loggableId
          ? `?loggableType=${loggableType}&loggableId=${loggableId}`
          : "";
      const res = await fetch(`/api/time-logs${params}`);
      if (!res.ok) throw new Error("Failed to fetch time logs");
      return res.json();
    },
  });
}

export function useActiveTimer() {
  return useQuery({
    queryKey: ["time-logs", "active"],
    queryFn: async () => {
      const res = await fetch("/api/time-logs/active");
      if (!res.ok) throw new Error("Failed to fetch active timer");
      return res.json();
    },
  });
}

export function useStartTimer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: StartTimeLogInput) => {
      const res = await fetch("/api/time-logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to start timer");
      return res.json();
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["time-logs"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useStopTimer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, notes }: { id: string; notes?: string }) => {
      const res = await fetch(`/api/time-logs/${id}/stop`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes }),
      });
      if (!res.ok) throw new Error("Failed to stop timer");
      return res.json();
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["time-logs"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useDeleteTimeLog() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/time-logs/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete time log");
      return res.json();
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["time-logs"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

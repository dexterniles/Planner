"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { UpsertPayScheduleInput } from "@/lib/validations/bill";

export function usePaySchedule() {
  return useQuery({
    queryKey: ["pay-schedule"],
    queryFn: async () => {
      const res = await fetch("/api/pay-schedule");
      if (!res.ok) throw new Error("Failed to fetch pay schedule");
      return res.json();
    },
  });
}

export function useUpsertPaySchedule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: UpsertPayScheduleInput) => {
      const res = await fetch("/api/pay-schedule", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to save pay schedule");
      return res.json();
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["pay-schedule"] }),
  });
}

export function useDeletePaySchedule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/pay-schedule", { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete pay schedule");
      return res.json();
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["pay-schedule"] }),
  });
}

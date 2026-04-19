"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { CreateRecurrenceRuleInput } from "@/lib/validations/recurrence";

export function useCreateRecurrenceRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateRecurrenceRuleInput) => {
      const res = await fetch("/api/recurrence-rules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create recurrence rule");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assignments"] });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}

export function useDeleteRecurrenceRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/recurrence-rules/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete recurrence rule");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assignments"] });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}

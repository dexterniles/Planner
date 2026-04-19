"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { CreateInboxItemInput } from "@/lib/validations/inbox";

export function useInbox() {
  return useQuery({
    queryKey: ["inbox"],
    queryFn: async () => {
      const res = await fetch("/api/inbox");
      if (!res.ok) throw new Error("Failed to fetch inbox");
      return res.json();
    },
  });
}

export function useCreateInboxItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateInboxItemInput) => {
      const res = await fetch("/api/inbox", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create inbox item");
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["inbox"] }),
  });
}

export function useDeleteInboxItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/inbox/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete inbox item");
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["inbox"] }),
  });
}

export function useTriageInboxItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/inbox/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ triagedAt: new Date().toISOString() }),
      });
      if (!res.ok) throw new Error("Failed to triage inbox item");
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["inbox"] }),
  });
}

"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { CreateTagInput, UpdateTagInput } from "@/lib/validations/tag";

export function useTags() {
  return useQuery({
    queryKey: ["tags"],
    queryFn: async () => {
      const res = await fetch("/api/tags");
      if (!res.ok) throw new Error("Failed to fetch tags");
      return res.json();
    },
  });
}

export function useCreateTag() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateTagInput) => {
      const res = await fetch("/api/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Failed to create tag");
      }
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tags"] }),
  });
}

export function useUpdateTag() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateTagInput }) => {
      const res = await fetch(`/api/tags/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update tag");
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tags"] }),
  });
}

export function useDeleteTag() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/tags/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete tag");
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tags"] }),
  });
}

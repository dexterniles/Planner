"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  CreateEventCategoryInput,
  UpdateEventCategoryInput,
} from "@/lib/validations/event";

export function useEventCategories() {
  return useQuery({
    queryKey: ["event-categories"],
    queryFn: async () => {
      const res = await fetch("/api/event-categories");
      if (!res.ok) throw new Error("Failed to fetch event categories");
      return res.json();
    },
  });
}

export function useCreateEventCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateEventCategoryInput) => {
      const res = await fetch("/api/event-categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Failed to create category");
      }
      return res.json();
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["event-categories"] }),
  });
}

export function useUpdateEventCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: UpdateEventCategoryInput;
    }) => {
      const res = await fetch(`/api/event-categories/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update category");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event-categories"] });
      queryClient.invalidateQueries({ queryKey: ["events"] });
    },
  });
}

export function useDeleteEventCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/event-categories/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete category");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event-categories"] });
      queryClient.invalidateQueries({ queryKey: ["events"] });
    },
  });
}

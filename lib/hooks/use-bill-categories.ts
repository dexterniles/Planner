"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  CreateBillCategoryInput,
  UpdateBillCategoryInput,
} from "@/lib/validations/bill";

export function useBillCategories() {
  return useQuery({
    queryKey: ["bill-categories"],
    queryFn: async () => {
      const res = await fetch("/api/bill-categories");
      if (!res.ok) throw new Error("Failed to fetch bill categories");
      return res.json();
    },
  });
}

export function useCreateBillCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateBillCategoryInput) => {
      const res = await fetch("/api/bill-categories", {
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
      queryClient.invalidateQueries({ queryKey: ["bill-categories"] }),
  });
}

export function useUpdateBillCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: UpdateBillCategoryInput;
    }) => {
      const res = await fetch(`/api/bill-categories/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update category");
      return res.json();
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["bill-categories"] }),
  });
}

export function useDeleteBillCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/bill-categories/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete category");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bill-categories"] });
      queryClient.invalidateQueries({ queryKey: ["bills"] });
    },
  });
}

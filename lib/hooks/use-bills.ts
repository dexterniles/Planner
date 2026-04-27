"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  CreateBillInput,
  UpdateBillInput,
} from "@/lib/validations/bill";

interface BillFilters {
  from?: string;
  to?: string;
  status?: string;
  categoryId?: string;
  limit?: number;
}

export function useBills(filters: BillFilters = {}) {
  const params = new URLSearchParams();
  if (filters.from) params.set("from", filters.from);
  if (filters.to) params.set("to", filters.to);
  if (filters.status) params.set("status", filters.status);
  if (filters.categoryId) params.set("categoryId", filters.categoryId);
  if (filters.limit) params.set("limit", String(filters.limit));
  const query = params.toString();

  return useQuery({
    queryKey: ["bills", filters.from, filters.to, filters.status, filters.categoryId, filters.limit],
    queryFn: async () => {
      const res = await fetch(`/api/bills${query ? `?${query}` : ""}`);
      if (!res.ok) throw new Error("Failed to fetch bills");
      return res.json();
    },
  });
}

export function useBill(id: string) {
  return useQuery({
    queryKey: ["bills", id],
    queryFn: async () => {
      const res = await fetch(`/api/bills/${id}`);
      if (!res.ok) throw new Error("Failed to fetch bill");
      return res.json();
    },
    enabled: !!id,
  });
}

export function useUpcomingBills(limit = 10) {
  return useQuery({
    queryKey: ["bills", "upcoming", limit],
    queryFn: async () => {
      const res = await fetch(`/api/bills/upcoming?limit=${limit}`);
      if (!res.ok) throw new Error("Failed to fetch upcoming bills");
      return res.json();
    },
  });
}

export function useCreateBill() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateBillInput) => {
      const res = await fetch("/api/bills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create bill");
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["bills"] }),
  });
}

export function useUpdateBill() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: UpdateBillInput;
    }) => {
      const res = await fetch(`/api/bills/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update bill");
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["bills"] }),
  });
}

export function useDeleteBill() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/bills/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete bill");
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["bills"] }),
  });
}

export function useBulkMarkPaid() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (ids: string[]) => {
      const res = await fetch("/api/bills/bulk-mark-paid", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      });
      if (!res.ok) throw new Error("Failed to bulk mark paid");
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["bills"] }),
  });
}

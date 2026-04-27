"use client";

import { useMutation, useQuery, useQueryClient, type QueryKey } from "@tanstack/react-query";
import { toast } from "sonner";
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

type BillCacheItem = { id: string; updatedAt?: string } & Record<string, unknown>;

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
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["bills"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
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
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: ["bills"] });
      const itemSnapshot = queryClient.getQueryData<BillCacheItem>(["bills", id]);
      const listSnapshots = queryClient.getQueriesData<BillCacheItem[]>({ queryKey: ["bills"] });
      const now = new Date().toISOString();
      const { amount, paidAmount, ...rest } = data;
      const patch: Partial<BillCacheItem> = {
        ...rest,
        ...(amount !== undefined && { amount: amount.toFixed(2) }),
        ...(paidAmount !== undefined && {
          paidAmount: paidAmount === null ? null : paidAmount.toFixed(2),
        }),
        updatedAt: now,
      };
      queryClient.setQueryData<BillCacheItem>(["bills", id], (old) =>
        old ? { ...old, ...patch } : old,
      );
      queryClient.setQueriesData<BillCacheItem[]>(
        { queryKey: ["bills"] },
        (old) =>
          Array.isArray(old)
            ? old.map((row) => (row.id === id ? { ...row, ...patch } : row))
            : old,
      );
      return { id, itemSnapshot, listSnapshots };
    },
    onError: (_err, _vars, context) => {
      if (!context) return;
      queryClient.setQueryData(["bills", context.id], context.itemSnapshot);
      for (const [key, data] of context.listSnapshots) {
        queryClient.setQueryData(key as QueryKey, data);
      }
      toast.error("Failed to update bill");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["bills"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
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
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["bills"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
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
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["bills"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

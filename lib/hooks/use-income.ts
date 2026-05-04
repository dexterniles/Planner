"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryKey,
} from "@tanstack/react-query";
import { toast } from "sonner";
import type {
  CreateIncomeInput,
  UpdateIncomeInput,
} from "@/lib/validations/income";

interface IncomeFilters {
  from?: string;
  to?: string;
  kind?: string;
  limit?: number;
  enabled?: boolean;
}

type IncomeCacheItem = { id: string; updatedAt?: string } & Record<
  string,
  unknown
>;

export function useIncomeList(filters: IncomeFilters = {}) {
  const params = new URLSearchParams();
  if (filters.from) params.set("from", filters.from);
  if (filters.to) params.set("to", filters.to);
  if (filters.kind) params.set("kind", filters.kind);
  if (filters.limit) params.set("limit", String(filters.limit));
  const query = params.toString();

  return useQuery({
    queryKey: [
      "income",
      filters.from ?? null,
      filters.to ?? null,
      filters.kind ?? null,
    ],
    queryFn: async () => {
      const res = await fetch(`/api/income${query ? `?${query}` : ""}`);
      if (!res.ok) throw new Error("Failed to fetch income");
      return res.json();
    },
    enabled: filters.enabled ?? true,
  });
}

export function useCreateIncome() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateIncomeInput) => {
      const res = await fetch("/api/income", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create income");
      return res.json();
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["income"] });
    },
  });
}

export function useUpdateIncome() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: UpdateIncomeInput;
    }) => {
      const res = await fetch(`/api/income/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update income");
      return res.json();
    },
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: ["income"] });
      const listSnapshots = queryClient.getQueriesData<IncomeCacheItem[]>({
        queryKey: ["income"],
      });
      const now = new Date().toISOString();
      const { amount, ...rest } = data;
      const patch: Partial<IncomeCacheItem> = {
        ...rest,
        ...(amount !== undefined && { amount: amount.toFixed(2) }),
        updatedAt: now,
      };
      queryClient.setQueriesData<IncomeCacheItem[]>(
        { queryKey: ["income"] },
        (old) =>
          Array.isArray(old)
            ? old.map((row) => (row.id === id ? { ...row, ...patch } : row))
            : old,
      );
      return { listSnapshots };
    },
    onError: (_err, _vars, context) => {
      if (!context) return;
      for (const [key, data] of context.listSnapshots) {
        queryClient.setQueryData(key as QueryKey, data);
      }
      toast.error("Failed to update income");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["income"] });
    },
  });
}

export function useDeleteIncome() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/income/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete income");
      return res.json();
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["income"] });
      const listSnapshots = queryClient.getQueriesData<IncomeCacheItem[]>({
        queryKey: ["income"],
      });
      queryClient.setQueriesData<IncomeCacheItem[]>(
        { queryKey: ["income"] },
        (old) => (Array.isArray(old) ? old.filter((row) => row.id !== id) : old),
      );
      return { listSnapshots };
    },
    onError: (_err, _vars, context) => {
      if (!context) return;
      for (const [key, data] of context.listSnapshots) {
        queryClient.setQueryData(key as QueryKey, data);
      }
      toast.error("Failed to delete income");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["income"] });
    },
  });
}

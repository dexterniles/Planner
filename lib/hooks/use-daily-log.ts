"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { UpsertDailyLogInput } from "@/lib/validations/daily-log";

export function useDailyLog(date: string) {
  return useQuery({
    queryKey: ["daily-log", date],
    queryFn: async () => {
      const res = await fetch(`/api/daily-logs?date=${date}`);
      if (!res.ok) throw new Error("Failed to fetch daily log");
      return res.json();
    },
    enabled: !!date,
  });
}

export function useUpsertDailyLog() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: UpsertDailyLogInput) => {
      const res = await fetch("/api/daily-logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to save daily log");
      return res.json();
    },
    onSuccess: (_data, variables) =>
      queryClient.invalidateQueries({
        queryKey: ["daily-log", variables.logDate],
      }),
  });
}

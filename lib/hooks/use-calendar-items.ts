"use client";

import { useQuery } from "@tanstack/react-query";

export function useCalendarItems(month: string) {
  return useQuery({
    queryKey: ["calendar-items", "month", month],
    queryFn: async () => {
      const res = await fetch(`/api/calendar-items?month=${month}`);
      if (!res.ok) throw new Error("Failed to fetch calendar items");
      return res.json();
    },
    enabled: !!month,
  });
}

export function useCalendarItemsRange(from: string, to: string) {
  return useQuery({
    queryKey: ["calendar-items", "range", from, to],
    queryFn: async () => {
      const res = await fetch(`/api/calendar-items?from=${from}&to=${to}`);
      if (!res.ok) throw new Error("Failed to fetch calendar items");
      return res.json();
    },
    enabled: !!from && !!to,
  });
}

"use client";

import { useQuery } from "@tanstack/react-query";

export function useAllItems() {
  return useQuery({
    queryKey: ["all-items"],
    queryFn: async () => {
      const res = await fetch("/api/all-items");
      if (!res.ok) throw new Error("Failed to fetch items");
      return res.json();
    },
  });
}

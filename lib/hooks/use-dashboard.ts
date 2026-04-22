"use client";

import { useQuery } from "@tanstack/react-query";

export function useDashboardStats() {
  return useQuery({
    queryKey: ["dashboard", "stats"],
    queryFn: async () => {
      const res = await fetch("/api/dashboard/stats");
      if (!res.ok) throw new Error("Failed to fetch stats");
      return res.json();
    },
  });
}

export function useDashboardGrades() {
  return useQuery({
    queryKey: ["dashboard", "grades"],
    queryFn: async () => {
      const res = await fetch("/api/dashboard/grades");
      if (!res.ok) throw new Error("Failed to fetch grades");
      return res.json();
    },
  });
}

export function useUpcomingMilestones(limit = 3) {
  return useQuery({
    queryKey: ["milestones", "upcoming", limit],
    queryFn: async () => {
      const res = await fetch(`/api/milestones/upcoming?limit=${limit}`);
      if (!res.ok) throw new Error("Failed to fetch milestones");
      return res.json();
    },
  });
}


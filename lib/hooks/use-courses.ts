"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  CreateCourseInput,
  UpdateCourseInput,
} from "@/lib/validations/course";

export function useCourses(workspaceId?: string) {
  return useQuery({
    queryKey: ["courses", workspaceId],
    queryFn: async () => {
      const params = workspaceId ? `?workspaceId=${workspaceId}` : "";
      const res = await fetch(`/api/courses${params}`);
      if (!res.ok) throw new Error("Failed to fetch courses");
      return res.json();
    },
  });
}

export function useCourse(id: string) {
  return useQuery({
    queryKey: ["courses", id],
    queryFn: async () => {
      const res = await fetch(`/api/courses/${id}`);
      if (!res.ok) throw new Error("Failed to fetch course");
      return res.json();
    },
    enabled: !!id,
  });
}

export function useCreateCourse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateCourseInput) => {
      const res = await fetch("/api/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create course");
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["courses"] }),
  });
}

export function useUpdateCourse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: UpdateCourseInput;
    }) => {
      const res = await fetch(`/api/courses/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update course");
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["courses"] }),
  });
}

export function useDeleteCourse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/courses/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete course");
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["courses"] }),
  });
}

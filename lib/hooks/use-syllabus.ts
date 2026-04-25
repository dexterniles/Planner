"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

interface SyllabusInfo {
  hasSyllabus: boolean;
  url: string | null;
  name: string | null;
  uploadedAt: string | null;
}

export function useSyllabus(courseId: string) {
  return useQuery<SyllabusInfo>({
    queryKey: ["syllabus", courseId],
    queryFn: async () => {
      const res = await fetch(`/api/courses/${courseId}/syllabus`);
      if (!res.ok) throw new Error("Failed to fetch syllabus");
      return res.json();
    },
    enabled: !!courseId,
    // Signed URLs expire in 15 min; refetch after 12 to stay safe.
    staleTime: 12 * 60 * 1000,
  });
}

export function useUploadSyllabus(courseId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(`/api/courses/${courseId}/syllabus`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Upload failed");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["syllabus", courseId] });
      queryClient.invalidateQueries({ queryKey: ["courses", courseId] });
    },
  });
}

export function useDeleteSyllabus(courseId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/courses/${courseId}/syllabus`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Delete failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["syllabus", courseId] });
      queryClient.invalidateQueries({ queryKey: ["courses", courseId] });
    },
  });
}

"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  AddMediaInput,
  MediaStatus,
  MediaType,
  UpdateMediaInput,
} from "@/lib/validations/media";

export interface MediaItem {
  id: string;
  userId: string;
  mediaType: MediaType;
  tmdbId: number;
  imdbId: string | null;
  title: string;
  posterPath: string | null;
  backdropPath: string | null;
  overview: string | null;
  releaseYear: number | null;
  runtime: number | null;
  genres: string[] | null;
  status: MediaStatus;
  rating: string | null;
  watchedAt: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SearchResultItem {
  tmdbId: number;
  mediaType: MediaType;
  title: string;
  year: number | null;
  posterPath: string | null;
  overview: string;
}

export function useMediaList(filters?: {
  status?: MediaStatus | "all";
  mediaType?: MediaType | "all";
}) {
  const status = filters?.status && filters.status !== "all" ? filters.status : null;
  const mediaType =
    filters?.mediaType && filters.mediaType !== "all" ? filters.mediaType : null;
  return useQuery<MediaItem[]>({
    queryKey: ["media", status, mediaType],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (status) params.set("status", status);
      if (mediaType) params.set("mediaType", mediaType);
      const qs = params.toString();
      const res = await fetch(`/api/movies${qs ? `?${qs}` : ""}`);
      if (!res.ok) throw new Error("Failed to fetch library");
      return res.json();
    },
  });
}

export function useMedia(id: string) {
  return useQuery<MediaItem>({
    queryKey: ["media", "item", id],
    queryFn: async () => {
      const res = await fetch(`/api/movies/${id}`);
      if (!res.ok) throw new Error("Failed to fetch item");
      return res.json();
    },
    enabled: !!id,
  });
}

export function useTmdbSearch(query: string) {
  const trimmed = query.trim();
  return useQuery<{ results: SearchResultItem[] }>({
    queryKey: ["tmdb-search", trimmed],
    queryFn: async () => {
      if (trimmed.length < 2) return { results: [] };
      const res = await fetch(
        `/api/movies/search?q=${encodeURIComponent(trimmed)}`,
      );
      if (!res.ok) throw new Error("Search failed");
      return res.json();
    },
    enabled: trimmed.length >= 2,
    staleTime: 60_000,
  });
}

export function useAddMedia() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: AddMediaInput) => {
      const res = await fetch("/api/movies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Add failed");
      }
      return (await res.json()) as MediaItem;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["media"] });
    },
  });
}

export function useUpdateMedia() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: UpdateMediaInput;
    }) => {
      const res = await fetch(`/api/movies/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Update failed");
      return (await res.json()) as MediaItem;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["media"] });
    },
  });
}

export function useDeleteMedia() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/movies/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["media"] });
    },
  });
}

export function useRefreshMedia() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/movies/${id}/refresh`, { method: "POST" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Refresh failed");
      }
      return (await res.json()) as MediaItem;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["media"] });
    },
  });
}

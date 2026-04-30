"use client";

import { useMutation, useQuery, useQueryClient, type QueryKey } from "@tanstack/react-query";
import { toast } from "sonner";
import type {
  AddMediaInput,
  MediaStatus,
  MediaType,
  UpdateMediaInput,
} from "@/lib/validations/media";
import type { MediaMetadata } from "@/lib/db/schema";

export type { MediaMetadata } from "@/lib/db/schema";

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
  metadata: MediaMetadata | null;
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
    onMutate: async ({ id, data }) => {
      await qc.cancelQueries({ queryKey: ["media"] }); // prevent in-flight refetch from clobbering the patch
      const itemSnapshot = qc.getQueryData<MediaItem>(["media", "item", id]);
      const listSnapshots = qc.getQueriesData<MediaItem[]>({ queryKey: ["media"] });
      const now = new Date().toISOString();
      const patch: Partial<MediaItem> = {
        ...(data.status !== undefined ? { status: data.status } : {}),
        ...(data.rating !== undefined
          ? { rating: data.rating === null ? null : data.rating.toFixed(1) }
          : {}),
        ...(data.watchedAt !== undefined ? { watchedAt: data.watchedAt } : {}),
        ...(data.notes !== undefined ? { notes: data.notes } : {}),
      };
      qc.setQueryData<MediaItem>(["media", "item", id], (old) =>
        old ? { ...old, ...patch, updatedAt: now } : old,
      );
      qc.setQueriesData<MediaItem[]>(
        { queryKey: ["media"] },
        (old) =>
          Array.isArray(old)
            ? old.map((row) =>
                row.id === id ? { ...row, ...patch, updatedAt: now } : row,
              )
            : old,
      );
      return { id, itemSnapshot, listSnapshots };
    },
    onError: (_err, _vars, context) => {
      if (!context) return;
      qc.setQueryData(["media", "item", context.id], context.itemSnapshot);
      for (const [key, data] of context.listSnapshots) {
        qc.setQueryData(key as QueryKey, data);
      }
      toast.error("Failed to update item");
    },
    onSettled: () => {
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

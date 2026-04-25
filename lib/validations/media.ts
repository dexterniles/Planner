import { z } from "zod";

export const mediaTypeValues = ["movie", "tv"] as const;
export const mediaStatusValues = ["watchlist", "watching", "watched"] as const;

/** What the client sends when adding from a TMDB search result. */
export const addMediaSchema = z.object({
  mediaType: z.enum(mediaTypeValues),
  tmdbId: z.number().int().positive(),
  status: z.enum(mediaStatusValues).optional(),
});

/** What the client sends when updating an existing entry. */
export const updateMediaSchema = z.object({
  status: z.enum(mediaStatusValues).optional(),
  rating: z
    .number()
    .min(0)
    .max(5)
    .multipleOf(0.5)
    .nullable()
    .optional(),
  watchedAt: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});

export type AddMediaInput = z.infer<typeof addMediaSchema>;
export type UpdateMediaInput = z.infer<typeof updateMediaSchema>;

export type MediaType = (typeof mediaTypeValues)[number];
export type MediaStatus = (typeof mediaStatusValues)[number];

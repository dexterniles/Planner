-- Custom SQL migration file, put your code below! --

-- Adds a JSONB metadata column to media_items so we can persist richer TMDB
-- detail fields (director / created_by, composer, top cast, tagline, episode
-- count, original language) without bloating the base row schema.

ALTER TABLE "media_items" ADD COLUMN IF NOT EXISTS "metadata" jsonb;

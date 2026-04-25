-- Custom SQL migration file, put your code below! --

CREATE TYPE "public"."media_type" AS ENUM('movie', 'tv');
--> statement-breakpoint
CREATE TYPE "public"."media_status" AS ENUM('watchlist', 'watching', 'watched');
--> statement-breakpoint
CREATE TABLE "media_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"media_type" "public"."media_type" NOT NULL,
	"tmdb_id" integer NOT NULL,
	"imdb_id" text,
	"title" text NOT NULL,
	"poster_path" text,
	"backdrop_path" text,
	"overview" text,
	"release_year" integer,
	"runtime" integer,
	"genres" jsonb,
	"status" "public"."media_status" DEFAULT 'watchlist' NOT NULL,
	"rating" numeric(2, 1),
	"watched_at" timestamp with time zone,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "media_items_user_id_idx" ON "media_items" USING btree ("user_id");
--> statement-breakpoint
CREATE UNIQUE INDEX "media_items_user_media_unique" ON "media_items" USING btree ("user_id","media_type","tmdb_id");

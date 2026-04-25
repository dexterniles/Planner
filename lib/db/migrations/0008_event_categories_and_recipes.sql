-- Custom SQL migration file, put your code below! --

-- ============================================================================
-- EVENT CATEGORIES (user-customizable, mirrors bill_categories)
-- ============================================================================

CREATE TABLE "event_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"color" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "event_categories_user_id_idx" ON "event_categories" USING btree ("user_id");
--> statement-breakpoint
CREATE UNIQUE INDEX "event_categories_user_id_name_idx" ON "event_categories" USING btree ("user_id","name");
--> statement-breakpoint

-- Seed defaults for the single user, mirroring the prior enum + colors.
INSERT INTO "event_categories" ("user_id", "name", "color", "sort_order") VALUES
	('00000000-0000-0000-0000-000000000001', 'dinner', '#F59E0B', 0),
	('00000000-0000-0000-0000-000000000001', 'concert', '#8B5CF6', 1),
	('00000000-0000-0000-0000-000000000001', 'travel', '#10B981', 2),
	('00000000-0000-0000-0000-000000000001', 'hangout', '#3B82F6', 3),
	('00000000-0000-0000-0000-000000000001', 'appointment', '#64748B', 4),
	('00000000-0000-0000-0000-000000000001', 'social', '#EC4899', 5),
	('00000000-0000-0000-0000-000000000001', 'other', '#6366F1', 6);
--> statement-breakpoint

-- Add the new FK column on events.
ALTER TABLE "events" ADD COLUMN "category_id" uuid;
--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_category_id_event_categories_id_fk"
	FOREIGN KEY ("category_id") REFERENCES "public"."event_categories"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint

-- Backfill: link each existing event to the seeded category whose name matches the old enum value.
UPDATE "events" e
SET "category_id" = ec."id"
FROM "event_categories" ec
WHERE ec."user_id" = e."user_id"
	AND ec."name" = e."category"::text;
--> statement-breakpoint

-- Drop the old enum column and its index/type.
DROP INDEX IF EXISTS "events_category_idx";
--> statement-breakpoint
ALTER TABLE "events" DROP COLUMN "category";
--> statement-breakpoint
DROP TYPE IF EXISTS "public"."event_category";
--> statement-breakpoint

CREATE INDEX "events_category_id_idx" ON "events" USING btree ("category_id");
--> statement-breakpoint

-- ============================================================================
-- RECIPES
-- ============================================================================

CREATE TABLE "recipes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"prep_time_minutes" integer,
	"cook_time_minutes" integer,
	"portions" integer DEFAULT 1 NOT NULL,
	"notes" text,
	"source_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "recipes_user_id_idx" ON "recipes" USING btree ("user_id");
--> statement-breakpoint

CREATE TABLE "recipe_ingredients" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"recipe_id" uuid NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"quantity" numeric(10, 3),
	"unit" text,
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "recipe_ingredients" ADD CONSTRAINT "recipe_ingredients_recipe_id_recipes_id_fk"
	FOREIGN KEY ("recipe_id") REFERENCES "public"."recipes"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "recipe_ingredients_recipe_id_idx" ON "recipe_ingredients" USING btree ("recipe_id");
--> statement-breakpoint

CREATE TABLE "recipe_steps" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"recipe_id" uuid NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"body" text NOT NULL,
	"duration_minutes" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "recipe_steps" ADD CONSTRAINT "recipe_steps_recipe_id_recipes_id_fk"
	FOREIGN KEY ("recipe_id") REFERENCES "public"."recipes"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "recipe_steps_recipe_id_idx" ON "recipe_steps" USING btree ("recipe_id");
--> statement-breakpoint

CREATE TABLE "recipe_equipment" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"recipe_id" uuid NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "recipe_equipment" ADD CONSTRAINT "recipe_equipment_recipe_id_recipes_id_fk"
	FOREIGN KEY ("recipe_id") REFERENCES "public"."recipes"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX "recipe_equipment_recipe_id_idx" ON "recipe_equipment" USING btree ("recipe_id");

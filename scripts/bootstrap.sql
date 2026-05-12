-- =============================================================================
-- Planner — bootstrap migration (concatenated 0000 through 0012)
-- =============================================================================
-- One-time use: paste this entire file into Supabase Dashboard → SQL Editor
-- on a FRESH database to bring it up to the current schema.
--
-- Migrations 0007 + 0008 + 0010 create media_items and recipe tables; 0012
-- drops them. The create-then-drop preserves migration history; the net
-- end-state has neither movies nor recipes tables.
-- =============================================================================

-- ---- 0000_simple_blink.sql ----------------------------------------------------------------

CREATE TYPE "public"."assignment_status" AS ENUM('not_started', 'in_progress', 'submitted', 'graded');
CREATE TYPE "public"."course_status" AS ENUM('active', 'completed', 'dropped', 'planned');
CREATE TYPE "public"."note_parent_type" AS ENUM('course', 'project', 'assignment', 'task', 'session', 'daily_log', 'standalone');
CREATE TYPE "public"."priority" AS ENUM('low', 'medium', 'high', 'urgent');
CREATE TYPE "public"."project_status" AS ENUM('planning', 'active', 'paused', 'done');
CREATE TYPE "public"."recurrence_frequency" AS ENUM('daily', 'weekly', 'biweekly', 'monthly', 'custom');
CREATE TYPE "public"."recurrence_owner_type" AS ENUM('assignment', 'task');
CREATE TYPE "public"."resource_parent_type" AS ENUM('course', 'project', 'assignment', 'task');
CREATE TYPE "public"."resource_type" AS ENUM('link', 'file', 'book_reference');
CREATE TYPE "public"."task_status" AS ENUM('not_started', 'in_progress', 'done', 'cancelled');
CREATE TYPE "public"."time_log_parent_type" AS ENUM('course', 'project', 'assignment', 'task');
CREATE TYPE "public"."workspace_type" AS ENUM('academic', 'projects', 'custom');
CREATE TABLE "assignments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"course_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"due_date" timestamp with time zone,
	"category_id" uuid,
	"status" "assignment_status" DEFAULT 'not_started' NOT NULL,
	"points_earned" numeric(7, 2),
	"points_possible" numeric(7, 2),
	"notes" text,
	"recurrence_rule_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "courses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"code" text,
	"instructor" text,
	"semester" text,
	"credits" integer,
	"meeting_schedule" jsonb,
	"syllabus_file_path" text,
	"color" text,
	"status" "course_status" DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "daily_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"log_date" date NOT NULL,
	"content" text,
	"mood" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "grade_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"course_id" uuid NOT NULL,
	"name" text NOT NULL,
	"weight" numeric(5, 2) NOT NULL,
	"drop_lowest_n" integer DEFAULT 0 NOT NULL
);

CREATE TABLE "inbox_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"content" text NOT NULL,
	"captured_at" timestamp with time zone DEFAULT now() NOT NULL,
	"triaged_at" timestamp with time zone,
	"resulting_item_type" text,
	"resulting_item_id" uuid
);

CREATE TABLE "milestones" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"target_date" date,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "notes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"parent_type" "note_parent_type" NOT NULL,
	"parent_id" uuid,
	"title" text,
	"content" text,
	"session_date" date,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "projects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"goal" text,
	"status" "project_status" DEFAULT 'planning' NOT NULL,
	"priority" "priority" DEFAULT 'medium' NOT NULL,
	"start_date" date,
	"target_date" date,
	"color" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "recurrence_rules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_type" "recurrence_owner_type" NOT NULL,
	"owner_id" uuid NOT NULL,
	"frequency" "recurrence_frequency" NOT NULL,
	"interval" integer DEFAULT 1 NOT NULL,
	"days_of_week" integer[],
	"end_date" date,
	"count" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "resources" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"parent_type" "resource_parent_type" NOT NULL,
	"parent_id" uuid NOT NULL,
	"type" "resource_type" NOT NULL,
	"title" text NOT NULL,
	"url" text,
	"file_path" text,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "taggings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tag_id" uuid NOT NULL,
	"taggable_type" text NOT NULL,
	"taggable_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "tags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"color" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"due_date" timestamp with time zone,
	"status" "task_status" DEFAULT 'not_started' NOT NULL,
	"priority" "priority" DEFAULT 'medium' NOT NULL,
	"parent_task_id" uuid,
	"notes" text,
	"recurrence_rule_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "time_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"loggable_type" time_log_parent_type NOT NULL,
	"loggable_id" uuid NOT NULL,
	"started_at" timestamp with time zone NOT NULL,
	"ended_at" timestamp with time zone,
	"duration_seconds" integer,
	"was_pomodoro" boolean DEFAULT false NOT NULL,
	"pomodoro_interval_minutes" integer,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "workspaces" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"type" "workspace_type" NOT NULL,
	"color" text,
	"icon" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE "assignments" ADD CONSTRAINT "assignments_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_category_id_grade_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."grade_categories"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_recurrence_rule_id_recurrence_rules_id_fk" FOREIGN KEY ("recurrence_rule_id") REFERENCES "public"."recurrence_rules"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "courses" ADD CONSTRAINT "courses_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "grade_categories" ADD CONSTRAINT "grade_categories_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "milestones" ADD CONSTRAINT "milestones_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "projects" ADD CONSTRAINT "projects_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "taggings" ADD CONSTRAINT "taggings_tag_id_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_recurrence_rule_id_recurrence_rules_id_fk" FOREIGN KEY ("recurrence_rule_id") REFERENCES "public"."recurrence_rules"("id") ON DELETE set null ON UPDATE no action;
CREATE INDEX "assignments_user_id_idx" ON "assignments" USING btree ("user_id");
CREATE INDEX "assignments_due_date_idx" ON "assignments" USING btree ("due_date");
CREATE INDEX "courses_user_id_idx" ON "courses" USING btree ("user_id");
CREATE INDEX "courses_workspace_id_idx" ON "courses" USING btree ("workspace_id");
CREATE INDEX "daily_logs_user_id_idx" ON "daily_logs" USING btree ("user_id");
CREATE UNIQUE INDEX "daily_logs_user_id_log_date_idx" ON "daily_logs" USING btree ("user_id","log_date");
CREATE INDEX "inbox_items_user_id_idx" ON "inbox_items" USING btree ("user_id");
CREATE INDEX "notes_user_id_idx" ON "notes" USING btree ("user_id");
CREATE INDEX "notes_parent_idx" ON "notes" USING btree ("parent_type","parent_id");
CREATE INDEX "projects_user_id_idx" ON "projects" USING btree ("user_id");
CREATE INDEX "projects_workspace_id_idx" ON "projects" USING btree ("workspace_id");
CREATE INDEX "resources_user_id_idx" ON "resources" USING btree ("user_id");
CREATE INDEX "resources_parent_idx" ON "resources" USING btree ("parent_type","parent_id");
CREATE INDEX "taggings_parent_idx" ON "taggings" USING btree ("taggable_type","taggable_id");
CREATE INDEX "tags_user_id_idx" ON "tags" USING btree ("user_id");
CREATE UNIQUE INDEX "tags_user_id_name_idx" ON "tags" USING btree ("user_id","name");
CREATE INDEX "tasks_user_id_idx" ON "tasks" USING btree ("user_id");
CREATE INDEX "tasks_due_date_idx" ON "tasks" USING btree ("due_date");
CREATE INDEX "time_logs_user_id_idx" ON "time_logs" USING btree ("user_id");
CREATE INDEX "workspaces_user_id_idx" ON "workspaces" USING btree ("user_id");


-- ---- 0001_left_victor_mancha.sql ----------------------------------------------------------------

CREATE TYPE "public"."event_category" AS ENUM('dinner', 'concert', 'travel', 'hangout', 'appointment', 'social', 'other');
CREATE TYPE "public"."event_status" AS ENUM('confirmed', 'tentative', 'cancelled', 'completed');
ALTER TYPE "public"."note_parent_type" ADD VALUE 'event';
ALTER TYPE "public"."recurrence_owner_type" ADD VALUE 'event';
CREATE TABLE "events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"category" "event_category" DEFAULT 'other' NOT NULL,
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone,
	"all_day" boolean DEFAULT false NOT NULL,
	"location" text,
	"url" text,
	"attendees" text,
	"status" "event_status" DEFAULT 'confirmed' NOT NULL,
	"color" text,
	"recurrence_rule_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE "events" ADD CONSTRAINT "events_recurrence_rule_id_recurrence_rules_id_fk" FOREIGN KEY ("recurrence_rule_id") REFERENCES "public"."recurrence_rules"("id") ON DELETE set null ON UPDATE no action;
CREATE INDEX "events_user_id_idx" ON "events" USING btree ("user_id");
CREATE INDEX "events_starts_at_idx" ON "events" USING btree ("starts_at");
CREATE INDEX "events_category_idx" ON "events" USING btree ("category");
CREATE INDEX "events_status_idx" ON "events" USING btree ("status");


-- ---- 0002_cold_outlaw_kid.sql ----------------------------------------------------------------

CREATE TYPE "public"."bill_status" AS ENUM('unpaid', 'paid', 'skipped');
CREATE TYPE "public"."pay_frequency" AS ENUM('weekly', 'biweekly', 'monthly');
ALTER TYPE "public"."recurrence_owner_type" ADD VALUE 'bill';
CREATE TABLE "bill_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"color" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "bills" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"amount" numeric(10, 2) NOT NULL,
	"category_id" uuid,
	"due_date" date NOT NULL,
	"status" "bill_status" DEFAULT 'unpaid' NOT NULL,
	"paid_at" timestamp with time zone,
	"paid_amount" numeric(10, 2),
	"notes" text,
	"color" text,
	"recurrence_rule_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "pay_schedule" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"frequency" "pay_frequency" NOT NULL,
	"reference_date" date NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE "bills" ADD CONSTRAINT "bills_category_id_bill_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."bill_categories"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "bills" ADD CONSTRAINT "bills_recurrence_rule_id_recurrence_rules_id_fk" FOREIGN KEY ("recurrence_rule_id") REFERENCES "public"."recurrence_rules"("id") ON DELETE set null ON UPDATE no action;
CREATE INDEX "bill_categories_user_id_idx" ON "bill_categories" USING btree ("user_id");
CREATE UNIQUE INDEX "bill_categories_user_id_name_idx" ON "bill_categories" USING btree ("user_id","name");
CREATE INDEX "bills_user_id_idx" ON "bills" USING btree ("user_id");
CREATE INDEX "bills_due_date_idx" ON "bills" USING btree ("due_date");
CREATE INDEX "bills_status_idx" ON "bills" USING btree ("status");
CREATE INDEX "bills_category_id_idx" ON "bills" USING btree ("category_id");
CREATE UNIQUE INDEX "pay_schedule_user_id_idx" ON "pay_schedule" USING btree ("user_id");


-- ---- 0003_fix_local_timezone_drift.sql ----------------------------------------------------------------

-- Custom SQL migration file, put your code below! --

-- Fix local-timezone drift for assignment and task due dates.
--
-- Before this migration, datetime-local input strings (e.g. "2026-04-22T23:59")
-- were sent raw from the client to the API, which ran `new Date(str)` on a
-- UTC server. That effectively stored the user's local wall-clock as UTC,
-- so "11:59 PM Eastern" was persisted as 23:59 UTC (which reads back as
-- 7:59 PM Eastern — a 4-hour negative drift).
--
-- This migration reinterprets every existing assignment and task due-date as
-- if it had been America/New_York local time all along, producing the correct
-- UTC moment. Handles EDT (UTC-4) and EST (UTC-5) automatically via the
-- timezone database, so dates across DST boundaries shift by the right amount.
--
-- Not idempotent. Drizzle's migration ledger ensures it only runs once.
-- After running, go through the app and tweak any rows whose original input
-- was already correct.

UPDATE "assignments"
SET "due_date" = ("due_date" AT TIME ZONE 'UTC') AT TIME ZONE 'America/New_York'
WHERE "due_date" IS NOT NULL;

UPDATE "tasks"
SET "due_date" = ("due_date" AT TIME ZONE 'UTC') AT TIME ZONE 'America/New_York'
WHERE "due_date" IS NOT NULL;


-- ---- 0004_courses_add_date_range.sql ----------------------------------------------------------------

ALTER TABLE "courses" ADD COLUMN "start_date" date;
ALTER TABLE "courses" ADD COLUMN "end_date" date;


-- ---- 0005_courses_syllabus_metadata.sql ----------------------------------------------------------------

ALTER TABLE "courses" ADD COLUMN "syllabus_name" text;
ALTER TABLE "courses" ADD COLUMN "syllabus_uploaded_at" timestamp with time zone;


-- ---- 0006_drop_daily_logs.sql ----------------------------------------------------------------

-- Custom SQL migration file, put your code below! --

-- Drop the orphaned daily_logs table. The Daily Log feature was removed and
-- the table was left behind in case any data needed preserving. Confirmed
-- empty before applying.

DROP TABLE IF EXISTS "daily_logs";


-- ---- 0007_add_media_items.sql ----------------------------------------------------------------

-- Custom SQL migration file, put your code below! --

CREATE TYPE "public"."media_type" AS ENUM('movie', 'tv');

CREATE TYPE "public"."media_status" AS ENUM('watchlist', 'watching', 'watched');

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

CREATE INDEX "media_items_user_id_idx" ON "media_items" USING btree ("user_id");

CREATE UNIQUE INDEX "media_items_user_media_unique" ON "media_items" USING btree ("user_id","media_type","tmdb_id");


-- ---- 0008_event_categories_and_recipes.sql ----------------------------------------------------------------

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

CREATE INDEX "event_categories_user_id_idx" ON "event_categories" USING btree ("user_id");

CREATE UNIQUE INDEX "event_categories_user_id_name_idx" ON "event_categories" USING btree ("user_id","name");


-- Seed defaults for the single user, mirroring the prior enum + colors.
INSERT INTO "event_categories" ("user_id", "name", "color", "sort_order") VALUES
	('00000000-0000-0000-0000-000000000001', 'dinner', '#F59E0B', 0),
	('00000000-0000-0000-0000-000000000001', 'concert', '#8B5CF6', 1),
	('00000000-0000-0000-0000-000000000001', 'travel', '#10B981', 2),
	('00000000-0000-0000-0000-000000000001', 'hangout', '#3B82F6', 3),
	('00000000-0000-0000-0000-000000000001', 'appointment', '#64748B', 4),
	('00000000-0000-0000-0000-000000000001', 'social', '#EC4899', 5),
	('00000000-0000-0000-0000-000000000001', 'other', '#6366F1', 6);


-- Add the new FK column on events.
ALTER TABLE "events" ADD COLUMN "category_id" uuid;

ALTER TABLE "events" ADD CONSTRAINT "events_category_id_event_categories_id_fk"
	FOREIGN KEY ("category_id") REFERENCES "public"."event_categories"("id") ON DELETE set null ON UPDATE no action;


-- Backfill: link each existing event to the seeded category whose name matches the old enum value.
UPDATE "events" e
SET "category_id" = ec."id"
FROM "event_categories" ec
WHERE ec."user_id" = e."user_id"
	AND ec."name" = e."category"::text;


-- Drop the old enum column and its index/type.
DROP INDEX IF EXISTS "events_category_idx";

ALTER TABLE "events" DROP COLUMN "category";

DROP TYPE IF EXISTS "public"."event_category";


CREATE INDEX "events_category_id_idx" ON "events" USING btree ("category_id");


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

CREATE INDEX "recipes_user_id_idx" ON "recipes" USING btree ("user_id");


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

ALTER TABLE "recipe_ingredients" ADD CONSTRAINT "recipe_ingredients_recipe_id_recipes_id_fk"
	FOREIGN KEY ("recipe_id") REFERENCES "public"."recipes"("id") ON DELETE cascade ON UPDATE no action;

CREATE INDEX "recipe_ingredients_recipe_id_idx" ON "recipe_ingredients" USING btree ("recipe_id");


CREATE TABLE "recipe_steps" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"recipe_id" uuid NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"body" text NOT NULL,
	"duration_minutes" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE "recipe_steps" ADD CONSTRAINT "recipe_steps_recipe_id_recipes_id_fk"
	FOREIGN KEY ("recipe_id") REFERENCES "public"."recipes"("id") ON DELETE cascade ON UPDATE no action;

CREATE INDEX "recipe_steps_recipe_id_idx" ON "recipe_steps" USING btree ("recipe_id");


CREATE TABLE "recipe_equipment" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"recipe_id" uuid NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

ALTER TABLE "recipe_equipment" ADD CONSTRAINT "recipe_equipment_recipe_id_recipes_id_fk"
	FOREIGN KEY ("recipe_id") REFERENCES "public"."recipes"("id") ON DELETE cascade ON UPDATE no action;

CREATE INDEX "recipe_equipment_recipe_id_idx" ON "recipe_equipment" USING btree ("recipe_id");


-- ---- 0009_drop_recurrence_owner_add_indexes.sql ----------------------------------------------------------------

-- Custom SQL migration file, put your code below! --

-- ============================================================================
-- S14 — Drop placeholder owner_type / owner_id columns from recurrence_rules.
-- The link from a recurrence rule to its parent (assignment / task / event /
-- bill) is stored on the parent's `recurrence_rule_id` column, which remains.
-- ============================================================================

ALTER TABLE "recurrence_rules" DROP COLUMN IF EXISTS "owner_type";

ALTER TABLE "recurrence_rules" DROP COLUMN IF EXISTS "owner_id";


-- ============================================================================
-- S15 — Net-new indexes covering hot read paths.
-- ============================================================================

CREATE INDEX IF NOT EXISTS "assignments_course_id_idx" ON "assignments" USING btree ("course_id");

CREATE INDEX IF NOT EXISTS "tasks_project_id_idx" ON "tasks" USING btree ("project_id");

CREATE INDEX IF NOT EXISTS "milestones_project_id_idx" ON "milestones" USING btree ("project_id");

CREATE INDEX IF NOT EXISTS "time_logs_loggable_idx" ON "time_logs" USING btree ("loggable_type","loggable_id");

CREATE INDEX IF NOT EXISTS "time_logs_active_idx" ON "time_logs" USING btree ("user_id","ended_at") WHERE "ended_at" IS NULL;

CREATE INDEX IF NOT EXISTS "bills_user_status_due_idx" ON "bills" USING btree ("user_id","status","due_date");

CREATE INDEX IF NOT EXISTS "media_items_user_created_idx" ON "media_items" USING btree ("user_id","created_at");

CREATE INDEX IF NOT EXISTS "taggings_tag_id_idx" ON "taggings" USING btree ("tag_id");

CREATE INDEX IF NOT EXISTS "grade_categories_course_id_idx" ON "grade_categories" USING btree ("course_id");


-- ---- 0010_media_items_metadata.sql ----------------------------------------------------------------

-- Custom SQL migration file, put your code below! --

-- Adds a JSONB metadata column to media_items so we can persist richer TMDB
-- detail fields (director / created_by, composer, top cast, tagline, episode
-- count, original language) without bloating the base row schema.

ALTER TABLE "media_items" ADD COLUMN IF NOT EXISTS "metadata" jsonb;


-- ---- 0011_income_entries.sql ----------------------------------------------------------------

-- Custom SQL migration file, put your code below! --

-- ============================================================================
-- Income tracking — paychecks + misc income.
-- Single table with a `kind` enum, period-totaling friendly. Mirrors the bills
-- shape (one table, multi-status) so summary math is simple.
-- ============================================================================

DO $$ BEGIN
  CREATE TYPE "public"."income_kind" AS ENUM('paycheck', 'misc');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;


CREATE TABLE IF NOT EXISTS "income_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"kind" "public"."income_kind" NOT NULL,
	"received_date" date NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"source" text,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);


CREATE INDEX IF NOT EXISTS "income_entries_user_id_idx" ON "income_entries" USING btree ("user_id");

CREATE INDEX IF NOT EXISTS "income_entries_received_date_idx" ON "income_entries" USING btree ("received_date");

CREATE INDEX IF NOT EXISTS "income_entries_user_kind_date_idx" ON "income_entries" USING btree ("user_id","kind","received_date");


-- ---- 0012_drop_movies_recipes.sql ----------------------------------------------------------------

-- Remove movies/TV (media) and recipes feature areas.
-- Polymorphic taggings rows referencing recipes become orphans on table drop;
-- delete them first since taggings has no FK constraint to recipes.
DELETE FROM "taggings" WHERE "taggable_type" = 'recipe';

-- Recipe child tables cascade from `recipes`, but drop them explicitly
-- in order for clarity. CASCADE is defense-in-depth.
DROP TABLE IF EXISTS "recipe_equipment" CASCADE;
DROP TABLE IF EXISTS "recipe_steps" CASCADE;
DROP TABLE IF EXISTS "recipe_ingredients" CASCADE;
DROP TABLE IF EXISTS "recipes" CASCADE;

DROP TABLE IF EXISTS "media_items" CASCADE;
DROP TYPE IF EXISTS "media_status";
DROP TYPE IF EXISTS "media_type";



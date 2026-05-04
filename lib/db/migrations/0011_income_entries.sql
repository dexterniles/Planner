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
--> statement-breakpoint

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
--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "income_entries_user_id_idx" ON "income_entries" USING btree ("user_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "income_entries_received_date_idx" ON "income_entries" USING btree ("received_date");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "income_entries_user_kind_date_idx" ON "income_entries" USING btree ("user_id","kind","received_date");

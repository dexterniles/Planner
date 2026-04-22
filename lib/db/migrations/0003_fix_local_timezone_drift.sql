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
--> statement-breakpoint
UPDATE "tasks"
SET "due_date" = ("due_date" AT TIME ZONE 'UTC') AT TIME ZONE 'America/New_York'
WHERE "due_date" IS NOT NULL;

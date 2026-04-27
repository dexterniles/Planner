-- Custom SQL migration file, put your code below! --

-- ============================================================================
-- S14 — Drop placeholder owner_type / owner_id columns from recurrence_rules.
-- The link from a recurrence rule to its parent (assignment / task / event /
-- bill) is stored on the parent's `recurrence_rule_id` column, which remains.
-- ============================================================================

ALTER TABLE "recurrence_rules" DROP COLUMN IF EXISTS "owner_type";
--> statement-breakpoint
ALTER TABLE "recurrence_rules" DROP COLUMN IF EXISTS "owner_id";
--> statement-breakpoint

-- ============================================================================
-- S15 — Net-new indexes covering hot read paths.
-- ============================================================================

CREATE INDEX IF NOT EXISTS "assignments_course_id_idx" ON "assignments" USING btree ("course_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "tasks_project_id_idx" ON "tasks" USING btree ("project_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "milestones_project_id_idx" ON "milestones" USING btree ("project_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "time_logs_loggable_idx" ON "time_logs" USING btree ("loggable_type","loggable_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "time_logs_active_idx" ON "time_logs" USING btree ("user_id","ended_at") WHERE "ended_at" IS NULL;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "bills_user_status_due_idx" ON "bills" USING btree ("user_id","status","due_date");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "media_items_user_created_idx" ON "media_items" USING btree ("user_id","created_at");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "taggings_tag_id_idx" ON "taggings" USING btree ("tag_id");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "grade_categories_course_id_idx" ON "grade_categories" USING btree ("course_id");

CREATE TYPE "public"."assignment_status" AS ENUM('not_started', 'in_progress', 'submitted', 'graded');--> statement-breakpoint
CREATE TYPE "public"."course_status" AS ENUM('active', 'completed', 'dropped', 'planned');--> statement-breakpoint
CREATE TYPE "public"."note_parent_type" AS ENUM('course', 'project', 'assignment', 'task', 'session', 'daily_log', 'standalone');--> statement-breakpoint
CREATE TYPE "public"."priority" AS ENUM('low', 'medium', 'high', 'urgent');--> statement-breakpoint
CREATE TYPE "public"."project_status" AS ENUM('planning', 'active', 'paused', 'done');--> statement-breakpoint
CREATE TYPE "public"."recurrence_frequency" AS ENUM('daily', 'weekly', 'biweekly', 'monthly', 'custom');--> statement-breakpoint
CREATE TYPE "public"."recurrence_owner_type" AS ENUM('assignment', 'task');--> statement-breakpoint
CREATE TYPE "public"."resource_parent_type" AS ENUM('course', 'project', 'assignment', 'task');--> statement-breakpoint
CREATE TYPE "public"."resource_type" AS ENUM('link', 'file', 'book_reference');--> statement-breakpoint
CREATE TYPE "public"."task_status" AS ENUM('not_started', 'in_progress', 'done', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."time_log_parent_type" AS ENUM('course', 'project', 'assignment', 'task');--> statement-breakpoint
CREATE TYPE "public"."workspace_type" AS ENUM('academic', 'projects', 'custom');--> statement-breakpoint
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
--> statement-breakpoint
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
--> statement-breakpoint
CREATE TABLE "daily_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"log_date" date NOT NULL,
	"content" text,
	"mood" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "grade_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"course_id" uuid NOT NULL,
	"name" text NOT NULL,
	"weight" numeric(5, 2) NOT NULL,
	"drop_lowest_n" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "inbox_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"content" text NOT NULL,
	"captured_at" timestamp with time zone DEFAULT now() NOT NULL,
	"triaged_at" timestamp with time zone,
	"resulting_item_type" text,
	"resulting_item_id" uuid
);
--> statement-breakpoint
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
--> statement-breakpoint
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
--> statement-breakpoint
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
--> statement-breakpoint
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
--> statement-breakpoint
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
--> statement-breakpoint
CREATE TABLE "taggings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tag_id" uuid NOT NULL,
	"taggable_type" text NOT NULL,
	"taggable_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"color" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
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
--> statement-breakpoint
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
--> statement-breakpoint
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
--> statement-breakpoint
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_category_id_grade_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."grade_categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_recurrence_rule_id_recurrence_rules_id_fk" FOREIGN KEY ("recurrence_rule_id") REFERENCES "public"."recurrence_rules"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "courses" ADD CONSTRAINT "courses_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "grade_categories" ADD CONSTRAINT "grade_categories_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "milestones" ADD CONSTRAINT "milestones_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "taggings" ADD CONSTRAINT "taggings_tag_id_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_recurrence_rule_id_recurrence_rules_id_fk" FOREIGN KEY ("recurrence_rule_id") REFERENCES "public"."recurrence_rules"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "assignments_user_id_idx" ON "assignments" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "assignments_due_date_idx" ON "assignments" USING btree ("due_date");--> statement-breakpoint
CREATE INDEX "courses_user_id_idx" ON "courses" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "courses_workspace_id_idx" ON "courses" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "daily_logs_user_id_idx" ON "daily_logs" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "daily_logs_user_id_log_date_idx" ON "daily_logs" USING btree ("user_id","log_date");--> statement-breakpoint
CREATE INDEX "inbox_items_user_id_idx" ON "inbox_items" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "notes_user_id_idx" ON "notes" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "notes_parent_idx" ON "notes" USING btree ("parent_type","parent_id");--> statement-breakpoint
CREATE INDEX "projects_user_id_idx" ON "projects" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "projects_workspace_id_idx" ON "projects" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "resources_user_id_idx" ON "resources" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "resources_parent_idx" ON "resources" USING btree ("parent_type","parent_id");--> statement-breakpoint
CREATE INDEX "taggings_parent_idx" ON "taggings" USING btree ("taggable_type","taggable_id");--> statement-breakpoint
CREATE INDEX "tags_user_id_idx" ON "tags" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "tags_user_id_name_idx" ON "tags" USING btree ("user_id","name");--> statement-breakpoint
CREATE INDEX "tasks_user_id_idx" ON "tasks" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "tasks_due_date_idx" ON "tasks" USING btree ("due_date");--> statement-breakpoint
CREATE INDEX "time_logs_user_id_idx" ON "time_logs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "workspaces_user_id_idx" ON "workspaces" USING btree ("user_id");
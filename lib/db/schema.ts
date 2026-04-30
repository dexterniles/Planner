import {
  pgTable,
  uuid,
  text,
  timestamp,
  integer,
  decimal,
  boolean,
  date,
  jsonb,
  pgEnum,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

// ─── Enums ──────────────────────────────────────────────────────────────────
export const workspaceTypeEnum = pgEnum("workspace_type", [
  "academic",
  "projects",
  "custom",
]);

export const courseStatusEnum = pgEnum("course_status", [
  "active",
  "completed",
  "dropped",
  "planned",
]);

export const assignmentStatusEnum = pgEnum("assignment_status", [
  "not_started",
  "in_progress",
  "submitted",
  "graded",
]);

export const projectStatusEnum = pgEnum("project_status", [
  "planning",
  "active",
  "paused",
  "done",
]);

export const priorityEnum = pgEnum("priority", [
  "low",
  "medium",
  "high",
  "urgent",
]);

export const taskStatusEnum = pgEnum("task_status", [
  "not_started",
  "in_progress",
  "done",
  "cancelled",
]);

export const noteParentTypeEnum = pgEnum("note_parent_type", [
  "course",
  "project",
  "assignment",
  "task",
  "session",
  "daily_log",
  "standalone",
  "event",
]);

export const resourceParentTypeEnum = pgEnum("resource_parent_type", [
  "course",
  "project",
  "assignment",
  "task",
]);

export const resourceTypeEnum = pgEnum("resource_type", [
  "link",
  "file",
  "book_reference",
]);

// Retained as a Postgres type for backward compatibility with prior migrations
// that referenced `recurrence_owner_type`. No column uses this enum anymore.
export const recurrenceOwnerTypeEnum = pgEnum("recurrence_owner_type", [
  "assignment",
  "task",
  "event",
  "bill",
]);

export const billStatusEnum = pgEnum("bill_status", [
  "unpaid",
  "paid",
  "skipped",
]);

export const payFrequencyEnum = pgEnum("pay_frequency", [
  "weekly",
  "biweekly",
  "monthly",
]);

export const eventStatusEnum = pgEnum("event_status", [
  "confirmed",
  "tentative",
  "cancelled",
  "completed",
]);

export const recurrenceFrequencyEnum = pgEnum("recurrence_frequency", [
  "daily",
  "weekly",
  "biweekly",
  "monthly",
  "custom",
]);

export const mediaTypeEnum = pgEnum("media_type", ["movie", "tv"]);

export const mediaStatusEnum = pgEnum("media_status", [
  "watchlist",
  "watching",
  "watched",
]);

export const timeLogParentTypeEnum = pgEnum("time_log_parent_type", [
  "course",
  "project",
  "assignment",
  "task",
]);

// ─── Helper: common timestamp columns ───────────────────────────────────────
const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull()
    .$onUpdate(() => new Date()),
};

// ─── Tables ─────────────────────────────────────────────────────────────────

export const workspaces = pgTable(
  "workspaces",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").notNull(),
    name: text("name").notNull(),
    type: workspaceTypeEnum("type").notNull(),
    color: text("color"),
    icon: text("icon"),
    sortOrder: integer("sort_order").default(0).notNull(),
    ...timestamps,
  },
  (table) => [index("workspaces_user_id_idx").on(table.userId)],
);

export const courses = pgTable(
  "courses",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id")
      .references(() => workspaces.id, { onDelete: "cascade" })
      .notNull(),
    userId: uuid("user_id").notNull(),
    name: text("name").notNull(),
    code: text("code"),
    instructor: text("instructor"),
    semester: text("semester"),
    credits: integer("credits"),
    meetingSchedule: jsonb("meeting_schedule"),
    syllabusFilePath: text("syllabus_file_path"),
    syllabusName: text("syllabus_name"),
    syllabusUploadedAt: timestamp("syllabus_uploaded_at", {
      withTimezone: true,
    }),
    color: text("color"),
    status: courseStatusEnum("status").default("active").notNull(),
    startDate: date("start_date"),
    endDate: date("end_date"),
    ...timestamps,
  },
  (table) => [
    index("courses_user_id_idx").on(table.userId),
    index("courses_workspace_id_idx").on(table.workspaceId),
  ],
);

export const gradeCategories = pgTable(
  "grade_categories",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    courseId: uuid("course_id")
      .references(() => courses.id, { onDelete: "cascade" })
      .notNull(),
    name: text("name").notNull(),
    weight: decimal("weight", { precision: 5, scale: 2 }).notNull(),
    dropLowestN: integer("drop_lowest_n").default(0).notNull(),
  },
  (table) => [index("grade_categories_course_id_idx").on(table.courseId)],
);

export const recurrenceRules = pgTable("recurrence_rules", {
  id: uuid("id").defaultRandom().primaryKey(),
  frequency: recurrenceFrequencyEnum("frequency").notNull(),
  interval: integer("interval").default(1).notNull(),
  daysOfWeek: integer("days_of_week").array(),
  endDate: date("end_date"),
  count: integer("count"),
  ...timestamps,
});

export const assignments = pgTable(
  "assignments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    courseId: uuid("course_id")
      .references(() => courses.id, { onDelete: "cascade" })
      .notNull(),
    userId: uuid("user_id").notNull(),
    title: text("title").notNull(),
    description: text("description"),
    dueDate: timestamp("due_date", { withTimezone: true }),
    categoryId: uuid("category_id").references(() => gradeCategories.id, {
      onDelete: "set null",
    }),
    status: assignmentStatusEnum("status").default("not_started").notNull(),
    pointsEarned: decimal("points_earned", { precision: 7, scale: 2 }),
    pointsPossible: decimal("points_possible", { precision: 7, scale: 2 }),
    notes: text("notes"),
    recurrenceRuleId: uuid("recurrence_rule_id").references(
      () => recurrenceRules.id,
      { onDelete: "set null" },
    ),
    ...timestamps,
  },
  (table) => [
    index("assignments_user_id_idx").on(table.userId),
    index("assignments_due_date_idx").on(table.dueDate),
    index("assignments_course_id_idx").on(table.courseId),
  ],
);

export const projects = pgTable(
  "projects",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workspaceId: uuid("workspace_id")
      .references(() => workspaces.id, { onDelete: "cascade" })
      .notNull(),
    userId: uuid("user_id").notNull(),
    name: text("name").notNull(),
    description: text("description"),
    goal: text("goal"),
    status: projectStatusEnum("status").default("planning").notNull(),
    priority: priorityEnum("priority").default("medium").notNull(),
    startDate: date("start_date"),
    targetDate: date("target_date"),
    color: text("color"),
    ...timestamps,
  },
  (table) => [
    index("projects_user_id_idx").on(table.userId),
    index("projects_workspace_id_idx").on(table.workspaceId),
  ],
);

export const tasks = pgTable(
  "tasks",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    projectId: uuid("project_id")
      .references(() => projects.id, { onDelete: "cascade" })
      .notNull(),
    userId: uuid("user_id").notNull(),
    title: text("title").notNull(),
    description: text("description"),
    dueDate: timestamp("due_date", { withTimezone: true }),
    status: taskStatusEnum("status").default("not_started").notNull(),
    priority: priorityEnum("priority").default("medium").notNull(),
    parentTaskId: uuid("parent_task_id"),
    notes: text("notes"),
    recurrenceRuleId: uuid("recurrence_rule_id").references(
      () => recurrenceRules.id,
      { onDelete: "set null" },
    ),
    ...timestamps,
  },
  (table) => [
    index("tasks_user_id_idx").on(table.userId),
    index("tasks_due_date_idx").on(table.dueDate),
    index("tasks_project_id_idx").on(table.projectId),
  ],
);

export const milestones = pgTable(
  "milestones",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    projectId: uuid("project_id")
      .references(() => projects.id, { onDelete: "cascade" })
      .notNull(),
    title: text("title").notNull(),
    description: text("description"),
    targetDate: date("target_date"),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    ...timestamps,
  },
  (table) => [index("milestones_project_id_idx").on(table.projectId)],
);

export const eventCategories = pgTable(
  "event_categories",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").notNull(),
    name: text("name").notNull(),
    color: text("color"),
    sortOrder: integer("sort_order").default(0).notNull(),
    ...timestamps,
  },
  (table) => [
    index("event_categories_user_id_idx").on(table.userId),
    uniqueIndex("event_categories_user_id_name_idx").on(
      table.userId,
      table.name,
    ),
  ],
);

export const events = pgTable(
  "events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").notNull(),
    title: text("title").notNull(),
    description: text("description"),
    categoryId: uuid("category_id").references(() => eventCategories.id, {
      onDelete: "set null",
    }),
    startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
    endsAt: timestamp("ends_at", { withTimezone: true }),
    allDay: boolean("all_day").default(false).notNull(),
    location: text("location"),
    url: text("url"),
    attendees: text("attendees"),
    status: eventStatusEnum("status").default("confirmed").notNull(),
    color: text("color"),
    recurrenceRuleId: uuid("recurrence_rule_id").references(
      () => recurrenceRules.id,
      { onDelete: "set null" },
    ),
    ...timestamps,
  },
  (table) => [
    index("events_user_id_idx").on(table.userId),
    index("events_starts_at_idx").on(table.startsAt),
    index("events_category_id_idx").on(table.categoryId),
    index("events_status_idx").on(table.status),
  ],
);

export const billCategories = pgTable(
  "bill_categories",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").notNull(),
    name: text("name").notNull(),
    color: text("color"),
    sortOrder: integer("sort_order").default(0).notNull(),
    ...timestamps,
  },
  (table) => [
    index("bill_categories_user_id_idx").on(table.userId),
    uniqueIndex("bill_categories_user_id_name_idx").on(
      table.userId,
      table.name,
    ),
  ],
);

export const bills = pgTable(
  "bills",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").notNull(),
    name: text("name").notNull(),
    description: text("description"),
    amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
    categoryId: uuid("category_id").references(() => billCategories.id, {
      onDelete: "set null",
    }),
    dueDate: date("due_date").notNull(),
    status: billStatusEnum("status").default("unpaid").notNull(),
    paidAt: timestamp("paid_at", { withTimezone: true }),
    paidAmount: decimal("paid_amount", { precision: 10, scale: 2 }),
    notes: text("notes"),
    color: text("color"),
    recurrenceRuleId: uuid("recurrence_rule_id").references(
      () => recurrenceRules.id,
      { onDelete: "set null" },
    ),
    ...timestamps,
  },
  (table) => [
    index("bills_user_id_idx").on(table.userId),
    index("bills_due_date_idx").on(table.dueDate),
    index("bills_status_idx").on(table.status),
    index("bills_category_id_idx").on(table.categoryId),
    index("bills_user_status_due_idx").on(
      table.userId,
      table.status,
      table.dueDate,
    ),
  ],
);

export const paySchedule = pgTable(
  "pay_schedule",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").notNull(),
    frequency: payFrequencyEnum("frequency").notNull(),
    referenceDate: date("reference_date").notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("pay_schedule_user_id_idx").on(table.userId),
  ],
);

export const notes = pgTable(
  "notes",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").notNull(),
    parentType: noteParentTypeEnum("parent_type").notNull(),
    parentId: uuid("parent_id"),
    title: text("title"),
    content: text("content"),
    sessionDate: date("session_date"),
    ...timestamps,
  },
  (table) => [
    index("notes_user_id_idx").on(table.userId),
    index("notes_parent_idx").on(table.parentType, table.parentId),
  ],
);

export const resources = pgTable(
  "resources",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").notNull(),
    parentType: resourceParentTypeEnum("parent_type").notNull(),
    parentId: uuid("parent_id").notNull(),
    type: resourceTypeEnum("type").notNull(),
    title: text("title").notNull(),
    url: text("url"),
    filePath: text("file_path"),
    metadata: jsonb("metadata"),
    ...timestamps,
  },
  (table) => [
    index("resources_user_id_idx").on(table.userId),
    index("resources_parent_idx").on(table.parentType, table.parentId),
  ],
);

export const tags = pgTable(
  "tags",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").notNull(),
    name: text("name").notNull(),
    color: text("color"),
    ...timestamps,
  },
  (table) => [
    index("tags_user_id_idx").on(table.userId),
    uniqueIndex("tags_user_id_name_idx").on(table.userId, table.name),
  ],
);

export const taggings = pgTable(
  "taggings",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    tagId: uuid("tag_id")
      .references(() => tags.id, { onDelete: "cascade" })
      .notNull(),
    taggableType: text("taggable_type").notNull(),
    taggableId: uuid("taggable_id").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("taggings_parent_idx").on(table.taggableType, table.taggableId),
    index("taggings_tag_id_idx").on(table.tagId),
  ],
);


export const inboxItems = pgTable(
  "inbox_items",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").notNull(),
    content: text("content").notNull(),
    capturedAt: timestamp("captured_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    triagedAt: timestamp("triaged_at", { withTimezone: true }),
    resultingItemType: text("resulting_item_type"),
    resultingItemId: uuid("resulting_item_id"),
  },
  (table) => [index("inbox_items_user_id_idx").on(table.userId)],
);

export const timeLogs = pgTable(
  "time_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").notNull(),
    loggableType: timeLogParentTypeEnum("loggable_type").notNull(),
    loggableId: uuid("loggable_id").notNull(),
    startedAt: timestamp("started_at", { withTimezone: true }).notNull(),
    endedAt: timestamp("ended_at", { withTimezone: true }),
    durationSeconds: integer("duration_seconds"),
    wasPomodoro: boolean("was_pomodoro").default(false).notNull(),
    pomodoroIntervalMinutes: integer("pomodoro_interval_minutes"),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("time_logs_user_id_idx").on(table.userId),
    index("time_logs_loggable_idx").on(table.loggableType, table.loggableId),
    index("time_logs_active_idx")
      .on(table.userId, table.endedAt)
      .where(sql`ended_at IS NULL`),
  ],
);

export type MediaMetadata = {
  director?: string | null;
  createdBy?: string[] | null;
  composer?: string | null;
  cast?: Array<{ name: string; character: string; profilePath: string | null }>;
  tagline?: string | null;
  episodeCount?: number | null;
  originalLanguage?: string | null;
};

export const mediaItems = pgTable(
  "media_items",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").notNull(),
    mediaType: mediaTypeEnum("media_type").notNull(),
    tmdbId: integer("tmdb_id").notNull(),
    imdbId: text("imdb_id"),
    title: text("title").notNull(),
    posterPath: text("poster_path"),
    backdropPath: text("backdrop_path"),
    overview: text("overview"),
    releaseYear: integer("release_year"),
    runtime: integer("runtime"),
    genres: jsonb("genres"),
    status: mediaStatusEnum("status").default("watchlist").notNull(),
    rating: decimal("rating", { precision: 2, scale: 1 }),
    watchedAt: timestamp("watched_at", { withTimezone: true }),
    notes: text("notes"),
    metadata: jsonb("metadata").$type<MediaMetadata>(),
    ...timestamps,
  },
  (table) => [
    index("media_items_user_id_idx").on(table.userId),
    uniqueIndex("media_items_user_media_unique").on(
      table.userId,
      table.mediaType,
      table.tmdbId,
    ),
    index("media_items_user_created_idx").on(table.userId, table.createdAt),
  ],
);

export const recipes = pgTable(
  "recipes",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").notNull(),
    title: text("title").notNull(),
    description: text("description"),
    prepTimeMinutes: integer("prep_time_minutes"),
    cookTimeMinutes: integer("cook_time_minutes"),
    portions: integer("portions").default(1).notNull(),
    notes: text("notes"),
    sourceUrl: text("source_url"),
    ...timestamps,
  },
  (table) => [index("recipes_user_id_idx").on(table.userId)],
);

export const recipeIngredients = pgTable(
  "recipe_ingredients",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    recipeId: uuid("recipe_id")
      .references(() => recipes.id, { onDelete: "cascade" })
      .notNull(),
    sortOrder: integer("sort_order").default(0).notNull(),
    quantity: decimal("quantity", { precision: 10, scale: 3 }),
    unit: text("unit"),
    name: text("name").notNull(),
    ...timestamps,
  },
  (table) => [index("recipe_ingredients_recipe_id_idx").on(table.recipeId)],
);

export const recipeSteps = pgTable(
  "recipe_steps",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    recipeId: uuid("recipe_id")
      .references(() => recipes.id, { onDelete: "cascade" })
      .notNull(),
    sortOrder: integer("sort_order").default(0).notNull(),
    body: text("body").notNull(),
    durationMinutes: integer("duration_minutes"),
    ...timestamps,
  },
  (table) => [index("recipe_steps_recipe_id_idx").on(table.recipeId)],
);

export const recipeEquipment = pgTable(
  "recipe_equipment",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    recipeId: uuid("recipe_id")
      .references(() => recipes.id, { onDelete: "cascade" })
      .notNull(),
    sortOrder: integer("sort_order").default(0).notNull(),
    name: text("name").notNull(),
    ...timestamps,
  },
  (table) => [index("recipe_equipment_recipe_id_idx").on(table.recipeId)],
);

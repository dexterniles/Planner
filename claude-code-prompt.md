# Claude Code Prompt: Personal Course & Project Tracker

Paste the block below into Claude Code when you're sitting in an empty repo directory.

---

## The Prompt

You are helping me build a personal, single-user webapp called **TrackHub** (working title — feel free to suggest better). This is a unified hub for tracking academic coursework AND side projects in one place, deployed to the cloud so I can access it from my phone. This conversation will cover **Phase 1: Foundation** only. Do not attempt to build later phases unless I explicitly ask.

Before you start writing code, read this entire prompt carefully, ask me any clarifying questions you have, and confirm your plan. Do not start scaffolding until I say "go."

---

### Context: What I've Already Set Up

I will have already done the following before running you:
- Created an empty GitHub repo and cloned it locally (you are sitting in it now)
- Created a Supabase project and have the project URL, anon key, and service_role key
- Created a Vercel project linked to the GitHub repo
- Have a `.env.local` file ready to populate (or will create one based on your `.env.example`)

**You do NOT need to do any of those setup steps.** Assume they're done. Your job is the code.

---

### The Stack (locked in — do not substitute)

- **Next.js 15** with App Router, TypeScript, strict mode
- **Tailwind CSS** with dark mode (class strategy) from day one
- **shadcn/ui** for components
- **Supabase** for Postgres, Auth, and Storage
- **Drizzle ORM** for type-safe database queries (NOT Prisma)
- **react-hook-form + Zod** for forms and validation
- **TanStack Query** for client-side data fetching/mutations
- **Deployed to Vercel** (Hobby tier)

### What I Want Phase 1 to Accomplish

By the end of Phase 1, I should be able to:
1. Push to GitHub and have Vercel auto-deploy successfully
2. Visit my deployed URL and see a landing page
3. Sign up / log in via Supabase Auth (email + password)
4. See a logged-in shell with a sidebar, a top bar, and placeholder pages for the main sections
5. Toggle light/dark mode and have it persist
6. Run Drizzle migrations that create the FULL schema (not stubs) including tables whose UIs come in later phases
7. Have a seeded demo row or two so I can confirm the database is wired up end-to-end

**Phase 1 is NOT building course tracking, project tracking, the calendar, or any of the real features.** It is getting the scaffolding right so later phases are smooth. Resist scope creep.

---

### The Full Schema (implement ALL of this in Phase 1)

Even though the UIs for most of these come in later phases, I want the schema complete now so we don't do painful migrations later. Implement these as Drizzle schema definitions and generate/run migrations.

**Core tables:**

- `workspaces` — id, user_id, name, type (`'academic' | 'projects' | 'custom'`), color, icon, sort_order, timestamps
- `courses` — id, workspace_id, user_id, name, code, instructor, semester, credits, meeting_schedule (jsonb), syllabus_file_path, color, status, timestamps
- `grade_categories` — id, course_id, name, weight (decimal), drop_lowest_n (int default 0)
- `assignments` — id, course_id, user_id, title, description, due_date, category_id (FK to grade_categories), status (enum: `not_started | in_progress | submitted | graded`), points_earned (decimal nullable), points_possible (decimal), notes (markdown text), timestamps
- `projects` — id, workspace_id, user_id, name, description, goal, status (enum: `planning | active | paused | done`), priority (enum: `low | medium | high | urgent`), start_date, target_date, color, timestamps
- `tasks` — id, project_id, user_id, title, description, due_date, status (enum: `not_started | in_progress | done | cancelled`), priority (same enum), parent_task_id (self-FK nullable for subtasks), notes, timestamps
- `milestones` — id, project_id, title, description, target_date, completed_at (nullable), timestamps

**Cross-cutting tables (polymorphic via parent_type + parent_id):**

- `notes` — id, user_id, parent_type (enum: `course | project | assignment | task | session | daily_log | standalone`), parent_id (uuid nullable), title, content (markdown), session_date (nullable — for notes attached to a specific class session), timestamps
- `resources` — id, user_id, parent_type (enum: `course | project | assignment | task`), parent_id, type (enum: `link | file | book_reference`), title, url (nullable), file_path (nullable), metadata (jsonb — for page numbers, chapters, etc.), timestamps
- `tags` — id, user_id, name (unique per user), color, timestamps
- `taggings` — id, tag_id, taggable_type, taggable_id, created_at (many-to-many join)
- `daily_logs` — id, user_id, log_date (date, unique per user per date), content (markdown), mood (nullable short text), timestamps
- `inbox_items` — id, user_id, content (text), captured_at, triaged_at (nullable), resulting_item_type (nullable), resulting_item_id (nullable)

**Recurrence (baked in from day one):**

- `recurrence_rules` — id, owner_type (enum: `assignment | task`), owner_id, frequency (enum: `daily | weekly | biweekly | monthly | custom`), interval (int, default 1), days_of_week (int array nullable for weekly), end_date (nullable), count (nullable), timestamps
- Assignments and tasks get a nullable `recurrence_rule_id` FK

**Time tracking (schema now, UI later):**

- `time_logs` — id, user_id, loggable_type (enum: `course | project | assignment | task`), loggable_id, started_at, ended_at (nullable if in progress), duration_seconds (computed or stored), was_pomodoro (boolean), pomodoro_interval_minutes (nullable), notes (nullable), created_at

**Unified calendar view (SQL view, not a table):**

Create a Postgres view called `calendar_items` that UNIONs assignments, tasks, and milestones into a common shape: `(source_type, source_id, user_id, workspace_id, title, due_date, status, color)`. This is what the calendar page will query later.

**RLS policies:**

Every user-owned table gets a Row Level Security policy: `user_id = auth.uid()` for SELECT/INSERT/UPDATE/DELETE. For tables that don't have `user_id` directly (like `grade_categories`, `taggings`), write the policy to check via the parent's user_id.

**Indexes:**

Add sensible indexes:
- `user_id` on every user-owned table
- `due_date` on assignments and tasks
- `workspace_id` on courses and projects
- `(parent_type, parent_id)` on notes, resources, taggings
- Unique index on `(user_id, log_date)` for daily_logs
- Unique index on `(user_id, name)` for tags

---

### Project Structure I Want

```
/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── signup/page.tsx
│   ├── (app)/                    ← authenticated routes
│   │   ├── layout.tsx            ← sidebar + topbar shell
│   │   ├── page.tsx              ← Today dashboard (placeholder for Phase 1)
│   │   ├── calendar/page.tsx     ← placeholder
│   │   ├── items/page.tsx        ← placeholder
│   │   ├── academic/page.tsx     ← placeholder
│   │   ├── projects/page.tsx     ← placeholder
│   │   ├── daily-log/page.tsx    ← placeholder
│   │   └── settings/page.tsx     ← placeholder
│   ├── layout.tsx                ← root layout, theme provider
│   ├── page.tsx                  ← public landing page
│   └── api/
│       └── health/route.ts       ← simple DB ping endpoint for verification
├── components/
│   ├── ui/                       ← shadcn components
│   ├── layout/
│   │   ├── sidebar.tsx
│   │   ├── topbar.tsx
│   │   └── theme-toggle.tsx
│   └── providers.tsx             ← TanStack Query + theme
├── lib/
│   ├── db/
│   │   ├── schema.ts             ← Drizzle schema (the whole thing)
│   │   ├── index.ts              ← db client
│   │   └── migrations/           ← generated
│   ├── supabase/
│   │   ├── client.ts             ← browser client
│   │   ├── server.ts             ← server client
│   │   └── middleware.ts         ← session refresh
│   └── utils.ts
├── middleware.ts                 ← auth middleware (protects /app routes)
├── drizzle.config.ts
├── tailwind.config.ts
├── .env.example
├── README.md
└── package.json
```

---

### Specific Implementation Requirements

**Auth flow:**
- Middleware redirects unauthenticated users from `(app)/*` routes to `/login`
- Middleware redirects authenticated users from `/login` and `/signup` to `/` (the dashboard)
- Use `@supabase/ssr` (NOT the deprecated `auth-helpers` packages)
- On signup, send a confirmation email (Supabase handles this) but also let me toggle to auto-confirm in dev
- Sign out button in the topbar

**Dark mode:**
- Use `next-themes`
- Default to system preference
- Toggle in topbar
- Tailwind's `dark:` variant used consistently in all components

**Sidebar:**
- Lists: Dashboard, Calendar, All Items, Academic, Projects, Daily Log, Settings
- Shows the current user's email at the bottom with a sign-out button
- Collapsible on mobile (sheet/drawer style)

**Landing page (`/`):**
- Simple public page explaining what TrackHub is (one screen, no scroll on desktop)
- "Log in" and "Sign up" buttons
- Dark/light aware

**Health check endpoint (`/api/health`):**
- Runs a trivial Drizzle query (e.g., `SELECT 1`) to confirm DB connectivity
- Returns `{ status: 'ok', db: 'connected' }` or the error
- I'll use this to verify deployment is wired up

**Seed script:**
- Include a `scripts/seed.ts` that, when run, creates one "Academic" workspace and one "Projects" workspace for the currently-logged-in user (or take user_id as a CLI arg)
- Document how to run it in the README

**`.env.example` must include:**
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
DATABASE_URL=
```
(The `DATABASE_URL` is for Drizzle — use Supabase's connection pooler URL for serverless compatibility on Vercel.)

**README must cover:**
1. What the app is
2. Prerequisites (Node version, Supabase account, Vercel account)
3. Local setup steps in order
4. How to get the env vars from Supabase dashboard
5. How to run Drizzle migrations against Supabase
6. How to run the seed script
7. How to deploy to Vercel (env vars to add there)
8. Project structure overview
9. Phase roadmap (just list the phases from my plan)

---

### Decisions You Should Make Autonomously

Don't ask me about these — pick sensibly and note the choice in the README:
- Exact Next.js minor version, TypeScript version, etc.
- Specific shadcn components to install up front (install the ones you'll actually use in Phase 1: button, input, label, card, dropdown-menu, sheet, avatar, separator, sonner for toasts)
- File naming conventions (kebab-case files, PascalCase for component exports)
- Whether to use Drizzle Kit's `push` or `generate` + `migrate` workflow (prefer `generate` + `migrate` for reproducibility)
- Color palette for workspaces (a reasonable default set of ~8 colors)
- ESLint + Prettier config

### Things You Should Ask Me About

- The app name if you have a strong suggestion over "TrackHub"
- Whether I want Supabase's magic link auth in addition to email+password (I'm leaning "just password for now" but open)
- Anything genuinely ambiguous in this spec

### Things You Should Explicitly NOT Do in Phase 1

- Don't build any CRUD UI for courses, projects, assignments, tasks, etc.
- Don't build the calendar
- Don't build the grade calculator
- Don't build the search palette
- Don't build the Pomodoro timer
- Don't build the quick capture inbox
- Don't install FullCalendar, dnd-kit, or other later-phase dependencies — they bloat the bundle and we'll add them when needed
- Don't add AI / LLM features

---

### How to Work

1. First, read this whole prompt and tell me:
   - Your understanding of the goal
   - Any clarifying questions
   - Your planned order of operations (high level — e.g., "1. init Next.js, 2. Tailwind + shadcn, 3. Drizzle + schema, 4. Supabase auth, 5. layout shell, 6. health check, 7. seed, 8. README")
2. Wait for me to say "go."
3. Then work through the plan. Commit logically-grouped work as you go with clear commit messages.
4. When you hit a decision that's genuinely ambiguous, stop and ask rather than guess.
5. When done, give me a checklist of what I need to do on my side (add env vars to Vercel, run migration command, etc.) to get it fully deployed.

Ready when you are. Read the prompt, ask questions, then wait for "go."

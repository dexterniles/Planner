# Planner

A personal, single-user webapp for tracking academic coursework and side projects in one place.

## Prerequisites

- **Node.js 22 LTS** (recommended via [nvm](https://github.com/nvm-sh/nvm))
- **Supabase** account with a project created ([supabase.com](https://supabase.com))
- **Vercel** account (for deployment, optional for local dev)

## Local Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Copy the example env file and fill in your values:

```bash
cp .env.example .env.local
```

**Where to find these values in the Supabase dashboard:**

| Variable | Location |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Settings → API → Project API keys → `anon` `public` |
| `SUPABASE_SERVICE_ROLE_KEY` | Settings → API → Project API keys → `service_role` (keep secret) |
| `DATABASE_URL` | Settings → Database → Connection string → URI (use the "Transaction" pooler for Vercel/serverless) |

### 3. Run database migrations

Generate and run migrations against your Supabase database:

```bash
npm run db:generate
npm run db:migrate
```

### 4. Seed the database

Creates starter "Academic" and "Projects" workspaces. Requires `SEED_USER_ID` (the Supabase auth UUID to seed for) in env:

```bash
SEED_USER_ID=<your-auth-uuid> npm run db:seed
```

### 5. Start the dev server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000).

### 6. Verify database connectivity

```bash
curl http://localhost:3000/api/health
# Should return: {"status":"ok","db":"connected"}
```

## Deploy to Vercel

1. Push your repo to GitHub
2. Import the repo in Vercel
3. Add the four environment variables from `.env.example` to Vercel's project settings
4. Deploy — Vercel auto-builds on push

## Project Structure

```
app/
  (app)/              ← Main app layout with sidebar + topbar
    page.tsx           ← Dashboard
    calendar/          ← Unified calendar
    academic/          ← Courses, assignments, grades
    projects/          ← Projects, tasks, milestones
    events/            ← Life events (dinners, concerts, etc.)
    daily-log/         ← Journal with mood tracking
    settings/          ← Tags + data export
  api/health/          ← DB connectivity check
  layout.tsx           ← Root layout with providers
components/
  layout/              ← Sidebar, topbar, theme toggle
  providers.tsx        ← TanStack Query + next-themes
  ui/                  ← shadcn/ui components
lib/
  db/
    schema.ts          ← Full Drizzle schema (all tables)
    index.ts           ← DB client
    migrations/        ← Generated Drizzle migrations
  supabase/
    client.ts          ← Supabase browser client
  utils.ts             ← Utility functions (cn helper)
scripts/
  seed.ts              ← Database seed script
```

## Tech Stack

- **Next.js 15** (App Router, TypeScript, strict mode)
- **Tailwind CSS v4** with dark mode (class strategy)
- **shadcn/ui** component library
- **Supabase** (Postgres database)
- **Drizzle ORM** (type-safe queries, generate + migrate workflow)
- **TanStack Query** (client-side data fetching)
- **react-hook-form + Zod** (forms and validation)
- **next-themes** (dark/light/system theme)

## Phase Roadmap

- **Phase 1: Foundation** — current
  - Project scaffolding, full DB schema, layout shell, dark mode, deploy pipeline
- **Phase 2: Academic Tracking**
  - Course CRUD, assignment management, grade calculator
- **Phase 3: Project Tracking**
  - Project CRUD, task management, milestones
- **Phase 4: Cross-cutting Features**
  - Calendar view, daily log, notes, resources, tags, inbox
- **Phase 5: Productivity**
  - Time tracking, Pomodoro timer, search palette
- **Phase 6: Polish**
  - Mobile optimization, data export, recurring items

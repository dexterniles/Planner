# Planner — codebase audit (2026-04-26)

Three parallel read-only audits. No code changed; this is a punch list to work through over time.

**Tags:** `[FE]` frontend/React · `[BE]` backend/data layer · `[PERF]` performance/Next 16 · `[BEHAVIORAL]` requires sign-off because it changes observable behavior.

---

## Progress (updated 2026-04-27)

- ✅ **Headline #1** — auth alignment shipped. Auth stack kept; AGENTS.md updated; double JWT verification eliminated; tenant isolation closed; data migrated to real auth UUID.
- ✅ **Headline #7** — three identical 628 KB PNGs resized to 64/180/256 px. Saved ~1.79 MB.
- ✅ **B11** — tenant-isolation gap on `?parentId=…` endpoints (closed via auth alignment).
- ✅ **B14** — three identical 628 KB PNGs (same as headline #7).
- ✅ **B16** — auth double-verification (closed via auth alignment).
- ✅ **N1** — `lib/auth/remember-me.ts` deleted (plus `session-watcher.tsx` and the remember-me UI in login).
- ✅ **N2** — narrating "Defense-in-depth" docstrings trimmed in `lib/auth/*` (other files still pending).
- ✅ **N3** — defensive `if (__guard) return __guard;` pattern gone (replaced by Pattern A return shape).
- ➕ **Bonus** — `middleware.ts` → `proxy.ts` rename (Next 16 deprecation), `/api/health` correctly excluded from auth matcher.
- ✅ **Headline #3** — queryKey thrash fix shipped. Hook-side: flattened filter objects into primitive queryKey slots in `use-events.ts`, `use-bills.ts`, `use-recipes.ts`. No consumer changes; mutation invalidation still prefix-matches.
- ✅ **B1** — object-literal queryKey thrash (closed via headline #3).
- ✅ **Headline #4** — `useActiveTimer` polling shipped. `refetchInterval: 1000` removed; cross-tab sync via `refetchOnWindowFocus` default + mutation invalidation. Saves ~60 req/min/tab.
- ✅ **B2** — pomodoro auto-stop double-fire (closed alongside #4). `firedRef` guarantees single fire per session; local interval clears at 0 so no further ticks.
- ✅ **Headline #5** — `/api/search` and `/api/recipes` SQL filtering shipped. JS-side `.includes()` filters replaced with Postgres `ilike`; `escapeLike` helper added; per-type `.limit(5)` on search; recipes `tagId` uses correlated `EXISTS` subquery.
- ✅ **B6 / B7** — `/api/search` and `/api/recipes` JS-side full-table scans (closed via headline #5).
- ✅ **Headline #6** — TMDB image optimization shipped. `unoptimized` removed from all 4 sites; `images.minimumCacheTTL` bumped to 30 days for immutable TMDB poster URLs.
- ✅ **B15** — `unoptimized` on every TMDB image (closed via headline #6).
- ✅ **C** — drop `unoptimized` on TMDB images (behavioral, confirmed).
- ✅ **Backlog batch 1** — N7 (utility lift to `lib/utils.ts`/`lib/grades.ts`/`lib/format.ts`), N8 (cargo-cult `useMemo`), N11 (dead SQL view + `scripts/create-view.ts`), N12 (5 unused SVGs), N13 (TS target ES2022), N14 (`NEXT_PUBLIC_APP_VERSION` env), S22 (409 on already-stopped timer).
- ✅ **Backlog batch 2** — clock-drift cluster closed via shared `useCurrentDate(intervalMs)` hook in `lib/hooks/use-current-date.ts`. Wired into `bills-this-period.tsx` (B3), `events/page.tsx` (S2), `week-view.tsx` + `month-view.tsx` (S3), `notes-list.tsx` (N10), and `day-view.tsx` (`NowIndicator` line + `isSameDay` check, caught by reviewer).
- ✅ **Backlog batch 3** — form-seed-from-server cluster closed. B4: `handleRefresh` busts `initialNotesRef` so refresh metadata re-seeds notes. S5: pay-schedule effect converted to seed-once with explicit reset in `handleRemove`. Bonus: lint count dropped 13 → 12 (one `set-state-in-effect` resolved naturally).
- ✅ **Backlog batch 4** — backend correctness pass shipped. B8 (grades 2N+1 → 3 queries via inArray), B9 (`/api/all-items` Promise.all), B12 (inbox PATCH Zod-validated via new `lib/validations/inbox.ts`), S11 (calendar milestone SQL date filter), S16 (5 parallel COUNTs collapsed to one `db.execute`), S18 (regex+NaN+range guards on month/year/day, status filter casts replaced with `z.enum().safeParse()`), S20 (date-string validators tightened with empty-string allowance for optional fields per regression caught by reviewer), S21 (bills bulk-recurrence wrapped in transaction). Plus S18b day-rollover fix using round-trip date check.
- ✅ **Backlog batch 10** — code-quality nits. N2 (narrating comments trimmed in `lib/auto-complete-events.ts`, `lib/auth/require-auth.ts`, `app/api/auth/logout/route.ts`), N4 (month-view dot row uses stable `${sourceType}-${sourceId}` key). N6 deferred per audit (documented false positives).
- ✅ **Backlog batch 6** — a11y / UX polish. S6 (notes save bails on `updateMedia.isPending` to prevent rapid-blur race), S8 (`ConfirmProvider` captures `document.activeElement` on open and restores via `requestAnimationFrame` after close), S9 (`RatingStars` left-half buttons get `tabIndex={-1}` — keyboard tab stops 10 → 5), N5 (`RecipeDialog` wired to `zodResolver` via string-mirror `recipeFormSchema`).
- ✅ **Backlog batch 5+9 combined** — TanStack mutation pass shipped. S23: `QueryClient` defaults set to `staleTime: 30_000` and `refetchOnWindowFocus: false` (behavioral E confirmed). S17: dashboard invalidation gaps closed across bills/time-logs/assignments mutations; recurrence-rule mutations now invalidate events/bills too. S7: optimistic updates with `onMutate`/`onError` rollback added to `useUpdateBill`, `useUpdateAssignment`, `useUpdateMilestone`, `useUpdateTask`, `useUpdateMedia`. Decimal-as-string coercion fix applied post-review for `amount`/`paidAmount` (bills) and `pointsEarned`/`pointsPossible` (assignments) so optimistic shape matches Drizzle's decimal-string cache shape.
- ✅ **Backlog batch 7** — bundle/perf shipped. S25: chrono-node import switched to `chrono-node/en` (locale-only) — chrono chunk dropped ~109 KB raw (~62%). S26: `EB_Garamond` config trimmed from 6 font files to 2 (`weight: ["400", "500"]`, no italic) — confirmed via grep that no `font-serif` is paired with `font-semibold`/`bold`/`italic` anywhere. S27: `experimental.optimizePackageImports: ["@base-ui/react"]` added to `next.config.ts`. S28: `PageTransition` no longer remounts on navigation — class-restart pattern via `useRef`/`useEffect` with `void el.offsetWidth` reflow.
- ✅ **Backlog batch 8** — schema & migrations shipped. S15: 9 indexes added (`assignments_course_id_idx`, `tasks_project_id_idx`, `milestones_project_id_idx`, `time_logs_loggable_idx`, `time_logs_active_idx` partial, `bills_user_status_due_idx`, `media_items_user_created_idx`, `taggings_tag_id_idx`, `grade_categories_course_id_idx`). S14: `recurrenceRules.ownerType`/`ownerId` columns dropped, placeholder UUID writes removed; `recurrenceOwnerTypeEnum` left exported as no-op to avoid drizzle-kit interactive prompts. S10: per-read auto-complete sweeps removed from `/api/courses*` and `/api/events*`; new `/api/cron/auto-complete` route with Bearer auth + fail-closed on missing `CRON_SECRET`; `vercel.json` cron `0 4 * * *`. Migration `0009_drop_recurrence_owner_add_indexes.sql` hand-authored (matching repo precedent for snapshot-drift workaround) and applied to live DB. Behavioral G + I confirmed.
- ✅ **Hotfix** — `/api/dashboard/stats` was throwing in production (`TypeError: Received an instance of Date`). The S16 raw-SQL collapse passed JS Date objects via `${now}`/`${weekStart}`; postgres-js doesn't auto-coerce. Both now `.toISOString()` before binding.
- ✅ **Lint sweep** — 12 warnings → 0. N6 closed: 8 `react-hooks/set-state-in-effect` warnings suppressed with `eslint-disable-next-line ... -- <why>` justifications (localStorage hydration, mirror-state reset, deferred TanStack refactor, etc.), 1 cleaned up (`login/page.tsx` `useEffect`+`setError` → `useState` lazy initializer). Plus mopped up 2 `react-hooks/exhaustive-deps` in `bills/page.tsx` (`allBills` wrapped in `useMemo`) and 1 `@typescript-eslint/no-unused-vars` in `week-view.tsx` (dead `Badge` import).
- ✅ **Headline #2** — server-component refactor shipped across 4 phases. **Phase 0:** infrastructure (`lib/server/auth.ts`, `lib/server/get-query-client.ts`, `lib/server/prefetch.ts`, 21 `lib/server/data/*` modules); 35 GET handlers refactored to call shared helpers. **Phase 1:** dashboard converted; `app/(app)/loading.tsx` added. **Phase 2:** 7 list pages converted (projects, recipes, events, movies, bills, academic, calendar) with the `prefetch()` JSON-roundtrip wrapper retrofitted across Phase 1 too; per-page `loading.tsx` added for movies, recipes, calendar. **Phase 3:** 4 detail pages converted (recipes, movies, projects, academic) using `await params`; `loading.tsx` added for all four detail routes. Post-review fixes: time-logs prefetched on the always-rendered `ProjectSnapshot` and `CourseSnapshot`. Build output: every `(app)/` route is now `ƒ` (dynamic, server-rendered) with first-paint data hydrated from the cache.

**All headline items shipped.** Audit work complete.

---

## Headline — start here

These are the highest-impact items. The behavioral ones need a yes/no before any work begins.

1. ✅ **`requireAuthGuard` + Supabase auth wired into 49 routes despite AGENTS.md saying "no auth, single-user."** [BE][PERF][BEHAVIORAL] Either kill the auth stack (~50 files: `lib/auth/*`, `lib/supabase/{server-auth,middleware}.ts`, `middleware.ts`, `app/login/`, `app/api/auth/logout`, the guard call in 49 routes) or update AGENTS.md to remove the "no auth" claim. Auth is currently double-checked on every request (middleware → route handler), each costing a Supabase JWT verification. Pick a side.
2. ✅ **Authenticated app tree is fully client-rendered.** [PERF][BEHAVIORAL] `app/(app)/layout.tsx` is a Server Component, but every page beneath (`page.tsx`, `projects/page.tsx`, `recipes/page.tsx`, `events/page.tsx`, `movies/page.tsx`, `calendar/page.tsx`) is `"use client"`. Initial paint is "client transition + skeletons + fetch waterfall." Server-rendering the dashboard is the single biggest LCP/INP win available, but it's a real refactor.
3. ✅ **Object-literal queryKey thrash.** [FE] `EventsPage`, `BillsPage`, `RecipesPage` (and `BillsThisPeriod`) construct fresh filter object literals every render, passed as part of the TanStack `queryKey`. Every render is a new key → cache thrash, lost cache hits, observable flicker. Fix: `useMemo` the filter in the consumer. — [app/(app)/events/page.tsx:29](app/\(app\)/events/page.tsx#L29), [app/(app)/bills/page.tsx:49](app/\(app\)/bills/page.tsx#L49), [components/dashboard/bills-this-period.tsx:23](components/dashboard/bills-this-period.tsx#L23), [app/(app)/recipes/page.tsx:26](app/\(app\)/recipes/page.tsx#L26).
4. ✅ **`useActiveTimer` polls every 1 second.** [BE][PERF] `lib/hooks/use-time-logs.ts:29` (`refetchInterval: 1000`). Mounted on every authenticated page via `<ActiveTimer />`. ~60 req/min/tab forever, each going through the auth stack. Visible elapsed time is computed client-side from `startedAt` already; the server poll is redundant. Recommendation: gate `refetchInterval` on `data?.id` and bump cadence to 30s, or drop polling entirely.
5. ✅ **`/api/search` and `/api/recipes` filter substrings in JS over full-table scans.** [BE][PERF] Seven unbounded `SELECT *` queries, then `rows.filter(r => r.title.toLowerCase().includes(q.toLowerCase()))`. Replace with `ilike` + per-type `.limit(20)`. — [app/api/search/route.ts:37-156](app/api/search/route.ts#L37-L156), [app/api/recipes/route.ts:15-26](app/api/recipes/route.ts#L15-L26).
6. **Tenant-isolation gap on `?parentId=…` list endpoints.** [BE] When the optional parent ID is passed, the `userId` clause is *replaced*, not *added*. Single-user mode masks it today. Affects: [app/api/courses/route.ts:34-44](app/api/courses/route.ts#L34-L44), [app/api/projects/route.ts:14-24](app/api/projects/route.ts#L14-L24), [app/api/tasks/route.ts:14-24](app/api/tasks/route.ts#L14-L24), [app/api/assignments/route.ts:14-25](app/api/assignments/route.ts#L14-L25), [app/api/milestones/route.ts:21-25](app/api/milestones/route.ts#L21-L25), [app/api/grade-categories/route.ts:21-25](app/api/grade-categories/route.ts#L21-L25), and DELETE/PATCH on tags/notes/milestones/recurrence-rules/time-logs/grade-categories.
7. ✅ **Three identical 628 KB PNGs.** [PERF] [public/brand-icon.png](public/brand-icon.png), [app/icon.png](app/icon.png), [app/apple-icon.png](app/apple-icon.png) are the same 950×950 source. Resize to 256/64/180 px → drops ~1.9 MB of static assets to <30 KB. Hard win, no behavior change.

---

## Blocking

Real bugs or perf cliffs that will fire under realistic conditions.

### Frontend / React

- ✅ **B1.** Object-literal queryKey thrash — see headline #3.
- ✅ **B2.** Pomodoro auto-stop double-fires. [components/layout/timer.tsx:28-75](components/layout/timer.tsx#L28-L75) The 1s interval keeps writing `pomodoroRemaining = 0` after expiry; the second effect fires `stopTimer.mutate` on every tick of identity-changed deps. Result: rapid duplicate "Pomodoro complete!" toasts and duplicate stop calls. The interval is not cleared when remaining hits 0.
- ✅ **B3.** `BillsThisPeriod` "next 14 days" window frozen at first paint. [components/dashboard/bills-this-period.tsx:26-46](components/dashboard/bills-this-period.tsx#L26-L46) `useMemo` captures `new Date()` and only recomputes when `paySchedule` changes. Past midnight, the window is stale until something else triggers a re-render.
- ✅ **B4.** Notes seed-once ref breaks on metadata refresh. [app/(app)/movies/[id]/page.tsx:80-88](app/\(app\)/movies/[id]/page.tsx#L80-L88) `initialNotesRef.current` is set once and never reset. After a `refreshMedia` mutation invalidates and refetches, the ref-guard prevents re-seeding.

### Backend / data layer

- ✅ **B5.** `useActiveTimer` 1s polling — see headline #4.
- ✅ **B6.** `/api/search` JS-side full-table scans — see headline #5.
- ✅ **B7.** `/api/recipes` repeats the same anti-pattern with the tag filter. [app/api/recipes/route.ts:64-66](app/api/recipes/route.ts#L64-L66) Should be a SQL `EXISTS` against `taggings`/`tags`.
- ✅ **B8.** `/api/dashboard/grades` is a 2N+1. [app/api/dashboard/grades/route.ts:55-88](app/api/dashboard/grades/route.ts#L55-L88) N active courses → 2 awaited subqueries each. Replace with a single LEFT JOIN.
- ✅ **B9.** `/api/all-items` does sequential awaits, not `Promise.all`. [app/api/all-items/route.ts:10-40](app/api/all-items/route.ts#L10-L40)
- **B10.** Unbounded list endpoints (no `LIMIT`). Will get slow even on a single user. — `recipes`, `all-items`, `movies`, `inbox`, `notes`, `tags`, `workspaces`, `event-categories`, `bill-categories`, `courses`, `projects`, `tasks`, `assignments`, `milestones`, `calendar-items` (milestone branch).
- ✅ **B11.** Tenant-isolation gap — see headline #6.
- ✅ **B12.** `/api/inbox/[id]` PATCH not Zod-validated. [app/api/inbox/[id]/route.ts:9-29](app/api/inbox/[id]/route.ts#L9-L29) Malformed `triagedAt` silently sets the column to `NULL`; `resultingItemType` is unconstrained text from outside the trust boundary.

### Performance / Next 16

- ✅ **B13.** Authenticated tree fully client-rendered — see headline #2.
- ✅ **B14.** Three identical 628 KB PNGs — see headline #7.
- ✅ **B15.** `unoptimized` on every TMDB image despite `remotePatterns` configured. [next.config.ts:23-31](next.config.ts#L23-L31), [components/movies/movie-tile.tsx:31](components/movies/movie-tile.tsx#L31), [components/layout/search-palette-tmdb-row.tsx:48](components/layout/search-palette-tmdb-row.tsx#L48), [app/(app)/movies/[id]/page.tsx:198](app/\(app\)/movies/[id]/page.tsx#L198). [BEHAVIORAL] Drop `unoptimized` and the Vercel optimizer takes over (~40-60% bytes saved on the movies grid). Slower on local dev, faster in prod.
- ✅ **B16.** Auth double-verification per request. [PERF][BEHAVIORAL] Middleware calls `supabase.auth.getUser()`, then every route handler calls it again via `requireAuthGuard`. Either trust a header from middleware, wrap with `React.cache()`, or pick the auth-stack fate first (headline #1).

---

## Should fix

Won't crash but will degrade UX or invite future bugs.

### Frontend / React

- ✅ **S1.** `BillsPage` recomputes `stats` on every render. [app/(app)/bills/page.tsx:82, 113-163](app/\(app\)/bills/page.tsx#L82) `(bills ?? []) as BillCardData[]` creates a fresh array reference each render, busting the `useMemo`. Lint already warns. Same pattern in dashboard.
- ✅ **S2.** `EventsPage` `now` captured in `useMemo([])` — never updates after midnight. [app/(app)/events/page.tsx:35](app/\(app\)/events/page.tsx#L35)
- ✅ **S3.** `WeekView` / `MonthView` "today highlight" doesn't update across midnight. [components/calendar/week-view.tsx:34](components/calendar/week-view.tsx#L34), [components/calendar/month-view.tsx:111](components/calendar/month-view.tsx#L111). `DayView` `NowIndicator` also caught and fixed.
- **S4.** Dashboard runs chrono `parseDate` per inbox item per render. [app/(app)/page.tsx:188-189](app/\(app\)/page.tsx#L188-L189) Memoize the parsed-dates array.
- ✅ **S5.** `pay-schedule-settings` form effect overwrites user input on background refetch. [components/bills/pay-schedule-settings.tsx:39-47](components/bills/pay-schedule-settings.tsx#L39-L47) If the user types and a refetch fires, their value is wiped.
- ✅ **S6.** `MovieDetailPage` notes-save races with rapid blur. [app/(app)/movies/[id]/page.tsx:90-102](app/\(app\)/movies/[id]/page.tsx#L90-L102) No mutex; an older request can complete second and stomp the newer save.
- ✅ **S7.** Mutations missing optimistic updates — task toggle, mark-paid, ratings round-trip then re-paint. Most visible in [components/projects/milestone-list.tsx:37-53](components/projects/milestone-list.tsx#L37-L53), [components/dashboard/bills-this-period.tsx:61-68](components/dashboard/bills-this-period.tsx#L61-L68), [app/(app)/movies/[id]/page.tsx:104-120](app/\(app\)/movies/[id]/page.tsx#L104-L120).
- ✅ **S8.** `confirm-dialog` doesn't restore focus to trigger. [components/ui/confirm-dialog.tsx:40-89](components/ui/confirm-dialog.tsx#L40-L89) After delete, focus falls to `document.body`. Save the previously-focused element on open.
- ✅ **S9.** `RatingStars` is 10 tab stops per widget. [components/ui/rating-stars.tsx:84-101](components/ui/rating-stars.tsx#L84-L101) Two transparent halves per star × 5 stars. Use a single hidden range input or hide half-step from keyboard.

### Backend / data layer

- ✅ **S10.** `auto-complete-past-courses/events` runs UPDATE on every list read. [app/api/courses/route.ts:13-23](app/api/courses/route.ts#L13-L23), [lib/auto-complete-events.ts:14-30](lib/auto-complete-events.ts#L14-L30). Move to a daily `pg_cron` or cache-last-run timestamp. [BEHAVIORAL] — accept up to 1-day lag in status flip.
- ✅ **S11.** Calendar-items milestone branch has no SQL date filter. [app/api/calendar-items/route.ts:98-115](app/api/calendar-items/route.ts#L98-L115) Pulls every milestone for the user, then JS-filters. Push `gte`/`lte(targetDate)` into SQL.
- **S12.** `calendar_items` SQL view defined in `lib/db/schema.ts:625-665` but never read. The handler reimplements the same UNION-ALL by hand. Pick one.
- **S13.** `/api/recurrence-rules/[id]` DELETE fans out 4 redundant updates. [app/api/recurrence-rules/[id]/route.ts:14-30](app/api/recurrence-rules/[id]/route.ts#L14-L30) FK already declares `onDelete: "set null"`. Dead work.
- ✅ **S14.** `recurrenceRules.ownerId/ownerType` placeholder pattern half-broken. [app/api/recurrence-rules/route.ts:17-43](app/api/recurrence-rules/route.ts#L17-L43) Bills insert `'00000000-…'`; nothing reads the columns. Either drop them or write the real owner. [BEHAVIORAL]
- ✅ **S15.** Index opportunities — every one is a `userId`-filtered or FK-joined hot column with no index:
  - `assignments(course_id)`, `tasks(project_id)`, `milestones(project_id)`
  - `time_logs(loggable_type, loggable_id)`
  - `time_logs(user_id, ended_at) WHERE ended_at IS NULL` partial index
  - `bills(user_id, status, due_date)` composite
  - `media_items(user_id, created_at desc)`
  - `taggings(tag_id)`
  - `grade_categories(course_id)`
- ✅ **S16.** `/api/dashboard/stats` could be one query with `FILTER` aggregates. [app/api/dashboard/stats/route.ts:30-84](app/api/dashboard/stats/route.ts#L30-L84) Five parallel COUNTs → single round-trip with subselects.
- ✅ **S17.** TanStack invalidation gaps:
  - `useUpdateBill`/`useCreateBill` don't invalidate `["dashboard","stats"]` — counters go stale.
  - `useStartTimer`/`useStopTimer` don't invalidate dashboard hours-this-week.
  - `useUpdateAssignment` doesn't invalidate `["dashboard","grades"]`.
  - Recurrence-rule mutations only invalidate `["assignments"]` and `["tasks"]`; events/bills also own recurrence rules.
- ✅ **S18.** Inputs not Zod-validated at boundary in [app/api/calendar-items/route.ts:33-47](app/api/calendar-items/route.ts#L33-L47) (parseInt without NaN check), [app/api/events/by-date/route.ts:24-26](app/api/events/by-date/route.ts#L24-L26), and the `status` filter casts in `events`/`bills` GETs.
- **S19.** TMDB client: short revalidate on metadata, no retry/rate-limit. [lib/tmdb/client.ts:34](lib/tmdb/client.ts#L34) — 60s revalidate is short for `/movie/{id}` and `/tv/{id}`; bump to 24h since data is snapshotted to DB anyway. Letterboxd import will burn 429s without backoff.
- ✅ **S20.** Drizzle / Zod drift on date strings. [lib/validations/event.ts:14](lib/validations/event.ts#L14) accepts any non-empty string for `startsAt`; route does `new Date(startsAt)`; bad input → "Invalid Date" inserted into `notNull` column → Postgres throws. Same for `endsAt`, `paidAt`, `dueDate`. Use `z.string().datetime()` or refine.
- ✅ **S21.** Bills bulk-recurrence creation skips a transaction. [app/api/bills/route.ts:78-105](app/api/bills/route.ts#L78-L105) Inserts rule, then bills batch — failure orphans the rule.
- ✅ **S22.** `time_logs/[id]/stop` returns 400 not 409 for "already stopped". [app/api/time-logs/[id]/stop/route.ts:24-28](app/api/time-logs/[id]/stop/route.ts#L24-L28)

### Performance / Next 16

- ✅ **S23.** `QueryClient` constructed with no defaults. [components/providers.tsx:11](components/providers.tsx#L11) Default `staleTime: 0` + `refetchOnWindowFocus: true` means every tab focus refetches every visible query. Set `staleTime: 30_000`, `refetchOnWindowFocus: false`. [BEHAVIORAL — flag for the multi-tab story.]
- **S24.** `BillsThisPeriod` fetches up to 500 rows to render 5. [components/dashboard/bills-this-period.tsx:23](components/dashboard/bills-this-period.tsx#L23) Add a `/api/bills/upcoming?periodStart=…&periodEnd=…` endpoint matching the `/api/events/upcoming` pattern.
- ✅ **S25.** `parseDate` (chrono-node, ~5 MB) shipped to every dashboard visitor. [lib/parse-date.ts:1](lib/parse-date.ts#L1) Use `import { parse } from "chrono-node/locales/en"` or lazy-load via `dynamic(... { ssr: false })`. Hundreds of KB saved.
- ✅ **S26.** `EB_Garamond` loaded as 6 font files. [app/layout.tsx:18-23](app/layout.tsx#L18-L23) `weight: ["400", "500", "600"] × style: ["normal", "italic"]`. Audit actual usage and drop unused weights/styles.
- ✅ **S27.** `optimizePackageImports` not configured for `@base-ui/react`. [next.config.ts](next.config.ts) Many UI primitives import from it. Worth measuring before/after.
- ✅ **S28.** `PageTransition` `key={pathname}` remounts the whole subtree on every navigation. [components/layout/page-transition.tsx:9](components/layout/page-transition.tsx#L9) Every TanStack consumer tears down and re-mounts → loading skeletons even when data is fresh. Use a CSS-only transition or the View Transitions API.

---

## Nits

Low-priority cleanup. Address opportunistically.

- ✅ **N1.** Dead code: [lib/auth/remember-me.ts](lib/auth/remember-me.ts) constants are unused (`grep -rn` clean).
- ✅ **N2.** Defense-in-depth narrating comments scattered across `lib/auth/*`, `lib/auto-complete-events.ts`, several `app/api/*` routes — violates project rule "no narrating comments."
- ✅ **N3.** Defensive checks for impossible states: every route's `if (__guard) return __guard` after an already-passed guard call; `lib/auth/recipe-ownership.ts` re-checks ownership after `requireAuthGuard` already enforced single-user.
- ✅ **N4.** Index keys (`key={i}`) on a few semi-dynamic lists. [components/calendar/month-view.tsx:201](components/calendar/month-view.tsx#L201) is the most fragile; the others are over constants.
- ✅ **N5.** [components/recipes/recipe-dialog.tsx:54-69](components/recipes/recipe-dialog.tsx#L54-L69) doesn't use `zodResolver` — runs schema imperatively in `onSubmit`. Inline errors don't show.
- ✅ **N6.** `set-state-in-effect` lint warnings in [components/layout/timer.tsx](components/layout/timer.tsx) and [lib/hooks/use-count-up.ts](lib/hooks/use-count-up.ts) are false positives in their current form, but the patterns could be cleaner (derived state vs mirrored state).
- ✅ **N7.** Duplicated utilities — lift to `lib/utils`:
  - `formatDuration`: [components/layout/timer.tsx:14-20](components/layout/timer.tsx#L14-L20), [components/time-log-history.tsx:24-31](components/time-log-history.tsx#L24-L31)
  - `gradeColor`: [components/academic/grade-projector.tsx:47-52](components/academic/grade-projector.tsx#L47-L52), [components/academic/course-snapshot.tsx:31-36](components/academic/course-snapshot.tsx#L31-L36)
  - `computeCategoryPercent`: same two files
  - `formatDaysUntil`: [components/dashboard/upcoming-milestones.tsx:18-30](components/dashboard/upcoming-milestones.tsx#L18-L30), [components/projects/project-snapshot.tsx:26-38](components/projects/project-snapshot.tsx#L26-L38)
  - `getItemLink`: [app/(app)/page.tsx:52-55](app/\(app\)/page.tsx#L52-L55), [components/dashboard/todays-focus.tsx:29-32](components/dashboard/todays-focus.tsx#L29-L32)
  - `toLocalDateTimeInput`: [components/projects/task-dialog.tsx:48-54](components/projects/task-dialog.tsx#L48-L54), [components/academic/assignment-dialog.tsx:63-69](components/academic/assignment-dialog.tsx#L63-L69)
- ✅ **N8.** Cargo-cult `useMemo` returning the same reference — [app/(app)/recipes/page.tsx:34](app/\(app\)/recipes/page.tsx#L34).
- **N9.** Topbar `dateLabel` rebuilt every render — [components/layout/topbar.tsx:25-30](components/layout/topbar.tsx#L25-L30). Cheap, but consider memo.
- ✅ **N10.** [components/notes-list.tsx:43-66](components/notes-list.tsx#L43-L66) — relative timestamps frozen at render. After an hour on the page, "5m ago" still says 5m.
- ✅ **N11.** [scripts/create-view.ts](scripts/create-view.ts) duplicates SQL in `lib/db/schema.ts:625-665`. One is dead.
- ✅ **N12.** Unused boilerplate in `public/`: [public/file.svg](public/file.svg), [public/globe.svg](public/globe.svg), [public/next.svg](public/next.svg), [public/vercel.svg](public/vercel.svg), [public/window.svg](public/window.svg). Grep clean.
- ✅ **N13.** [tsconfig.json:3](tsconfig.json#L3) — `target: "ES2017"`. Bump to ES2022 to drop polyfilling on modern browsers / Node 22.
- ✅ **N14.** [components/layout/sidebar.tsx:23](components/layout/sidebar.tsx#L23) — imports `package.json` for the version display. Use `process.env.npm_package_version` at build time.

---

## Behavioral changes — sign off before doing

- ✅ **A.** ~~Kill the Supabase auth stack~~ → kept stack, updated AGENTS.md. Done in headline #1.
- ✅ **B.** ~~Move authenticated tree off `"use client"`~~ → done across Phases 0-3 of headline #2. Every `(app)/` page is now server-rendered with hydrated TanStack cache.
- ✅ **C.** ~~Drop `unoptimized` on TMDB images~~ → done in headline #6. Optimizer engaged; 30-day cache TTL set.
- ✅ **D.** ~~Gate `useActiveTimer` polling~~ → polling removed entirely. Multi-tab sync via window focus.
- ✅ **E.** ~~Set `staleTime` on QueryClient~~ → done in batch 5+9. `staleTime: 30_000` and `refetchOnWindowFocus: false`.
- ✅ **F.** ~~Switch `/api/search` to SQL `ilike`~~ → done in headline #5. Per-type `.limit(5)`, no relevance ranking change beyond the truncation cap.
- ✅ **G.** ~~Move auto-complete sweeps to cron~~ → done in batch 8. Cron daily at 04:00 UTC.
- ✅ **H.** ~~Tighten `userId` filters on `?parentId=` endpoints~~ → done as part of headline #1.
- ✅ **I.** ~~Drop `recurrenceRules.ownerId/ownerType` placeholder columns~~ → done in batch 8. Columns dropped via migration 0009; data preserved (placeholder UUIDs were the only loss).

---

## Verified clean

Areas the audits specifically checked and found nothing.

- `next/image` and `next/link` used consistently for media and internal nav.
- `next/font` correctly used in `app/layout.tsx` for all three families with subsets.
- `params: Promise<{...}>` is awaited / `use()`'d correctly throughout (Next 16 compliant).
- No Server Actions in the codebase; no serialization footguns.
- No `unstable_cache`, no `dynamic = 'force-dynamic'`, no `revalidate` exports — clean slate for Cache Components if/when desired.
- Vercel Analytics & Speed Insights mounted once at root.
- Drizzle FK `onDelete` semantics consistent and explicit.
- `media_items (user_id, media_type, tmdb_id)` unique index correctly enforces idempotent add.
- `pgEnum` ↔ Zod enum stay in sync (verified across 16 enums).
- `lib/db/index.ts` connection caching survives HMR; no leaks.
- `priority` on `next/image` set on actual LCP candidates (login, sidebar, movie detail).
- TMDB API key is server-only.
- React-hook-form + Zod integration correct everywhere except `RecipeDialog` (N5).
- TypeScript strict, no `any` casts in audited files.
- `npx tsc --noEmit` passes with zero errors.

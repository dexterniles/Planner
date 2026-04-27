<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Auth model

Supabase auth is required for the entire `(app)/` route tree and every `/api/*` route except `/api/health` and `/api/auth/logout`. The proxy (`proxy.ts`) refreshes the Supabase session, redirects unauthenticated requests to `/login`, and enforces an `ALLOWED_ADMIN_EMAIL` allowlist before any route handler runs.

After the proxy verifies the JWT, it forwards the verified user id/email to downstream handlers via the `x-auth-user-id` and `x-auth-user-email` request headers (set on the same `NextResponse.next({ request })` call that propagates the refreshed cookies). Route handlers call `requireAuthGuard(request)` from `lib/auth/require-auth.ts` for defense-in-depth — that helper reads those headers, fails closed if absent, and returns the resolved `userId`/`email`.

Today there is one allowed user; tomorrow there could be more. Resolve `userId` from the auth helper inside route handlers and route-called libs, never from the hardcoded `SINGLE_USER_ID` constant. That constant remains in `lib/db/schema.ts` for `scripts/seed.ts` only. To graduate to per-user data, drop the allowlist; no per-route refactor is required.

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Server-side Supabase client wired to read/write the auth cookie via
 * Next.js's cookies() store. Use from Server Components and API routes that
 * need to know who's signed in.
 *
 * Note: this is the *anon-key* client; auth is enforced by the cookie's JWT.
 * For privileged storage / admin work, use supabaseAdmin from `./server`.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Server Components can't set cookies; that's fine — the
            // companion middleware refreshes the session cookie on every
            // request, so this branch is a no-op in those contexts.
          }
        },
      },
    },
  );
}

/**
 * Quick helper that returns the currently signed-in user, or null if the
 * request is unauthenticated. Use in API routes for an extra defense layer
 * on top of the middleware.
 */
export async function getSessionUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

"use client";

import { createBrowserClient } from "@supabase/ssr";

/**
 * Browser-side Supabase client wired to use cookies for session storage. The
 * companion middleware refreshes the session on every request so server
 * components and API routes can read it via createServerClient.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}

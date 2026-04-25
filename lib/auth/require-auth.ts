import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/supabase/server-auth";

const ALLOWED_EMAIL = process.env.ALLOWED_ADMIN_EMAIL?.toLowerCase();

/**
 * Defense-in-depth check for API route handlers. The middleware should
 * already have rejected unauthenticated requests, but this guards against
 * misconfiguration or future regressions.
 *
 * Returns a 401 NextResponse if the request is not authenticated as the
 * allowlisted user, otherwise returns null and the handler should proceed.
 *
 * Usage:
 *   export async function GET() {
 *     const guard = await requireAuthGuard();
 *     if (guard) return guard;
 *     // ... normal logic
 *   }
 */
export async function requireAuthGuard(): Promise<NextResponse | null> {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (
    ALLOWED_EMAIL &&
    user.email?.toLowerCase() !== ALLOWED_EMAIL
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return null;
}

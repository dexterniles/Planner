import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

const RAW_ALLOWED_EMAIL = process.env.ALLOWED_ADMIN_EMAIL?.trim();
if (!RAW_ALLOWED_EMAIL) {
  throw new Error(
    "ALLOWED_ADMIN_EMAIL is not set. The email allowlist is the only barrier between Supabase signups and the app — refusing to boot without it.",
  );
}
const ALLOWED_EMAIL = RAW_ALLOWED_EMAIL.toLowerCase();

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const { user, response } = await updateSession(request);

  // Not authenticated → bounce to login (preserve intended destination).
  if (!user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    if (pathname !== "/" && !pathname.startsWith("/login")) {
      url.searchParams.set("next", pathname);
    }
    return NextResponse.redirect(url);
  }

  // Email allowlist check — defense in depth even though signups are disabled.
  if (user.email?.toLowerCase() !== ALLOWED_EMAIL) {
    // Log them out by hitting the logout endpoint via redirect, then to /login
    const url = request.nextUrl.clone();
    url.pathname = "/api/auth/logout";
    url.searchParams.set("forbidden", "1");
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|login|api/auth|api/health|api/cron|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|mp4|webm|woff2?|ttf)$).*)",
  ],
};

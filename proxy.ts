import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

const ALLOWED_EMAIL = process.env.ALLOWED_ADMIN_EMAIL?.toLowerCase();

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
  if (
    ALLOWED_EMAIL &&
    user.email?.toLowerCase() !== ALLOWED_EMAIL
  ) {
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
    "/((?!_next/static|_next/image|favicon.ico|login|api/auth|api/health|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|mp4|webm|woff2?|ttf)$).*)",
  ],
};

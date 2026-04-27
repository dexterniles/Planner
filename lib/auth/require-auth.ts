import { NextResponse } from "next/server";
import {
  AUTH_USER_ID_HEADER,
  AUTH_USER_EMAIL_HEADER,
} from "@/lib/supabase/middleware";

// Trusts headers stamped by proxy.ts after a verified getUser(); fails closed if absent.

const ALLOWED_EMAIL = process.env.ALLOWED_ADMIN_EMAIL?.toLowerCase();

export type AuthResult =
  | { ok: true; userId: string; email: string }
  | { ok: false; response: NextResponse };

export async function requireAuthGuard(request: Request): Promise<AuthResult> {
  const userId = request.headers.get(AUTH_USER_ID_HEADER);
  const email = request.headers.get(AUTH_USER_EMAIL_HEADER);

  if (!userId || !email) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  if (ALLOWED_EMAIL && email.toLowerCase() !== ALLOWED_EMAIL) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }

  return { ok: true, userId, email };
}

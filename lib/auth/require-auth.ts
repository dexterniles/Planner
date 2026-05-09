import { NextResponse } from "next/server";
import {
  AUTH_USER_ID_HEADER,
  AUTH_USER_EMAIL_HEADER,
} from "@/lib/supabase/middleware";

// Trusts headers stamped by proxy.ts after a verified getUser(); fails closed if absent.

const RAW_ALLOWED_EMAIL = process.env.ALLOWED_ADMIN_EMAIL?.trim();
if (!RAW_ALLOWED_EMAIL) {
  throw new Error("ALLOWED_ADMIN_EMAIL is not set; refusing to boot.");
}
const ALLOWED_EMAIL = RAW_ALLOWED_EMAIL.toLowerCase();

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

  if (email.toLowerCase() !== ALLOWED_EMAIL) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }

  return { ok: true, userId, email };
}

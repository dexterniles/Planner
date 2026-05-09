import { headers } from "next/headers";
import {
  AUTH_USER_ID_HEADER,
  AUTH_USER_EMAIL_HEADER,
} from "@/lib/supabase/middleware";

const RAW_ALLOWED_EMAIL = process.env.ALLOWED_ADMIN_EMAIL?.trim();
if (!RAW_ALLOWED_EMAIL) {
  throw new Error("ALLOWED_ADMIN_EMAIL is not set; refusing to boot.");
}
const ALLOWED_EMAIL = RAW_ALLOWED_EMAIL.toLowerCase();

export type ServerAuthResult =
  | { ok: true; userId: string; email: string }
  | { ok: false };

export async function getServerAuth(): Promise<ServerAuthResult> {
  const h = await headers();
  const userId = h.get(AUTH_USER_ID_HEADER);
  const email = h.get(AUTH_USER_EMAIL_HEADER);
  if (!userId || !email) return { ok: false };
  if (email.toLowerCase() !== ALLOWED_EMAIL) return { ok: false };
  return { ok: true, userId, email };
}

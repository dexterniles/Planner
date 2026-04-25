"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  REMEMBER_KEY,
  SESSION_IDLE_LIMIT_MS,
  SESSION_START_KEY,
} from "@/lib/auth/remember-me";

/**
 * Adds a soft idle timeout for sessions where the user unchecked
 * "Remember this computer". The Supabase session cookie itself is always
 * long-lived (set by the project), but we sign out when:
 *   - REMEMBER_KEY is "0", AND
 *   - the time since SESSION_START_KEY exceeds SESSION_IDLE_LIMIT_MS, AND
 *   - the user has been idle (no nav events) longer than the limit.
 *
 * Idle is tracked with a sessionStorage timestamp that bumps on every page
 * navigation; once it expires we sign out and redirect to /login.
 */
export function SessionWatcher() {
  const router = useRouter();

  useEffect(() => {
    if (typeof window === "undefined") return;
    const remember = window.localStorage.getItem(REMEMBER_KEY) !== "0";
    if (remember) {
      // Default behavior — long-lived session, nothing to enforce.
      window.sessionStorage.setItem(SESSION_START_KEY, Date.now().toString());
      return;
    }

    const startRaw = window.sessionStorage.getItem(SESSION_START_KEY);
    const lastActivity = startRaw ? Number(startRaw) : Date.now();
    if (
      Number.isFinite(lastActivity) &&
      Date.now() - lastActivity > SESSION_IDLE_LIMIT_MS
    ) {
      // Past the idle limit — sign out and surface a banner on /login.
      const supabase = createClient();
      supabase.auth.signOut().finally(() => {
        window.sessionStorage.removeItem(SESSION_START_KEY);
        try {
          window.sessionStorage.setItem("__planner_session_expired", "1");
        } catch {
          // ignore storage failures
        }
        router.replace("/login");
        router.refresh();
      });
      return;
    }
    // Bump the activity timestamp on each navigation.
    window.sessionStorage.setItem(SESSION_START_KEY, Date.now().toString());
  }, [router]);

  return null;
}

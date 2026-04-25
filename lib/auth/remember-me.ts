/**
 * Storage keys + tunables for the "Remember this computer" preference. The
 * Supabase session is always long-lived; this layer adds an idle-timeout
 * dimension on top so unchecking the box gives a meaningful behavior change.
 */

export const REMEMBER_KEY = "__planner_remember_me";
export const SESSION_START_KEY = "__planner_session_start";
/** Maximum idle time (ms) before a non-remembered session is signed out. */
export const SESSION_IDLE_LIMIT_MS = 4 * 60 * 60 * 1000;

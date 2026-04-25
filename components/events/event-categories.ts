import {
  Utensils,
  Music,
  Plane,
  Users,
  CalendarClock,
  PartyPopper,
  Sparkles,
} from "lucide-react";
import type { EventStatus } from "@/lib/validations/event";

export interface EventCategoryMeta {
  /** Display label */
  label: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  /** Tailwind gradient tone used for icon background */
  gradient: string;
  /** Tailwind text color for icon/label */
  text: string;
  /** Hex fallback color when the category has no override */
  defaultColor: string;
}

/**
 * Built-in metadata keyed by lowercase category name. Matches the seven seeded
 * defaults so existing events keep their familiar icon/colors. User-created
 * categories fall through to a generic Sparkles look in `getEventCategoryMeta`.
 */
const BUILTIN_META: Record<string, EventCategoryMeta> = {
  dinner: {
    label: "Dinner",
    icon: Utensils,
    gradient: "from-amber-500/20 to-amber-500/5",
    text: "text-amber-600 dark:text-amber-400",
    defaultColor: "#F59E0B",
  },
  concert: {
    label: "Concert",
    icon: Music,
    gradient: "from-violet-500/20 to-violet-500/5",
    text: "text-violet-600 dark:text-violet-400",
    defaultColor: "#8B5CF6",
  },
  travel: {
    label: "Travel",
    icon: Plane,
    gradient: "from-emerald-500/20 to-emerald-500/5",
    text: "text-emerald-600 dark:text-emerald-400",
    defaultColor: "#10B981",
  },
  hangout: {
    label: "Hangout",
    icon: Users,
    gradient: "from-blue-500/20 to-blue-500/5",
    text: "text-blue-600 dark:text-blue-400",
    defaultColor: "#3B82F6",
  },
  appointment: {
    label: "Appointment",
    icon: CalendarClock,
    gradient: "from-slate-500/20 to-slate-500/5",
    text: "text-slate-600 dark:text-slate-400",
    defaultColor: "#64748B",
  },
  social: {
    label: "Social",
    icon: PartyPopper,
    gradient: "from-rose-500/20 to-rose-500/5",
    text: "text-rose-600 dark:text-rose-400",
    defaultColor: "#EC4899",
  },
  other: {
    label: "Other",
    icon: Sparkles,
    gradient: "from-indigo-500/20 to-indigo-500/5",
    text: "text-indigo-600 dark:text-indigo-400",
    defaultColor: "#6366F1",
  },
};

const GENERIC_META: EventCategoryMeta = {
  label: "Category",
  icon: Sparkles,
  gradient: "from-indigo-500/20 to-indigo-500/5",
  text: "text-indigo-600 dark:text-indigo-400",
  defaultColor: "#6366F1",
};

/**
 * Resolve the icon/gradient/color for an event category. Built-in default
 * categories get their custom icon; user-created categories fall back to a
 * generic Sparkles look but keep the user's stored color.
 */
export function getEventCategoryMeta(
  name: string | null | undefined,
  color: string | null = null,
): EventCategoryMeta {
  if (name) {
    const known = BUILTIN_META[name.toLowerCase()];
    if (known) {
      return color ? { ...known, label: name, defaultColor: color } : known;
    }
    return { ...GENERIC_META, label: name, defaultColor: color ?? GENERIC_META.defaultColor };
  }
  return GENERIC_META;
}

export const STATUS_LABELS: Record<EventStatus, string> = {
  confirmed: "Confirmed",
  tentative: "Tentative",
  cancelled: "Cancelled",
  completed: "Completed",
};

/**
 * Format an event's time range for display. Handles all-day, single-point,
 * same-day range, and multi-day range.
 */
export function formatEventTime(
  startsAt: string | Date,
  endsAt: string | Date | null | undefined,
  allDay: boolean,
): string {
  const start = typeof startsAt === "string" ? new Date(startsAt) : startsAt;
  const end = endsAt
    ? typeof endsAt === "string"
      ? new Date(endsAt)
      : endsAt
    : null;

  const dateOpts: Intl.DateTimeFormatOptions = {
    weekday: "short",
    month: "short",
    day: "numeric",
  };
  const timeOpts: Intl.DateTimeFormatOptions = {
    hour: "numeric",
    minute: "2-digit",
  };

  if (allDay) {
    if (!end) return start.toLocaleDateString([], dateOpts);
    const sameDay =
      start.getFullYear() === end.getFullYear() &&
      start.getMonth() === end.getMonth() &&
      start.getDate() === end.getDate();
    if (sameDay) return `${start.toLocaleDateString([], dateOpts)} · All day`;
    return `${start.toLocaleDateString([], dateOpts)} → ${end.toLocaleDateString([], dateOpts)}`;
  }

  if (!end) {
    return `${start.toLocaleDateString([], dateOpts)} · ${start.toLocaleTimeString([], timeOpts)}`;
  }

  const sameDay =
    start.getFullYear() === end.getFullYear() &&
    start.getMonth() === end.getMonth() &&
    start.getDate() === end.getDate();
  if (sameDay) {
    return `${start.toLocaleDateString([], dateOpts)} · ${start.toLocaleTimeString([], timeOpts)} → ${end.toLocaleTimeString([], timeOpts)}`;
  }
  return `${start.toLocaleDateString([], dateOpts)} ${start.toLocaleTimeString([], timeOpts)} → ${end.toLocaleDateString([], dateOpts)} ${end.toLocaleTimeString([], timeOpts)}`;
}

/**
 * Format date/time as a relative label ("Tonight", "Tomorrow", "Saturday", "In 2w").
 */
export function formatEventWhen(startsAt: string | Date): string {
  const start = typeof startsAt === "string" ? new Date(startsAt) : startsAt;
  const now = new Date();
  const diffMs = start.getTime() - now.getTime();
  const diffDays = Math.round(diffMs / 86400000);

  const sameDay =
    start.getFullYear() === now.getFullYear() &&
    start.getMonth() === now.getMonth() &&
    start.getDate() === now.getDate();

  if (sameDay) {
    const hour = start.getHours();
    const timeStr = start.toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
    });
    if (hour >= 17) return `Tonight ${timeStr}`;
    if (hour >= 12) return `This afternoon ${timeStr}`;
    return `Today ${timeStr}`;
  }

  if (diffDays === 1) {
    const timeStr = start.toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
    });
    return `Tomorrow ${timeStr}`;
  }

  if (diffDays > 1 && diffDays < 7) {
    return start.toLocaleDateString([], { weekday: "long" });
  }

  if (diffDays < 0) {
    return "Past";
  }

  if (diffDays < 30) {
    return `In ${Math.ceil(diffDays / 7)}w`;
  }

  return start.toLocaleDateString([], { month: "short", day: "numeric" });
}

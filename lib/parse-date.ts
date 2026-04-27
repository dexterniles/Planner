import { parse as chronoParse } from "chrono-node/en";

export interface ParsedDateResult {
  date: Date;
  matchText: string;
  preview: string;
  remainingText: string;
}

function formatPreview(date: Date): string {
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffDays = Math.round(diffMs / 86400000);

  const sameDay =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();

  const timeStr = date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });

  // Heuristic: chrono returns noon when no time is specified
  const hasExplicitTime = !(
    date.getHours() === 12 &&
    date.getMinutes() === 0 &&
    date.getSeconds() === 0
  );

  if (sameDay) return hasExplicitTime ? `Today, ${timeStr}` : "Today";

  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  const isTomorrow =
    date.getFullYear() === tomorrow.getFullYear() &&
    date.getMonth() === tomorrow.getMonth() &&
    date.getDate() === tomorrow.getDate();
  if (isTomorrow) return hasExplicitTime ? `Tomorrow, ${timeStr}` : "Tomorrow";

  if (diffDays >= 0 && diffDays < 7) {
    const weekday = date.toLocaleDateString([], { weekday: "long" });
    return hasExplicitTime ? `${weekday}, ${timeStr}` : weekday;
  }

  const dateStr = date.toLocaleDateString([], {
    month: "short",
    day: "numeric",
    year: diffDays > 365 ? "numeric" : undefined,
  });
  return hasExplicitTime ? `${dateStr}, ${timeStr}` : dateStr;
}

export function parseDate(text: string): ParsedDateResult | null {
  if (!text || text.length < 3) return null;

  const results = chronoParse(text, new Date(), { forwardDate: true });
  if (results.length === 0) return null;

  const result = results[0];
  const date = result.start.date();

  if (!date || isNaN(date.getTime())) return null;

  const matchText = result.text;
  const remainingText = (
    text.slice(0, result.index) + text.slice(result.index + matchText.length)
  )
    .replace(/\s+/g, " ")
    .trim();

  return {
    date,
    matchText,
    preview: formatPreview(date),
    remainingText,
  };
}

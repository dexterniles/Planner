interface FormatDaysUntilOptions {
  prefix?: string;
  overdueLabel?: string;
}

export function formatDaysUntil(
  dateStr: string | null,
  options: FormatDaysUntilOptions = {},
): string {
  if (!dateStr) return "No date";
  const target = new Date(dateStr);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const days = Math.round((target.getTime() - now.getTime()) / 86400000);
  const prefix = options.prefix ?? "";
  const overdueLabel = options.overdueLabel ?? "overdue";
  if (days < 0) return `${Math.abs(days)}d ${overdueLabel}`;
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  if (days < 7) return `${prefix}${days}d`;
  if (days < 30) return `${prefix}${Math.floor(days / 7)}w`;
  return target.toLocaleDateString();
}

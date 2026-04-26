"use client";

interface SearchPaletteGroupHeaderProps {
  label: string;
  count?: number;
  isFirst?: boolean;
}

export function SearchPaletteGroupHeader({
  label,
  count,
  isFirst,
}: SearchPaletteGroupHeaderProps) {
  return (
    <div
      role="presentation"
      className={`sticky top-0 z-10 flex items-center justify-between bg-popover px-3 py-1 text-[10.5px] font-medium uppercase tracking-[0.1em] text-muted-foreground ${
        isFirst ? "" : "mt-2"
      }`}
    >
      <span>{label}</span>
      {count !== undefined && count > 1 ? (
        <span className="tabular-nums">{count}</span>
      ) : null}
    </div>
  );
}

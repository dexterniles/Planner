"use client";

import {
  GraduationCap,
  FolderKanban,
  FileText,
  ListChecks,
  PartyPopper,
  Wallet,
  ChefHat,
} from "lucide-react";
import { getEventCategoryMeta } from "@/components/events/event-categories";

export interface LocalSearchResult {
  id: string;
  type: string;
  title: string;
  subtitle: string | null;
  color: string | null;
  parentId: string | null;
  category: string | null;
}

const typeIcons: Record<string, typeof GraduationCap> = {
  course: GraduationCap,
  project: FolderKanban,
  assignment: FileText,
  task: ListChecks,
  event: PartyPopper,
  bill: Wallet,
  recipe: ChefHat,
};

export const typeLabels: Record<string, string> = {
  course: "Course",
  project: "Project",
  assignment: "Assignment",
  task: "Task",
  event: "Event",
  bill: "Bill",
  recipe: "Recipe",
};

export const localTypeOrder = [
  "course",
  "project",
  "assignment",
  "task",
  "event",
  "bill",
  "recipe",
];

function renderResultIcon(result: LocalSearchResult, color: string | null) {
  const Component =
    result.type === "event"
      ? getEventCategoryMeta(result.category, result.color).icon
      : typeIcons[result.type] ?? FileText;
  return (
    <Component
      className="h-3.5 w-3.5"
      style={{ color: color ?? undefined }}
      strokeWidth={1.75}
    />
  );
}

export function getLocalResultLink(result: LocalSearchResult): string {
  switch (result.type) {
    case "course":
      return `/academic/${result.id}`;
    case "project":
      return `/projects/${result.id}`;
    case "assignment":
      return `/academic/${result.parentId}`;
    case "task":
      return `/projects/${result.parentId}`;
    case "event":
      return `/events/${result.id}`;
    case "bill":
      return `/bills`;
    case "recipe":
      return `/recipes/${result.id}`;
    default:
      return "/";
  }
}

interface SearchPaletteLocalRowProps {
  result: LocalSearchResult;
  isSelected: boolean;
  onSelect: () => void;
}

export function SearchPaletteLocalRow({
  result,
  isSelected,
  onSelect,
}: SearchPaletteLocalRowProps) {
  const color = result.color;
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`flex w-full items-center gap-3 rounded-md px-3 py-2.5 sm:py-2 text-left text-[13px] transition-colors ${
        isSelected
          ? "bg-accent text-accent-foreground"
          : "hover:bg-accent/50"
      }`}
    >
      <div
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md"
        style={{
          backgroundColor: color ? `${color}18` : "var(--muted)",
        }}
      >
        {renderResultIcon(result, color)}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{result.title}</p>
        <p className="text-[11px] text-muted-foreground truncate">
          <span className="uppercase tracking-[0.1em]">
            {typeLabels[result.type]}
          </span>
          {result.subtitle && ` · ${result.subtitle}`}
        </p>
      </div>
    </button>
  );
}

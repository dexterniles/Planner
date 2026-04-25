"use client";

import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ColorTileProps {
  color: string;
  name: string;
  onEdit: () => void;
  onDelete: () => void;
  /** Used to build aria-labels: "Edit ${ariaPrefix}: ${name}". */
  ariaPrefix: string;
  /** When true, action buttons are disabled (e.g. mutation in flight). */
  disabled?: boolean;
}

/**
 * Compact tile used for taxonomy entities (tags, bill categories).
 * Mirrors the course/project/event tile language at smaller scale: a colored
 * top band identifies the entity, body holds the name + ⋯ menu.
 */
export function ColorTile({
  color,
  name,
  onEdit,
  onDelete,
  ariaPrefix,
  disabled,
}: ColorTileProps) {
  return (
    <Card className="group flex flex-col overflow-hidden p-0">
      <div className="h-[36px] shrink-0" style={{ backgroundColor: color }} />
      <div className="flex items-center gap-2 px-3 py-2">
        <span className="min-w-0 flex-1 truncate text-[13px] font-medium">
          {name}
        </span>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="ghost"
                size="icon-xs"
                aria-label={`Actions for ${ariaPrefix} ${name}`}
                disabled={disabled}
              />
            }
          >
            <MoreHorizontal className="h-3.5 w-3.5" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onEdit} disabled={disabled}>
              <Pencil className="mr-1.5 h-3.5 w-3.5" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              variant="destructive"
              onClick={onDelete}
              disabled={disabled}
            >
              <Trash2 className="mr-1.5 h-3.5 w-3.5" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </Card>
  );
}

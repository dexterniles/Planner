"use client";

import { useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAllItems } from "@/lib/hooks/use-all-items";
import { Search } from "lucide-react";

interface Item {
  id: string;
  type: string;
  title: string;
  status: string;
  dueDate: string | null;
  parentId: string;
  parentName: string;
  parentColor: string | null;
  priority: string | null;
}

function getItemLink(item: Item): string {
  if (item.type === "assignment") {
    return `/academic/${item.parentId}`;
  }
  return `/projects/${item.parentId}`;
}

const statusLabels: Record<string, string> = {
  not_started: "Not Started",
  in_progress: "In Progress",
  submitted: "Submitted",
  graded: "Graded",
  done: "Done",
  cancelled: "Cancelled",
};

const typeFilters = ["all", "assignment", "task"] as const;
const statusFilters = [
  "all",
  "not_started",
  "in_progress",
  "done",
  "submitted",
  "graded",
  "cancelled",
] as const;

export default function ItemsPage() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const { data: items, isLoading } = useAllItems();

  const filtered = (items ?? []).filter((item: Item) => {
    if (typeFilter !== "all" && item.type !== typeFilter) return false;
    if (statusFilter !== "all" && item.status !== statusFilter) return false;
    if (
      search &&
      !item.title.toLowerCase().includes(search.toLowerCase()) &&
      !item.parentName.toLowerCase().includes(search.toLowerCase())
    )
      return false;
    return true;
  });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">All Items</h1>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search items..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex gap-1">
          {typeFilters.map((f) => (
            <Button
              key={f}
              variant={typeFilter === f ? "default" : "outline"}
              size="sm"
              onClick={() => setTypeFilter(f)}
            >
              {f === "all" ? "All Types" : f === "assignment" ? "Assignments" : "Tasks"}
            </Button>
          ))}
        </div>

        <div className="flex gap-1">
          {statusFilters.map((f) => (
            <Button
              key={f}
              variant={statusFilter === f ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter(f)}
              className="text-xs"
            >
              {f === "all" ? "All" : statusLabels[f] ?? f}
            </Button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : filtered.length === 0 ? (
        <p className="text-muted-foreground mt-8 text-center">
          {items?.length === 0
            ? "No items yet. Create assignments or tasks to see them here."
            : "No items match your filters."}
        </p>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Due</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((item: Item) => (
                <TableRow key={`${item.type}-${item.id}`} className="cursor-pointer">
                  <TableCell className="font-medium">
                    <Link href={getItemLink(item)} className="hover:underline">
                      {item.title}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs capitalize">
                      {item.type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div
                        className="h-2 w-2 rounded-full"
                        style={{
                          backgroundColor: item.parentColor ?? "#888",
                        }}
                      />
                      <span className="text-muted-foreground">
                        {item.parentName}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {item.dueDate
                      ? new Date(item.dueDate).toLocaleDateString()
                      : "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {statusLabels[item.status] ?? item.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        {filtered.length} of {items?.length ?? 0} items shown
      </p>
    </div>
  );
}

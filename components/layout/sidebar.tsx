"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Calendar,
  List,
  GraduationCap,
  FolderKanban,
  BookOpen,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Calendar", href: "/calendar", icon: Calendar },
  { label: "All Items", href: "/items", icon: List },
  { label: "Academic", href: "/academic", icon: GraduationCap },
  { label: "Projects", href: "/projects", icon: FolderKanban },
  { label: "Daily Log", href: "/daily-log", icon: BookOpen },
  { label: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-64 flex-col border-r border-sidebar-border bg-sidebar">
      <div className="flex h-12 items-center border-b border-sidebar-border px-5">
        <Link
          href="/"
          className="text-lg font-semibold tracking-tight text-primary transition-opacity hover:opacity-80"
        >
          Planner
        </Link>
      </div>
      <nav className="flex-1 space-y-0.5 p-3">
        {navItems.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group relative flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition-all duration-150 ease-out",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
              )}
            >
              <span
                className={cn(
                  "absolute left-0 top-1/2 h-5 w-[3px] -translate-x-[11px] -translate-y-1/2 rounded-r-full bg-primary transition-all duration-200 ease-out",
                  isActive
                    ? "opacity-100 scale-y-100"
                    : "opacity-0 scale-y-0",
                )}
              />
              <item.icon
                className={cn(
                  "h-4 w-4 transition-colors",
                  isActive ? "text-primary" : "",
                )}
              />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

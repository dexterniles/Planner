"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Calendar,
  GraduationCap,
  FolderKanban,
  PartyPopper,
  Wallet,
  BookOpen,
  Settings,
  PanelLeftClose,
  PanelLeftOpen,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSidebar } from "./sidebar-context";

const navItems = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Calendar", href: "/calendar", icon: Calendar },
  { label: "Academic", href: "/academic", icon: GraduationCap },
  { label: "Projects", href: "/projects", icon: FolderKanban },
  { label: "Events", href: "/events", icon: PartyPopper },
  { label: "Bills", href: "/bills", icon: Wallet },
  { label: "Daily Log", href: "/daily-log", icon: BookOpen },
  { label: "Settings", href: "/settings", icon: Settings },
];

interface SidebarProps {
  /**
   * When true (mobile sheet), the sidebar always renders expanded regardless
   * of the collapsed context. Desktop uses the context for collapse state.
   */
  forceExpanded?: boolean;
  /**
   * When provided (mobile sheet), shows an integrated X close button in the
   * header and auto-closes on nav item click.
   */
  onClose?: () => void;
}

export function Sidebar({ forceExpanded = false, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { collapsed, toggle, ready } = useSidebar();
  const isCollapsed = forceExpanded ? false : collapsed;

  return (
    <aside
      className={cn(
        "flex h-full flex-col border-r border-sidebar-border bg-sidebar",
        // Smooth width transition — suppressed until hydration reconciles
        ready ? "transition-[width] duration-300 ease-out" : "",
        isCollapsed ? "w-[60px]" : forceExpanded ? "w-full" : "w-64",
      )}
    >
      {/* Header */}
      <div
        className={cn(
          "flex h-12 items-center border-b border-sidebar-border",
          isCollapsed ? "justify-center px-0" : "px-5",
          onClose && !isCollapsed ? "justify-between" : "",
        )}
      >
        <Link
          href="/"
          onClick={onClose}
          className="flex items-center gap-2 text-lg font-semibold tracking-tight text-primary transition-opacity hover:opacity-80"
          aria-label="Planner — go to dashboard"
        >
          {isCollapsed ? (
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 text-sm font-bold">
              P
            </span>
          ) : (
            <span>Planner</span>
          )}
        </Link>
        {onClose && !isCollapsed && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-sidebar-foreground/60 transition-colors hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav
        className={cn(
          "flex-1 space-y-0.5 p-3",
          isCollapsed ? "px-2" : "",
        )}
      >
        {navItems.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              aria-label={isCollapsed ? item.label : undefined}
              title={isCollapsed ? item.label : undefined}
              className={cn(
                "group relative flex items-center rounded-lg text-[13px] font-medium transition-all duration-150 ease-out",
                isCollapsed
                  ? "h-10 justify-center"
                  : "gap-3 px-3 py-2",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
              )}
            >
              {/* Left accent bar — only in expanded state */}
              {!isCollapsed && (
                <span
                  className={cn(
                    "absolute left-0 top-1/2 h-5 w-[3px] -translate-x-[11px] -translate-y-1/2 rounded-r-full bg-gradient-to-b from-primary to-primary/70 transition-all duration-200 ease-out",
                    isActive ? "opacity-100 scale-y-100" : "opacity-0 scale-y-0",
                  )}
                />
              )}

              <item.icon
                className={cn(
                  "h-4 w-4 shrink-0 transition-colors",
                  isActive ? "text-primary" : "",
                )}
              />

              {/* Label — animated out when collapsed */}
              <span
                className={cn(
                  "overflow-hidden whitespace-nowrap transition-[max-width,opacity] duration-200 ease-out",
                  isCollapsed
                    ? "max-w-0 opacity-0"
                    : "max-w-[140px] opacity-100",
                )}
              >
                {item.label}
              </span>

              {/* Custom tooltip for collapsed state */}
              {isCollapsed && (
                <span
                  role="tooltip"
                  className="pointer-events-none absolute left-full ml-3 whitespace-nowrap rounded-md border border-border/60 bg-popover/95 px-2 py-1 text-xs font-medium text-popover-foreground opacity-0 shadow-md backdrop-blur-sm transition-opacity duration-150 group-hover:opacity-100 group-focus:opacity-100 z-50"
                >
                  {item.label}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Toggle — only visible on desktop (not in mobile sheet) */}
      {!forceExpanded && (
        <div
          className={cn(
            "border-t border-sidebar-border p-2",
            isCollapsed ? "flex justify-center" : "",
          )}
        >
          <button
            onClick={toggle}
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-expanded={!isCollapsed}
            title={`${isCollapsed ? "Expand" : "Collapse"} sidebar (⌘\\)`}
            className={cn(
              "group flex items-center gap-2 rounded-lg text-[12px] font-medium text-sidebar-foreground/55 transition-colors duration-150 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
              isCollapsed ? "h-9 w-9 justify-center" : "w-full px-3 py-2",
            )}
          >
            {isCollapsed ? (
              <PanelLeftOpen className="h-4 w-4 shrink-0" />
            ) : (
              <PanelLeftClose className="h-4 w-4 shrink-0" />
            )}
            <span
              className={cn(
                "overflow-hidden whitespace-nowrap transition-[max-width,opacity] duration-200 ease-out",
                isCollapsed ? "max-w-0 opacity-0" : "max-w-[120px] opacity-100",
              )}
            >
              Collapse
            </span>
            {!isCollapsed && (
              <kbd className="ml-auto text-[10px] font-medium text-muted-foreground">
                ⌘\
              </kbd>
            )}
          </button>
        </div>
      )}
    </aside>
  );
}

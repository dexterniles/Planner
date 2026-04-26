"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Calendar,
  GraduationCap,
  FolderKanban,
  PartyPopper,
  Wallet,
  Film,
  ChefHat,
  LogOut,
  Settings,
  PanelLeftClose,
  PanelLeftOpen,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSidebar } from "./sidebar-context";
import pkg from "../../package.json";

const navItems = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Calendar", href: "/calendar", icon: Calendar },
  { label: "Academic", href: "/academic", icon: GraduationCap },
  { label: "Projects", href: "/projects", icon: FolderKanban },
  { label: "Events", href: "/events", icon: PartyPopper },
  { label: "Bills", href: "/bills", icon: Wallet },
  { label: "TV & Movies", href: "/movies", icon: Film },
  { label: "Recipes", href: "/recipes", icon: ChefHat },
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
        ready ? "transition-[width] duration-300 ease-out" : "",
        isCollapsed ? "w-16" : forceExpanded ? "w-full" : "w-56",
      )}
    >
      {/* Brand */}
      <div
        className={cn(
          "flex h-14 shrink-0 items-center border-b border-sidebar-border/60",
          isCollapsed ? "justify-center px-0" : "px-5",
          onClose && !isCollapsed ? "justify-between" : "",
        )}
      >
        <Link
          href="/"
          onClick={onClose}
          className="flex items-center gap-2.5 transition-opacity hover:opacity-80"
          aria-label="Planner — go to dashboard"
        >
          <Image
            src="/brand-icon.png"
            alt=""
            width={22}
            height={22}
            priority
            className="h-[22px] w-[22px] shrink-0 rounded-[5px]"
          />
          {!isCollapsed && (
            <span className="font-serif text-[18px] leading-none tracking-tight text-sidebar-foreground">
              Planner
            </span>
          )}
        </Link>
        {onClose && !isCollapsed && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="flex h-8 w-8 items-center justify-center rounded-md text-sidebar-foreground/60 transition-colors hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav
        className={cn(
          "flex-1 overflow-y-auto py-3.5",
          isCollapsed ? "px-2" : "px-2.5",
        )}
      >
        {!isCollapsed && (
          <div className="px-3 pt-1 pb-2 text-[10.5px] font-medium uppercase tracking-[0.12em] text-sidebar-foreground/45">
            Workspace
          </div>
        )}
        <div className="space-y-0.5">
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
                  "group relative flex items-center rounded-md text-[13.5px] font-medium transition-colors duration-150 ease-out",
                  isCollapsed
                    ? "h-9 justify-center"
                    : "gap-3 px-3 py-[7px]",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
                )}
              >
                {/* Left accent pip — expanded state only */}
                {!isCollapsed && (
                  <span
                    className={cn(
                      "absolute top-2 bottom-2 w-0.5 rounded-r bg-primary transition-opacity duration-150",
                      isActive ? "opacity-100" : "opacity-0",
                    )}
                    style={{ left: "-10px" }}
                  />
                )}

                <item.icon
                  className={cn(
                    "h-4 w-4 shrink-0 transition-colors",
                    isActive ? "opacity-100" : "opacity-80",
                  )}
                  strokeWidth={1.75}
                />

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
        </div>
      </nav>

      {/* Foot */}
      {!forceExpanded && (
        <div
          className={cn(
            "flex items-center gap-1 border-t border-sidebar-border/60 p-2.5",
            isCollapsed ? "justify-center" : "",
          )}
        >
          <button
            onClick={toggle}
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-expanded={!isCollapsed}
            title={`${isCollapsed ? "Expand" : "Collapse"} sidebar (⌘\\)`}
            className="flex h-7 w-7 items-center justify-center rounded-md text-sidebar-foreground/55 transition-colors duration-150 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
          >
            {isCollapsed ? (
              <PanelLeftOpen className="h-[15px] w-[15px]" strokeWidth={1.75} />
            ) : (
              <PanelLeftClose className="h-[15px] w-[15px]" strokeWidth={1.75} />
            )}
          </button>
          <a
            href="/api/auth/logout"
            aria-label="Sign out"
            title="Sign out"
            className="flex h-7 w-7 items-center justify-center rounded-md text-sidebar-foreground/55 transition-colors duration-150 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
          >
            <LogOut className="h-[15px] w-[15px]" strokeWidth={1.75} />
          </a>
          {!isCollapsed && (
            <span className="ml-auto font-mono text-[10.5px] text-sidebar-foreground/40">
              v{pkg.version}
            </span>
          )}
        </div>
      )}
    </aside>
  );
}

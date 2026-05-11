"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  Calendar,
  GraduationCap,
  FolderKanban,
  PartyPopper,
  Wallet,
  LogOut,
  Settings,
  PanelLeftClose,
  PanelLeftOpen,
  X,
  Search,
  PenSquare,
  ChevronDown,
  ChevronRight,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSidebar } from "./sidebar-context";
import { useSearchPalette } from "./search-palette-context";
import { useCapture } from "./global-capture";

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

const PRIMARY_NAV: NavItem[] = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Calendar", href: "/calendar", icon: Calendar },
  { label: "Bills", href: "/bills", icon: Wallet },
];

const WORKSPACE_NAV: NavItem[] = [
  { label: "Academic", href: "/academic", icon: GraduationCap },
  { label: "Projects", href: "/projects", icon: FolderKanban },
  { label: "Events", href: "/events", icon: PartyPopper },
];

interface SidebarProps {
  forceExpanded?: boolean;
  onClose?: () => void;
}

function readSectionExpanded(name: string, fallback = true): boolean {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(`planner:sidebar:section:${name}`);
    if (raw === null) return fallback;
    return raw === "true";
  } catch {
    return fallback;
  }
}

function writeSectionExpanded(name: string, value: boolean) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      `planner:sidebar:section:${name}`,
      String(value),
    );
  } catch {
    /* ignore */
  }
}

interface NavRowProps {
  item: NavItem;
  isCollapsed: boolean;
  isActive: boolean;
  onClick?: () => void;
}

function NavRow({ item, isCollapsed, isActive, onClick }: NavRowProps) {
  return (
    <Link
      href={item.href}
      onClick={onClick}
      aria-label={isCollapsed ? item.label : undefined}
      aria-current={isActive ? "page" : undefined}
      title={isCollapsed ? item.label : undefined}
      className={cn(
        "group relative flex items-center rounded-md text-[13px] font-medium transition-colors duration-150 ease-out",
        isCollapsed ? "h-7 w-7 mx-auto justify-center" : "h-7 gap-2 px-2",
        isActive
          ? "bg-muted text-foreground"
          : "text-muted-foreground hover:bg-muted hover:text-foreground",
      )}
    >
      <item.icon
        className={cn(
          "h-4 w-4 shrink-0 transition-colors",
          isActive ? "text-foreground" : "text-muted-foreground",
        )}
        strokeWidth={1.75}
      />
      {!isCollapsed && (
        <span className="truncate">{item.label}</span>
      )}
      {isCollapsed && (
        <span
          role="tooltip"
          className="pointer-events-none absolute left-full ml-2 whitespace-nowrap rounded-md border border-border/60 bg-popover/95 px-2 py-1 text-xs font-medium text-popover-foreground opacity-0 shadow-md backdrop-blur-sm transition-opacity duration-150 group-hover:opacity-100 group-focus:opacity-100 z-50"
        >
          {item.label}
        </span>
      )}
    </Link>
  );
}

interface SectionGroupProps {
  name: string;
  label: string;
  items: NavItem[];
  pathname: string;
  isCollapsed: boolean;
  onClose?: () => void;
}

function SectionGroup({
  name,
  label,
  items,
  pathname,
  isCollapsed,
  onClose,
}: SectionGroupProps) {
  const [expanded, setExpanded] = useState<boolean>(() =>
    readSectionExpanded(name, true),
  );

  const toggle = () => {
    setExpanded((prev) => {
      const next = !prev;
      writeSectionExpanded(name, next);
      return next;
    });
  };

  if (isCollapsed) {
    return (
      <div className="mt-2 space-y-0.5">
        {items.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <NavRow
              key={item.href}
              item={item}
              isCollapsed
              isActive={isActive}
              onClick={onClose}
            />
          );
        })}
      </div>
    );
  }

  return (
    <div className="mt-3">
      <button
        type="button"
        onClick={toggle}
        aria-expanded={expanded}
        className="flex w-full items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground/80 transition-colors hover:text-foreground"
      >
        {expanded ? (
          <ChevronDown className="h-3 w-3 shrink-0" strokeWidth={2} />
        ) : (
          <ChevronRight className="h-3 w-3 shrink-0" strokeWidth={2} />
        )}
        <span>{label}</span>
      </button>
      {expanded && (
        <div className="mt-0.5 space-y-0.5">
          {items.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <NavRow
                key={item.href}
                item={item}
                isCollapsed={false}
                isActive={isActive}
                onClick={onClose}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

export function Sidebar({ forceExpanded = false, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { collapsed, toggle, ready } = useSidebar();
  const { setOpen: setSearchOpen } = useSearchPalette();
  const { openCapture } = useCapture();
  const isCollapsed = forceExpanded ? false : collapsed;

  const handleSearch = () => {
    onClose?.();
    setSearchOpen(true);
  };

  const handleCompose = () => {
    onClose?.();
    openCapture();
  };

  return (
    <aside
      className={cn(
        "flex h-full flex-col border-r border-sidebar-border bg-sidebar",
        ready ? "transition-[width] duration-300 ease-out" : "",
        isCollapsed ? "w-14" : forceExpanded ? "w-full" : "w-60",
      )}
    >
      <div
        className={cn(
          "flex shrink-0 items-center px-2 pt-3",
          isCollapsed ? "flex-col gap-1.5" : "gap-1",
        )}
      >
        {!isCollapsed ? (
          <>
            <Link
              href="/"
              onClick={onClose}
              className="flex h-7 min-w-0 flex-1 items-center gap-1.5 rounded-md px-1.5 text-[13px] font-medium text-foreground transition-colors hover:bg-muted"
              aria-label="Planner — go to dashboard"
            >
              <Image
                src="/brand-icon.png"
                alt=""
                width={16}
                height={16}
                priority
                className="h-4 w-4 shrink-0"
              />
              <span className="truncate">Planner</span>
            </Link>
            <button
              type="button"
              onClick={handleSearch}
              aria-label="Search (⌘K)"
              title="Search (⌘K)"
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <Search className="h-4 w-4" strokeWidth={1.75} />
            </button>
            <button
              type="button"
              onClick={handleCompose}
              aria-label="Quick capture (n)"
              title="Quick capture (n)"
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <PenSquare className="h-4 w-4" strokeWidth={1.75} />
            </button>
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                aria-label="Close menu"
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </>
        ) : (
          <>
            <Link
              href="/"
              onClick={onClose}
              className="flex h-7 w-7 items-center justify-center rounded-md transition-colors hover:bg-muted"
              aria-label="Planner — go to dashboard"
            >
              <Image
                src="/brand-icon.png"
                alt=""
                width={16}
                height={16}
                priority
                className="h-4 w-4"
              />
            </Link>
            <button
              type="button"
              onClick={handleSearch}
              aria-label="Search (⌘K)"
              title="Search (⌘K)"
              className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <Search className="h-4 w-4" strokeWidth={1.75} />
            </button>
            <button
              type="button"
              onClick={handleCompose}
              aria-label="Quick capture (n)"
              title="Quick capture (n)"
              className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <PenSquare className="h-4 w-4" strokeWidth={1.75} />
            </button>
          </>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto px-2 pt-4">
        <div className="space-y-0.5">
          {PRIMARY_NAV.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            return (
              <NavRow
                key={item.href}
                item={item}
                isCollapsed={isCollapsed}
                isActive={isActive}
                onClick={onClose}
              />
            );
          })}
        </div>

        <SectionGroup
          name="workspace"
          label="Workspace"
          items={WORKSPACE_NAV}
          pathname={pathname}
          isCollapsed={isCollapsed}
          onClose={onClose}
        />
      </nav>

      {!forceExpanded && (
        <div
          className={cn(
            "flex items-center gap-1 border-t border-sidebar-border/60 p-2",
            isCollapsed ? "flex-col" : "",
          )}
        >
          <Link
            href="/settings"
            aria-label="Settings"
            title="Settings"
            aria-current={pathname.startsWith("/settings") ? "page" : undefined}
            className={cn(
              "flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors duration-150 hover:bg-muted hover:text-foreground",
              pathname.startsWith("/settings") && "bg-muted text-foreground",
            )}
            onClick={onClose}
          >
            <Settings className="h-4 w-4" strokeWidth={1.75} />
          </Link>
          <button
            type="button"
            onClick={toggle}
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-expanded={!isCollapsed}
            title={`${isCollapsed ? "Expand" : "Collapse"} sidebar (⌘\\)`}
            className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors duration-150 hover:bg-muted hover:text-foreground"
          >
            {isCollapsed ? (
              <PanelLeftOpen className="h-4 w-4" strokeWidth={1.75} />
            ) : (
              <PanelLeftClose className="h-4 w-4" strokeWidth={1.75} />
            )}
          </button>
          <a
            href="/api/auth/logout"
            aria-label="Sign out"
            title="Sign out"
            className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors duration-150 hover:bg-muted hover:text-foreground"
          >
            <LogOut className="h-4 w-4" strokeWidth={1.75} />
          </a>
          {!isCollapsed && (
            <span className="ml-auto font-mono text-[10.5px] text-muted-foreground/50">
              v{process.env.NEXT_PUBLIC_APP_VERSION}
            </span>
          )}
        </div>
      )}
    </aside>
  );
}

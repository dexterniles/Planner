"use client";

import { useState } from "react";
import { Menu, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet";
import { ThemeToggle } from "./theme-toggle";
import { ActiveTimer } from "./timer";
import { Sidebar } from "./sidebar";
import { GlobalCapture } from "./global-capture";
import { useSearchPalette } from "./search-palette-context";
import { useCurrentDate } from "@/lib/hooks/use-current-date";

export function Topbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { setOpen } = useSearchPalette();

  const openSearch = () => {
    setOpen(true);
  };

  const today = useCurrentDate();
  const dateLabel = today.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <header className="sticky top-0 z-30 shrink-0 border-b border-border bg-card safe-top">
      <div className="flex h-14 items-center gap-3 px-3 sm:gap-3.5 sm:px-6">
        <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
          <SheetTrigger
            render={<Button variant="ghost" size="icon" className="md:hidden" />}
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle menu</span>
          </SheetTrigger>
          <SheetContent
            side="left"
            showCloseButton={false}
            className="p-0 safe-top safe-bottom"
          >
            <SheetTitle className="sr-only">Navigation</SheetTitle>
            <Sidebar forceExpanded onClose={() => setMenuOpen(false)} />
          </SheetContent>
        </Sheet>

        {/* Mobile: icon-only search */}
        <Button
          onClick={openSearch}
          variant="ghost"
          size="icon"
          aria-label="Open search"
          className="sm:hidden"
        >
          <Search className="h-4 w-4" />
        </Button>

        {/* Desktop: search pill */}
        <button
          onClick={openSearch}
          aria-label="Open search palette (Cmd+K)"
          className="hidden sm:flex flex-1 max-w-[460px] items-center gap-2.5 rounded-md border border-border bg-card px-3 py-[7px] text-[13px] text-muted-foreground shadow-sm transition-colors hover:border-muted-foreground/40 hover:bg-muted/40"
        >
          <Search className="h-[14px] w-[14px]" aria-hidden="true" strokeWidth={1.75} />
          <span>Jump to anything…</span>
          <kbd className="ml-auto inline-flex items-center rounded border border-border bg-background px-1.5 py-px font-mono text-[10.5px] font-medium">
            &#8984;K
          </kbd>
        </button>

        {/* Spacer on mobile to push right-side items */}
        <div className="flex-1 sm:hidden" />

        {/* Right cluster */}
        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          <GlobalCapture />
          <ActiveTimer />
          <div
            className="hidden lg:flex items-baseline gap-2 border-l border-border py-1 pl-3 font-serif text-[14.5px] text-muted-foreground"
            suppressHydrationWarning
          >
            <span>Today is</span>
            <span className="tabular-nums font-medium text-foreground">
              {dateLabel}
            </span>
          </div>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}

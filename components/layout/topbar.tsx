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

export function Topbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  const openSearch = () => {
    document.dispatchEvent(
      new KeyboardEvent("keydown", { key: "k", metaKey: true }),
    );
  };

  return (
    <header
      className="sticky top-0 z-30 border-b border-border/60 bg-background/60 backdrop-blur-xl backdrop-saturate-150 supports-[backdrop-filter]:bg-background/50 safe-top"
    >
      <div className="flex h-12 items-center gap-2 px-3 sm:px-4 sm:gap-4">
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

        {/* Mobile: icon-only search button */}
        <Button
          onClick={openSearch}
          variant="ghost"
          size="icon"
          aria-label="Open search"
          className="sm:hidden"
        >
          <Search className="h-4 w-4" />
        </Button>

        {/* Desktop: wide search bar */}
        <div className="hidden sm:flex flex-1 justify-center">
          <button
            onClick={openSearch}
            aria-label="Open search palette (Cmd+K)"
            className="flex w-full max-w-md items-center gap-2 rounded-lg border bg-muted/50 px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted transition-colors"
          >
            <Search className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Search...</span>
            <kbd className="ml-auto inline-flex h-5 items-center gap-0.5 rounded border bg-background px-1.5 text-[10px] font-medium">
              &#8984;K
            </kbd>
          </button>
        </div>

        {/* Spacer to push timer + theme right on mobile */}
        <div className="flex-1 sm:hidden" />

        <ActiveTimer />
        <ThemeToggle />
      </div>
    </header>
  );
}

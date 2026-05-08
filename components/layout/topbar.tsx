"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ThemeToggle } from "./theme-toggle";
import { ActiveTimer } from "./timer";
import { Sidebar } from "./sidebar";
import { GlobalCapture } from "./global-capture";
import { PageShortcuts } from "./page-shortcuts";

export function Topbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 shrink-0 border-b border-border/60 bg-background safe-top">
      <div className="flex h-12 items-center gap-2 px-3 sm:px-4">
        <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
          <SheetTrigger
            render={<Button variant="ghost" size="icon-sm" className="md:hidden" />}
          >
            <Menu className="h-4 w-4" />
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

        <div className="flex-1" />

        <div className="ml-auto flex items-center gap-1.5">
          <ActiveTimer />
          <GlobalCapture />
          <ThemeToggle />
          <Link
            href="/settings"
            aria-label="Settings"
            className="flex h-7 w-7 items-center justify-center rounded-full transition-opacity hover:opacity-80"
          >
            <Avatar className="h-6 w-6">
              <AvatarFallback className="text-[10px]">D</AvatarFallback>
            </Avatar>
          </Link>
        </div>
      </div>
      <PageShortcuts />
    </header>
  );
}

"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useSearchPalette } from "./search-palette-context";
import { useCapture } from "./global-capture";
import { useActiveTimer, useStopTimer } from "@/lib/hooks/use-time-logs";
import { ShortcutsHelp } from "./shortcuts-help";

const PREFIX_TIMEOUT_MS = 700;

const NAV_MAP: Record<string, string> = {
  d: "/",
  c: "/calendar",
  p: "/projects",
  a: "/academic",
  r: "/recipes",
  m: "/movies",
  b: "/bills",
  e: "/events",
};

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  if (target.isContentEditable) return true;
  return false;
}

function isInsideDialog(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    // Defense: also check active element.
    const active = document.activeElement;
    if (active instanceof HTMLElement) {
      return Boolean(active.closest('[role="dialog"]'));
    }
    return false;
  }
  return Boolean(target.closest('[role="dialog"]'));
}

export function PageShortcuts() {
  const router = useRouter();
  const pathname = usePathname();
  const { setOpen: setPaletteOpen } = useSearchPalette();
  const { open: captureOpen, openCapture } = useCapture();
  const { data: activeTimer } = useActiveTimer();
  const stopTimer = useStopTimer();
  const [helpOpen, setHelpOpen] = useState(false);

  const prefixRef = useRef<{ active: boolean; timer: ReturnType<typeof setTimeout> | null }>({
    active: false,
    timer: null,
  });
  const pathnameRef = useRef(pathname);
  const activeTimerRef = useRef(activeTimer);
  const helpOpenRef = useRef(helpOpen);
  const captureOpenRef = useRef(captureOpen);

  useEffect(() => {
    pathnameRef.current = pathname;
  }, [pathname]);
  useEffect(() => {
    activeTimerRef.current = activeTimer;
  }, [activeTimer]);
  useEffect(() => {
    helpOpenRef.current = helpOpen;
  }, [helpOpen]);
  useEffect(() => {
    captureOpenRef.current = captureOpen;
  }, [captureOpen]);

  const clearPrefix = useCallback(() => {
    if (prefixRef.current.timer) {
      clearTimeout(prefixRef.current.timer);
      prefixRef.current.timer = null;
    }
    prefixRef.current.active = false;
  }, []);

  const focusPageSearch = useCallback(() => {
    const el = document.querySelector<HTMLInputElement>("input[data-page-search]");
    if (el) {
      el.focus();
      el.select();
      return true;
    }
    return false;
  }, []);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      // If the help overlay is open, let the dialog manage its own keys.
      if (helpOpenRef.current) return;
      // Capture popover doesn't get role="dialog" — bail explicitly so shortcuts
      // don't fire when the user has tabbed off the textarea (e.g. to Save).
      if (captureOpenRef.current) return;

      // Bail when typing or inside a modal.
      if (isTypingTarget(event.target)) return;
      if (isInsideDialog(event.target)) return;

      // `?` requires Shift+/ — handle before the modifier bail since it relies on Shift.
      if (event.key === "?") {
        event.preventDefault();
        clearPrefix();
        setHelpOpen(true);
        return;
      }

      // Bail on modifiers for plain letters.
      if (event.metaKey || event.ctrlKey || event.altKey) return;

      const key = event.key;

      // Handle the second key of a `g` prefix.
      if (prefixRef.current.active) {
        const lower = key.toLowerCase();
        const target = NAV_MAP[lower];
        clearPrefix();
        if (target) {
          event.preventDefault();
          router.push(target);
        }
        return;
      }

      // Start a `g` prefix.
      if (key === "g") {
        event.preventDefault();
        prefixRef.current.active = true;
        if (prefixRef.current.timer) clearTimeout(prefixRef.current.timer);
        prefixRef.current.timer = setTimeout(() => {
          prefixRef.current.active = false;
          prefixRef.current.timer = null;
        }, PREFIX_TIMEOUT_MS);
        return;
      }

      // Single-key actions.
      switch (key) {
        case "n":
        case "i":
          event.preventDefault();
          openCapture();
          return;
        case "/": {
          event.preventDefault();
          const focused = focusPageSearch();
          if (!focused) {
            setPaletteOpen(true);
          }
          return;
        }
        case "t": {
          event.preventDefault();
          const timer = activeTimerRef.current;
          if (timer && timer.id) {
            stopTimer.mutate({ id: timer.id });
          }
          return;
        }
      }
    };

    document.addEventListener("keydown", handler);
    const prefixState = prefixRef.current;
    return () => {
      document.removeEventListener("keydown", handler);
      if (prefixState.timer) {
        clearTimeout(prefixState.timer);
        prefixState.timer = null;
      }
    };
  }, [clearPrefix, focusPageSearch, openCapture, router, setPaletteOpen, stopTimer]);

  return <ShortcutsHelp open={helpOpen} onOpenChange={setHelpOpen} />;
}

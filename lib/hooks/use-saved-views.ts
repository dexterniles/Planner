"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export interface SavedView {
  id: string;
  name: string;
  query: string;
}

const STORAGE_PREFIX = "planner:saved-views:";

function storageKey(routeKey: string) {
  return `${STORAGE_PREFIX}${routeKey}`;
}

function readViews(routeKey: string): SavedView[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(storageKey(routeKey));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (v): v is SavedView =>
        v &&
        typeof v === "object" &&
        typeof v.id === "string" &&
        typeof v.name === "string" &&
        typeof v.query === "string",
    );
  } catch {
    return [];
  }
}

function writeViews(routeKey: string, views: SavedView[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(storageKey(routeKey), JSON.stringify(views));
  } catch {
    // Quota exceeded or storage unavailable — fail silently.
  }
}

function generateId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function useSavedViews(routeKey: string) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [views, setViews] = useState<SavedView[]>([]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- read localStorage post-hydration
    setViews(readViews(routeKey));
  }, [routeKey]);

  // Sync across tabs / windows.
  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === storageKey(routeKey)) {
        setViews(readViews(routeKey));
      }
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, [routeKey]);

  const persist = useCallback(
    (next: SavedView[]) => {
      setViews(next);
      writeViews(routeKey, next);
    },
    [routeKey],
  );

  const saveCurrentView = useCallback(
    (name: string): SavedView | null => {
      const trimmed = name.trim();
      if (!trimmed) return null;
      const query = searchParams.toString();
      if (!query) return null;
      const view: SavedView = { id: generateId(), name: trimmed, query };
      persist([...views, view]);
      return view;
    },
    [searchParams, views, persist],
  );

  const deleteView = useCallback(
    (id: string) => {
      persist(views.filter((v) => v.id !== id));
    },
    [views, persist],
  );

  const applyView = useCallback(
    (id: string) => {
      const view = views.find((v) => v.id === id);
      if (!view) return;
      router.replace(
        view.query ? `${pathname}?${view.query}` : pathname,
        { scroll: false },
      );
    },
    [views, router, pathname],
  );

  const currentQuery = searchParams.toString();
  const activeViewId =
    currentQuery.length > 0
      ? views.find((v) => v.query === currentQuery)?.id ?? null
      : null;

  return {
    views,
    saveCurrentView,
    deleteView,
    applyView,
    currentQuery,
    activeViewId,
  };
}

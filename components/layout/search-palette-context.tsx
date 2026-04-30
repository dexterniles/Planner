"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
} from "react";

export type QuickCreateType = "task" | "event" | "note";

export interface PendingQuickCreate {
  type: QuickCreateType;
  title: string;
  /** epoch ms — used so consumers can detect repeated triggers with the same title */
  requestedAt: number;
}

interface SearchPaletteContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
  toggle: () => void;
  pendingQuickCreate: PendingQuickCreate | null;
  requestQuickCreate: (type: QuickCreateType, title: string) => void;
  consumeQuickCreate: () => void;
}

const SearchPaletteContext = createContext<SearchPaletteContextValue | null>(
  null,
);

export function SearchPaletteProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [pendingQuickCreate, setPendingQuickCreate] =
    useState<PendingQuickCreate | null>(null);

  const toggle = useCallback(() => {
    setOpen((prev) => !prev);
  }, []);

  const requestQuickCreate = useCallback(
    (type: QuickCreateType, title: string) => {
      setPendingQuickCreate({ type, title, requestedAt: Date.now() });
    },
    [],
  );

  const consumeQuickCreate = useCallback(() => {
    setPendingQuickCreate(null);
  }, []);

  return (
    <SearchPaletteContext.Provider
      value={{
        open,
        setOpen,
        toggle,
        pendingQuickCreate,
        requestQuickCreate,
        consumeQuickCreate,
      }}
    >
      {children}
    </SearchPaletteContext.Provider>
  );
}

export function useSearchPalette() {
  const ctx = useContext(SearchPaletteContext);
  if (!ctx) {
    throw new Error(
      "useSearchPalette must be used within SearchPaletteProvider",
    );
  }
  return ctx;
}

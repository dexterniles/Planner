"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
} from "react";

interface SearchPaletteContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
  toggle: () => void;
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

  const toggle = useCallback(() => {
    setOpen((prev) => !prev);
  }, []);

  return (
    <SearchPaletteContext.Provider value={{ open, setOpen, toggle }}>
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

"use client";

import {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export interface ConfirmOptions {
  title: string;
  description?: ReactNode;
  /** Default: "Confirm" — or "Delete" when destructive. */
  confirmLabel?: string;
  /** Default: "Cancel". */
  cancelLabel?: string;
  /** When true, the confirm button uses the destructive style. */
  destructive?: boolean;
}

type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn | null>(null);

/**
 * Wrap the app in this provider, then call `useConfirm()` anywhere to get
 * an async, theme-aware replacement for `window.confirm`.
 */
export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [opts, setOpts] = useState<ConfirmOptions | null>(null);
  const resolverRef = useRef<((value: boolean) => void) | null>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

  const confirm = useCallback<ConfirmFn>((options) => {
    previouslyFocusedRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    setOpts(options);
    setOpen(true);
    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve;
    });
  }, []);

  const settle = (result: boolean) => {
    resolverRef.current?.(result);
    resolverRef.current = null;
    setOpen(false);
    const target = previouslyFocusedRef.current;
    previouslyFocusedRef.current = null;
    if (target) {
      requestAnimationFrame(() => target.focus());
    }
  };

  const destructive = opts?.destructive ?? false;
  const confirmLabel = opts?.confirmLabel ?? (destructive ? "Delete" : "Confirm");

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <Dialog open={open} onOpenChange={(o) => !o && settle(false)}>
        <DialogContent showCloseButton={false} className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>{opts?.title ?? ""}</DialogTitle>
            {opts?.description && (
              <DialogDescription>{opts.description}</DialogDescription>
            )}
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => settle(false)}>
              {opts?.cancelLabel ?? "Cancel"}
            </Button>
            <Button
              variant={destructive ? "destructive" : "default"}
              onClick={() => settle(true)}
              autoFocus
            >
              {confirmLabel}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ConfirmContext.Provider>
  );
}

export function useConfirm(): ConfirmFn {
  const ctx = useContext(ConfirmContext);
  if (!ctx) {
    throw new Error("useConfirm must be used inside <ConfirmProvider />");
  }
  return ctx;
}

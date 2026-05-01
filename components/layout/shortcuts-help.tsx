"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ShortcutsHelpProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface Shortcut {
  keys: string[];
  description: string;
}

const NAVIGATION: Shortcut[] = [
  { keys: ["g", "d"], description: "Go to Dashboard" },
  { keys: ["g", "c"], description: "Go to Calendar" },
  { keys: ["g", "p"], description: "Go to Projects" },
  { keys: ["g", "a"], description: "Go to Academic" },
  { keys: ["g", "r"], description: "Go to Recipes" },
  { keys: ["g", "m"], description: "Go to TV & Movies" },
  { keys: ["g", "b"], description: "Go to Bills" },
  { keys: ["g", "e"], description: "Go to Events" },
];

const ACTIONS: Shortcut[] = [
  { keys: ["n"], description: "New capture (inbox)" },
  { keys: ["i"], description: "Open inbox capture" },
  { keys: ["/"], description: "Focus page search" },
  { keys: ["t"], description: "Stop active timer" },
  { keys: ["⌘", "K"], description: "Open search palette" },
  { keys: ["?"], description: "Show this overlay" },
];

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex min-w-[1.5rem] items-center justify-center rounded border border-border bg-background px-1.5 py-px font-mono text-[10.5px] font-medium text-muted-foreground">
      {children}
    </kbd>
  );
}

function Row({ shortcut }: { shortcut: Shortcut }) {
  return (
    <div className="flex items-center justify-between gap-4 py-1.5 text-[13px]">
      <span className="text-foreground">{shortcut.description}</span>
      <span className="flex items-center gap-1">
        {shortcut.keys.map((k, i) => (
          <span key={i} className="flex items-center gap-1">
            {i > 0 && shortcut.keys.length > 1 && shortcut.keys[0] !== "⌘" && (
              <span className="text-[10.5px] text-muted-foreground">then</span>
            )}
            <Kbd>{k}</Kbd>
          </span>
        ))}
      </span>
    </div>
  );
}

export function ShortcutsHelp({ open, onOpenChange }: ShortcutsHelpProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Keyboard shortcuts</DialogTitle>
          <DialogDescription>
            Press Esc to close.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <section>
            <h3 className="mb-1.5 text-[10.5px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
              Navigation
            </h3>
            <div className="divide-y divide-border/60">
              {NAVIGATION.map((s) => (
                <Row key={s.keys.join("-")} shortcut={s} />
              ))}
            </div>
          </section>
          <section>
            <h3 className="mb-1.5 text-[10.5px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
              Actions
            </h3>
            <div className="divide-y divide-border/60">
              {ACTIONS.map((s) => (
                <Row key={s.keys.join("-")} shortcut={s} />
              ))}
            </div>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}

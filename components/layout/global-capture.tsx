"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { CalendarClock, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { useCreateInboxItem } from "@/lib/hooks/use-inbox";
import { parseDate } from "@/lib/parse-date";

interface CaptureContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
  openCapture: () => void;
}

const CaptureContext = createContext<CaptureContextValue | null>(null);

export function CaptureProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  const openCapture = useCallback(() => {
    setOpen(true);
  }, []);

  const value = useMemo(
    () => ({ open, setOpen, openCapture }),
    [open, openCapture],
  );

  return (
    <CaptureContext.Provider value={value}>{children}</CaptureContext.Provider>
  );
}

export function useCapture() {
  const ctx = useContext(CaptureContext);
  if (!ctx) {
    throw new Error("useCapture must be used within CaptureProvider");
  }
  return ctx;
}

export function GlobalCapture() {
  const { open, setOpen } = useCapture();
  const [text, setText] = useState("");
  const createInboxItem = useCreateInboxItem();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const parsed = useMemo(() => parseDate(text), [text]);

  useEffect(() => {
    if (open) {
      setTimeout(() => textareaRef.current?.focus(), 50);
      return;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reset textarea when popover closes
    setText("");
  }, [open]);

  const save = async () => {
    const content = text.trim();
    if (!content) return;
    try {
      await createInboxItem.mutateAsync({ content });
      toast.success("Captured");
      setOpen(false);
    } catch {
      toast.error("Failed to capture");
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            variant="outline"
            size="sm"
            aria-label="Quick capture"
            className="gap-1.5"
          />
        }
      >
        <Plus className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Capture</span>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80">
        <Textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              setOpen(false);
            }
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              save();
            }
          }}
          placeholder="Capture anything…"
          rows={3}
          className="resize-none"
        />
        {parsed && (
          <div className="flex items-center gap-1.5 text-xs text-primary">
            <CalendarClock className="h-3 w-3" />
            <span>Detected: {parsed.preview}</span>
          </div>
        )}
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-muted-foreground">
            Esc to close
          </span>
          <Button
            size="sm"
            onClick={save}
            disabled={!text.trim() || createInboxItem.isPending}
          >
            Save
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

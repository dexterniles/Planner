import { cn } from "@/lib/utils";

interface StatusDotProps {
  tone: "primary" | "success" | "warning" | "danger" | "muted";
  size?: "xs" | "sm";
  pulse?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

const TONE_CLASS: Record<StatusDotProps["tone"], string> = {
  primary: "bg-primary",
  success: "bg-chart-2",
  warning: "bg-chart-3",
  danger: "bg-destructive",
  muted: "bg-muted-foreground/50",
};

export function StatusDot({
  tone,
  size = "sm",
  pulse = false,
  className,
  style,
}: StatusDotProps) {
  return (
    <span
      aria-hidden="true"
      style={style}
      className={cn(
        "inline-block shrink-0 rounded-full",
        size === "xs" ? "h-1.5 w-1.5" : "h-2 w-2",
        TONE_CLASS[tone],
        pulse && "animate-pulse",
        className,
      )}
    />
  );
}

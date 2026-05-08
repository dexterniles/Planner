import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { SectionHeader } from "@/components/ui/section-header";
import { cn } from "@/lib/utils";

interface DashboardSectionProps {
  label: string;
  count?: number | string;
  icon?: LucideIcon;
  action?: ReactNode;
  tone?: "default" | "danger";
  noTopBorder?: boolean;
  className?: string;
  children: ReactNode;
}

export function DashboardSection({
  label,
  count,
  icon,
  action,
  tone = "default",
  noTopBorder = false,
  className,
  children,
}: DashboardSectionProps) {
  return (
    <section
      className={cn(
        "border-t border-border/60 pt-4 pb-5 first:border-t-0 first:pt-0",
        noTopBorder && "border-t-0 pt-0",
        className,
      )}
    >
      <SectionHeader label={label} count={count} icon={icon} action={action} tone={tone} />
      {children}
    </section>
  );
}

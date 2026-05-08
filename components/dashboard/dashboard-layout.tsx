import type { ReactNode } from "react";

interface DashboardLayoutProps {
  main: ReactNode;
  rail: ReactNode;
}

export function DashboardLayout({ main, rail }: DashboardLayoutProps) {
  return (
    <div className="-mx-4 -mt-4 md:-mx-6 md:-mt-6 flex flex-col lg:flex-row lg:items-start">
      <div className="flex-1 min-w-0 mx-auto w-full max-w-[820px] px-4 py-4 sm:px-6">
        {main}
      </div>
      <aside className="w-full lg:w-[300px] lg:shrink-0 lg:sticky lg:top-0 lg:self-start py-4 px-4 lg:border-l lg:border-t-0 border-t border-border/60 lg:min-h-screen">
        {rail}
      </aside>
    </div>
  );
}

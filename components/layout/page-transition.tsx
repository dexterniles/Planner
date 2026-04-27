"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.classList.remove("page-transition");
    // Force a synchronous reflow so the class re-add restarts the CSS animation
    void el.offsetWidth;
    el.classList.add("page-transition");
  }, [pathname]);

  return (
    <div ref={ref} className="page-transition h-full">
      {children}
    </div>
  );
}

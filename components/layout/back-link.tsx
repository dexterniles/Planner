"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";

interface BackLinkProps {
  href: string;
  className?: string;
  children: ReactNode;
}

export function BackLink({ href, className, children }: BackLinkProps) {
  const router = useRouter();

  return (
    <Link
      href={href}
      className={className}
      onClick={(e) => {
        if (
          e.button !== 0 ||
          e.metaKey ||
          e.ctrlKey ||
          e.shiftKey ||
          e.altKey
        ) {
          return;
        }
        if (typeof window !== "undefined" && window.history.length > 1) {
          e.preventDefault();
          router.back();
        }
      }}
    >
      {children}
    </Link>
  );
}

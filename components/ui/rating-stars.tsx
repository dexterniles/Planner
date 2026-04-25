"use client";

import { useState } from "react";
import { Star } from "lucide-react";

interface RatingStarsProps {
  /** Current rating in 0.5 steps, 0–5. Use null for unrated. */
  value: number | null;
  /** Called with the new rating, or null when toggling off. */
  onChange?: (rating: number | null) => void;
  /** Visual size in pixels per star. */
  size?: number;
  /** Read-only mode for display. */
  readOnly?: boolean;
  /** Label for screen readers. */
  ariaLabel?: string;
  className?: string;
}

/**
 * 5-star rating with half-step precision. Hovering previews the value;
 * clicking commits. Click the same value again to clear.
 */
export function RatingStars({
  value,
  onChange,
  size = 18,
  readOnly = false,
  ariaLabel = "Rating",
  className = "",
}: RatingStarsProps) {
  const [hover, setHover] = useState<number | null>(null);
  const display = hover ?? value ?? 0;

  const handleClick = (star: number, isLeftHalf: boolean) => {
    if (readOnly || !onChange) return;
    const next = isLeftHalf ? star - 0.5 : star;
    // Click the same value twice → clear
    if (value === next) {
      onChange(null);
    } else {
      onChange(next);
    }
  };

  return (
    <span
      className={`inline-flex items-center gap-0.5 ${className}`}
      role="img"
      aria-label={`${ariaLabel}: ${value ?? "none"}`}
      onMouseLeave={() => setHover(null)}
    >
      {[1, 2, 3, 4, 5].map((star) => {
        // Each star renders as two clickable halves layered over a base star.
        const filled = display >= star;
        const half = !filled && display >= star - 0.5;
        return (
          <span
            key={star}
            className="relative inline-block"
            style={{ width: size, height: size }}
          >
            {/* Base outline star */}
            <Star
              className="absolute inset-0 text-muted-foreground/40"
              style={{ width: size, height: size }}
              strokeWidth={1.5}
            />
            {/* Filled overlay */}
            {(filled || half) && (
              <span
                className="absolute inset-0 overflow-hidden"
                style={{ width: half ? size / 2 : size }}
                aria-hidden="true"
              >
                <Star
                  className="text-primary"
                  fill="currentColor"
                  style={{ width: size, height: size }}
                  strokeWidth={1.5}
                />
              </span>
            )}
            {/* Click/hover targets */}
            {!readOnly && (
              <>
                <button
                  type="button"
                  className="absolute left-0 top-0 h-full w-1/2 cursor-pointer"
                  onMouseEnter={() => setHover(star - 0.5)}
                  onClick={() => handleClick(star, true)}
                  aria-label={`Rate ${star - 0.5} stars`}
                />
                <button
                  type="button"
                  className="absolute right-0 top-0 h-full w-1/2 cursor-pointer"
                  onMouseEnter={() => setHover(star)}
                  onClick={() => handleClick(star, false)}
                  aria-label={`Rate ${star} stars`}
                />
              </>
            )}
          </span>
        );
      })}
    </span>
  );
}

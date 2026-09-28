import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

// Teach tailwind-merge about the custom design-token colours in globals.css so
// e.g. `bg-ink` correctly overrides a component's default `bg-surface`.
const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      color: [
        "canvas", "surface", "subtle", "line", "ink", "muted", "faint",
        "brand", "brand-contrast", "accent", "accent-soft", "danger", "danger-soft",
      ],
      shadow: ["card", "lift"],
    },
  },
});

/** Joins class names; later Tailwind classes win over conflicting earlier ones. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

"use client";

import { cn } from "@/lib/utils/cn";

interface FilterChipsProps<T extends string> {
  label: string;
  options: readonly { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}

/** Horizontally scrolling single-select chips — thumb-friendly on phones. */
export function FilterChips<T extends string>({ label, options, value, onChange }: FilterChipsProps<T>) {
  return (
    <div role="radiogroup" aria-label={label} className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(option.value)}
            className={cn(
              "h-9 shrink-0 rounded-full border px-3.5 text-sm font-medium transition-colors",
              active
                ? "border-ink bg-ink text-white"
                : "border-line bg-surface text-muted hover:border-ink/30 hover:text-ink",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

"use client";

import { X } from "lucide-react";
import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils/cn";

interface SheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  /** Hide the visual title bar (the title is still announced to screen readers). */
  hideHeader?: boolean;
  size?: "md" | "lg";
  children: React.ReactNode;
  footer?: React.ReactNode;
}

/**
 * Bottom sheet on phones, centered dialog on larger screens.
 * Built on native <dialog> for focus trapping, Esc-to-close and a11y for free.
 */
export function Sheet({ open, onClose, title, hideHeader, size = "md", children, footer }: SheetProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      document.body.style.overflow = "hidden";
    } else if (!open && dialog.open) {
      dialog.close();
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-label={title}
      onClose={onClose}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        // Click on the backdrop (the dialog element itself) closes.
        if (e.target === ref.current) onClose();
      }}
      className={cn(
        "m-0 mt-auto max-h-[92dvh] w-full max-w-none overflow-hidden rounded-t-3xl bg-surface p-0 text-ink shadow-lift",
        "sm:m-auto sm:max-h-[88vh] sm:rounded-3xl",
        size === "md" ? "sm:max-w-lg" : "sm:max-w-2xl",
        "backdrop:bg-transparent open:flex open:flex-col",
      )}
    >
      {open && (
        <>
          <div className="mx-auto mt-2.5 h-1 w-10 shrink-0 rounded-full bg-line sm:hidden" aria-hidden />
          {hideHeader ? (
            <button
              type="button"
              onClick={onClose}
              className="absolute top-4 right-4 z-10 grid size-9 place-items-center rounded-full bg-surface/90 text-ink shadow-card backdrop-blur hover:bg-surface"
              aria-label="Close"
            >
              <X className="size-4" />
            </button>
          ) : (
            <div className="flex shrink-0 items-center justify-between gap-4 border-b border-line px-5 py-4">
              <h2 className="text-base font-semibold">{title}</h2>
              <button
                type="button"
                onClick={onClose}
                className="grid size-9 place-items-center rounded-full text-muted hover:bg-subtle hover:text-ink"
                aria-label="Close"
              >
                <X className="size-4" />
              </button>
            </div>
          )}
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">{children}</div>
          {footer && (
            <div className="shrink-0 border-t border-line bg-surface px-5 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
              {footer}
            </div>
          )}
        </>
      )}
    </dialog>
  );
}

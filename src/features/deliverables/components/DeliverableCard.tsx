"use client";

import { CalendarDays } from "lucide-react";
import { formatDate } from "@/lib/utils/dates";
import type { Deliverable } from "../types";
import { CategoryLabel, DeliverablePreview, StatusBadge } from "./presentation";

export function DeliverableCard({ deliverable, onOpen }: { deliverable: Deliverable; onOpen: () => void }) {
  const d = deliverable;
  return (
    <button
      type="button"
      onClick={onOpen}
      className="group flex w-full flex-col overflow-hidden rounded-2xl border border-line/70 bg-surface text-left shadow-card transition-all hover:-translate-y-0.5 hover:shadow-lift focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
    >
      <DeliverablePreview
        previewUrl={d.previewUrl}
        category={d.category}
        title={d.title}
        className="aspect-[16/10] w-full transition-transform duration-500 group-hover:scale-[1.02]"
      />
      <div className="flex flex-1 flex-col gap-2.5 p-4">
        <div className="flex items-start justify-between gap-3">
          <h3 className="line-clamp-2 text-[15px] leading-snug font-semibold text-ink">{d.title}</h3>
          <StatusBadge status={d.status} />
        </div>
        <div className="mt-auto flex items-center justify-between gap-3">
          <CategoryLabel category={d.category} />
          {d.deliveryDate && (
            <span className="inline-flex items-center gap-1 text-xs text-muted">
              <CalendarDays className="size-3.5" aria-hidden />
              {formatDate(d.deliveryDate)}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

/** Compact row used on the Home screen. */
export function DeliverableRow({ deliverable, onOpen }: { deliverable: Deliverable; onOpen: () => void }) {
  const d = deliverable;
  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex w-full items-center gap-3.5 rounded-xl px-2 py-2.5 text-left transition-colors hover:bg-subtle"
    >
      <DeliverablePreview
        previewUrl={d.previewUrl}
        category={d.category}
        title={d.title}
        className="size-12 shrink-0 rounded-xl"
        iconSize="size-5"
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-ink">{d.title}</p>
        <CategoryLabel category={d.category} className="mt-0.5" />
      </div>
      <StatusBadge status={d.status} />
    </button>
  );
}

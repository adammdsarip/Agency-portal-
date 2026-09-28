"use client";

import { ExternalLink } from "lucide-react";
import { buttonClasses } from "@/components/ui/Button";
import { Sheet } from "@/components/ui/Sheet";
import { formatDate } from "@/lib/utils/dates";
import { safeHref } from "@/lib/utils/urls";
import { CATEGORY_LABELS } from "../constants";
import type { Deliverable } from "../types";
import { CategoryLabel, DeliverablePreview, StatusBadge } from "./presentation";

export function DeliverableDetailSheet({
  deliverable,
  onClose,
}: {
  deliverable: Deliverable | null;
  onClose: () => void;
}) {
  const d = deliverable;
  const driveHref = safeHref(d?.googleDriveUrl);

  return (
    <Sheet
      open={Boolean(d)}
      onClose={onClose}
      title={d?.title ?? "Deliverable"}
      hideHeader
      footer={
        driveHref ? (
          <a
            href={driveHref}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonClasses("primary", "lg", "w-full")}
          >
            <ExternalLink className="size-4" /> Open in Google Drive
          </a>
        ) : undefined
      }
    >
      {d && (
        <div>
          <DeliverablePreview
            previewUrl={d.previewUrl}
            category={d.category}
            title={d.title}
            className="aspect-[16/10] w-full"
            iconSize="size-12"
          />
          <div className="space-y-6 p-5 sm:p-6">
            <div className="space-y-2.5">
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge status={d.status} />
                <CategoryLabel category={d.category} />
              </div>
              <h2 className="text-xl font-semibold tracking-tight">{d.title}</h2>
              {d.description && <p className="text-[15px] leading-relaxed whitespace-pre-line text-muted">{d.description}</p>}
            </div>

            <dl className="grid grid-cols-2 gap-3">
              <Detail label="Category" value={CATEGORY_LABELS[d.category]} />
              <Detail label="Delivery date" value={formatDate(d.deliveryDate) || "To be confirmed"} />
            </dl>

            {d.notes && (
              <div>
                <h3 className="mb-1.5 text-xs font-semibold tracking-wide text-faint uppercase">Notes</h3>
                <p className="rounded-xl bg-subtle px-4 py-3 text-sm leading-relaxed whitespace-pre-line text-ink">
                  {d.notes}
                </p>
              </div>
            )}

            {!driveHref && (
              <p className="text-center text-sm text-muted">Files will be linked here once they&apos;re ready.</p>
            )}
          </div>
        </div>
      )}
    </Sheet>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-line px-4 py-3">
      <dt className="text-xs text-faint">{label}</dt>
      <dd className="mt-0.5 text-sm font-medium text-ink">{value}</dd>
    </div>
  );
}

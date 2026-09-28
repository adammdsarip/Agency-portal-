"use client";

import { CalendarClock, ChevronRight, Flame, Link2 } from "lucide-react";
import { Badge } from "@/components/ui/Card";
import { CategoryLabel } from "@/features/deliverables/components/presentation";
import { formatDate } from "@/lib/utils/dates";
import { ADMIN_STATUS_LABELS, CLIENT_STATUS_LABELS, type RequestStatus } from "../constants";
import type { ClientRequest } from "../types";

export type Audience = "client" | "admin";

const STATUS_TONES = {
  submitted: "violet",
  in_progress: "blue",
  waiting_on_client: "amber",
  completed: "green",
  cancelled: "neutral",
} as const;

export function RequestStatusBadge({ status, audience }: { status: RequestStatus; audience: Audience }) {
  const labels = audience === "client" ? CLIENT_STATUS_LABELS : ADMIN_STATUS_LABELS;
  return (
    <Badge tone={STATUS_TONES[status]}>
      <span className="size-1.5 rounded-full bg-current opacity-70" aria-hidden />
      {labels[status]}
    </Badge>
  );
}

export function UrgentBadge() {
  return (
    <Badge tone="red">
      <Flame className="size-3" aria-hidden /> Urgent
    </Badge>
  );
}

/** List row for a request. `subtitle` lets the admin inbox show the client name. */
export function RequestRow({
  request,
  audience,
  subtitle,
  onOpen,
}: {
  request: ClientRequest;
  audience: Audience;
  subtitle?: string;
  onOpen: () => void;
}) {
  const r = request;
  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-subtle sm:px-5"
    >
      <div className="min-w-0 flex-1 space-y-1.5">
        {subtitle && <p className="truncate text-xs font-medium text-muted">{subtitle}</p>}
        <p className="truncate text-[15px] font-semibold text-ink">{r.title}</p>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
          <RequestStatusBadge status={r.status} audience={audience} />
          {r.priority === "urgent" && <UrgentBadge />}
          <CategoryLabel category={r.category} />
          {r.neededBy && (
            <span className="inline-flex items-center gap-1 text-xs text-muted">
              <CalendarClock className="size-3.5" aria-hidden /> Needed {formatDate(r.neededBy)}
            </span>
          )}
          {r.fileUrl && (
            <span className="inline-flex items-center gap-1 text-xs text-muted">
              <Link2 className="size-3.5" aria-hidden /> File
            </span>
          )}
        </div>
      </div>
      <ChevronRight className="size-4 shrink-0 text-faint" aria-hidden />
    </button>
  );
}

"use client";

import { ExternalLink, MessageCircleReply } from "lucide-react";
import { CATEGORY_LABELS } from "@/features/deliverables/constants";
import { formatDate, formatDateTime } from "@/lib/utils/dates";
import { safeHref } from "@/lib/utils/urls";
import type { ClientRequest } from "../types";
import { RequestStatusBadge, UrgentBadge, type Audience } from "./presentation";

/** Read-only body of a request, shared by the client and admin sheets. */
export function RequestDetails({ request, audience }: { request: ClientRequest; audience: Audience }) {
  const r = request;
  const fileHref = safeHref(r.fileUrl);
  return (
    <div className="space-y-5">
      <div className="space-y-2.5">
        <div className="flex flex-wrap items-center gap-2">
          <RequestStatusBadge status={r.status} audience={audience} />
          {r.priority === "urgent" && <UrgentBadge />}
        </div>
        <h2 className="text-xl font-semibold tracking-tight">{r.title}</h2>
        <p className="text-xs text-muted">
          Sent {formatDateTime(r.createdAt)}
          {r.createdByName || r.createdByEmail ? ` by ${r.createdByName || r.createdByEmail}` : ""}
        </p>
      </div>

      {r.description && <p className="text-[15px] leading-relaxed whitespace-pre-line text-ink">{r.description}</p>}

      <dl className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-line px-4 py-3">
          <dt className="text-xs text-faint">Type</dt>
          <dd className="mt-0.5 text-sm font-medium">{CATEGORY_LABELS[r.category]}</dd>
        </div>
        <div className="rounded-xl border border-line px-4 py-3">
          <dt className="text-xs text-faint">Needed by</dt>
          <dd className="mt-0.5 text-sm font-medium">{formatDate(r.neededBy) || "No deadline"}</dd>
        </div>
      </dl>

      {fileHref && (
        <a
          href={fileHref}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 rounded-xl border border-line px-4 py-3 text-sm hover:bg-subtle"
        >
          <ExternalLink className="size-4 shrink-0 text-muted" />
          <span className="min-w-0 truncate">{fileHref}</span>
        </a>
      )}

      {audience === "client" && r.adminResponse && (
        <div className="rounded-2xl bg-accent-soft p-4">
          <p className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold tracking-wide text-accent uppercase">
            <MessageCircleReply className="size-3.5" /> Reply from our team
          </p>
          <p className="text-sm leading-relaxed whitespace-pre-line text-ink">{r.adminResponse}</p>
        </div>
      )}
    </div>
  );
}

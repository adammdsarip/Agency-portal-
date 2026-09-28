"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Field, Select, Textarea } from "@/components/ui/Field";
import { Alert, friendlyError } from "@/components/ui/feedback";
import { Sheet } from "@/components/ui/Sheet";
import { updateRequestAsAdmin } from "../api";
import { ADMIN_STATUS_LABELS, REQUEST_STATUSES, type RequestStatus } from "../constants";
import type { ClientRequest } from "../types";
import { RequestDetails } from "./RequestDetails";

export function AdminRequestSheet({
  request,
  clientName,
  onClose,
}: {
  request: ClientRequest | null;
  clientName?: string;
  onClose: () => void;
}) {
  return (
    <Sheet open={Boolean(request)} onClose={onClose} title={clientName ? `Request · ${clientName}` : "Request"} size="lg">
      {/* Keyed so the form resets when a different request is opened. */}
      {request && <AdminRequestForm key={request.id} request={request} clientName={clientName} onClose={onClose} />}
    </Sheet>
  );
}

function AdminRequestForm({
  request,
  clientName,
  onClose,
}: {
  request: ClientRequest;
  clientName?: string;
  onClose: () => void;
}) {
  const [status, setStatus] = useState<RequestStatus>(request.status);
  const [reply, setReply] = useState(request.adminResponse);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dirty = status !== request.status || reply.trim() !== request.adminResponse;

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (reply.length > 5000) return setError("The reply can be at most 5000 characters.");
    setSaving(true);
    setError(null);
    try {
      await updateRequestAsAdmin(request.id, { status, adminResponse: reply });
      onClose();
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={save}>
      <div className="space-y-6 p-5">
        {clientName && (
          <Link href={`/admin/clients/${request.clientId}?tab=requests`} className="text-sm font-medium text-muted hover:text-ink">
            {clientName} →
          </Link>
        )}
        <RequestDetails request={request} audience="admin" />

        <div className="space-y-4 rounded-2xl border border-dashed border-line p-4">
          {error && <Alert>{error}</Alert>}
          <Field label="Status">
            {(id) => (
              <Select id={id} value={status} onChange={(e) => setStatus(e.target.value as RequestStatus)}>
                {REQUEST_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {ADMIN_STATUS_LABELS[s]}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <Field label="Reply to client" hint="Shown to the client on this request.">
            {(id, d) => <Textarea id={id} aria-describedby={d} value={reply} onChange={(e) => setReply(e.target.value)} rows={4} />}
          </Field>
        </div>
      </div>
      <div className="sticky bottom-0 flex justify-end gap-2 border-t border-line bg-surface px-5 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <Button variant="secondary" onClick={onClose} disabled={saving}>
          Close
        </Button>
        <Button type="submit" loading={saving} disabled={!dirty}>
          Save
        </Button>
      </div>
    </form>
  );
}

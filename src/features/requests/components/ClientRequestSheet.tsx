"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { friendlyError } from "@/components/ui/feedback";
import { Sheet } from "@/components/ui/Sheet";
import { cancelRequest } from "../api";
import type { ClientRequest } from "../types";
import { RequestDetails } from "./RequestDetails";

export function ClientRequestSheet({ request, onClose }: { request: ClientRequest | null; onClose: () => void }) {
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function close() {
    setConfirming(false);
    setError(null);
    onClose();
  }

  async function cancel() {
    if (!request) return;
    setBusy(true);
    setError(null);
    try {
      await cancelRequest(request.id);
      setConfirming(false);
    } catch (e) {
      setError(friendlyError(e));
    } finally {
      setBusy(false);
    }
  }

  // Only a request the agency hasn't picked up yet can be withdrawn (enforced by the rules too).
  const canCancel = request?.status === "submitted";

  return (
    <Sheet
      open={Boolean(request)}
      onClose={close}
      title="Request"
      footer={
        canCancel ? (
          confirming ? (
            <div className="flex items-center justify-end gap-2">
              <span className="mr-auto text-sm text-muted">Withdraw this request?</span>
              <Button variant="secondary" onClick={() => setConfirming(false)} disabled={busy}>
                Keep
              </Button>
              <Button variant="danger" onClick={cancel} loading={busy}>
                Withdraw
              </Button>
            </div>
          ) : (
            <Button variant="secondary" className="w-full" onClick={() => setConfirming(true)}>
              Withdraw request
            </Button>
          )
        ) : undefined
      }
    >
      {request && (
        <div className="space-y-3 p-5 sm:p-6">
          <RequestDetails request={request} audience="client" />
          {error && <p className="text-sm text-danger">{error}</p>}
        </div>
      )}
    </Sheet>
  );
}

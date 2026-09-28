"use client";

import { useState } from "react";
import { Button } from "./Button";
import { friendlyError } from "./feedback";
import { Sheet } from "./Sheet";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: React.ReactNode;
  confirmLabel: string;
  destructive?: boolean;
  onConfirm: () => Promise<void>;
  onClose: () => void;
}

export function ConfirmDialog({ open, title, description, confirmLabel, destructive, onConfirm, onClose }: ConfirmDialogProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function confirm() {
    setBusy(true);
    setError(null);
    try {
      await onConfirm();
      onClose();
    } catch (e) {
      setError(friendlyError(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={title}
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button variant={destructive ? "danger" : "primary"} onClick={confirm} loading={busy}>
            {confirmLabel}
          </Button>
        </div>
      }
    >
      <div className="space-y-3 p-5 text-sm text-muted">
        <div>{description}</div>
        {error && <p className="text-danger">{error}</p>}
      </div>
    </Sheet>
  );
}

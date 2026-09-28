"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Field, Input, Select, Textarea } from "@/components/ui/Field";
import { Alert, friendlyError } from "@/components/ui/feedback";
import { isHttpsUrl } from "@/lib/utils/urls";
import {
  CLIENT_STATUSES,
  RETAINER_STATUS_LABELS,
  RETAINER_STATUSES,
  type ClientInput,
  type ClientPrivateProfile,
  type ClientStatus,
  type RetainerStatus,
} from "../types";

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

type Errors = Partial<Record<"name" | "contactEmail" | "website" | "logoUrl" | "driveFolderUrl" | "billingEmail", string>>;

function validate(c: ClientInput, p: ClientPrivateProfile): Errors {
  const e: Errors = {};
  if (!c.name.trim()) e.name = "Company name is required.";
  if (c.contactEmail.trim() && !EMAIL_RE.test(c.contactEmail.trim())) e.contactEmail = "Enter a valid email.";
  if (p.billingEmail.trim() && !EMAIL_RE.test(p.billingEmail.trim())) e.billingEmail = "Enter a valid email.";
  for (const key of ["website", "logoUrl", "driveFolderUrl"] as const) {
    if (c[key].trim() && !isHttpsUrl(c[key].trim())) e[key] = "Use a full https:// link.";
  }
  return e;
}

interface ClientFormProps {
  initial: ClientInput;
  initialPrivate: ClientPrivateProfile;
  submitLabel: string;
  onSubmit: (client: ClientInput, privateProfile: ClientPrivateProfile) => Promise<void>;
  onCancel?: () => void;
}

export function ClientForm({ initial, initialPrivate, submitLabel, onSubmit, onCancel }: ClientFormProps) {
  const [client, setClient] = useState<ClientInput>(initial);
  const [priv, setPriv] = useState<ClientPrivateProfile>(initialPrivate);
  const [errors, setErrors] = useState<Errors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const set = <K extends keyof ClientInput>(key: K, value: ClientInput[K]) => {
    setSaved(false);
    setClient((c) => ({ ...c, [key]: value }));
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const found = validate(client, priv);
    setErrors(found);
    if (Object.keys(found).length) return;
    setSaving(true);
    setSubmitError(null);
    try {
      await onSubmit(client, priv);
      setSaved(true);
    } catch (err) {
      setSubmitError(friendlyError(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      {submitError && <Alert>{submitError}</Alert>}

      <Card className="space-y-4 p-5">
        <h2 className="text-sm font-semibold">Company</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Company name" error={errors.name} className="sm:col-span-2">
            {(id, d) => <Input id={id} aria-describedby={d} value={client.name} onChange={(e) => set("name", e.target.value)} />}
          </Field>
          <Field label="Industry">
            {(id) => <Input id={id} value={client.industry} onChange={(e) => set("industry", e.target.value)} placeholder="Hospitality" />}
          </Field>
          <Field label="Portal status" hint="Inactive clients can't see their deliverables.">
            {(id, d) => (
              <Select id={id} aria-describedby={d} value={client.status} onChange={(e) => set("status", e.target.value as ClientStatus)}>
                {CLIENT_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s === "active" ? "Active" : "Inactive"}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <Field label="Website" error={errors.website}>
            {(id, d) => <Input id={id} aria-describedby={d} type="url" value={client.website} onChange={(e) => set("website", e.target.value)} placeholder="https://" />}
          </Field>
          <Field label="Logo image link" error={errors.logoUrl}>
            {(id, d) => <Input id={id} aria-describedby={d} type="url" value={client.logoUrl} onChange={(e) => set("logoUrl", e.target.value)} placeholder="https://" />}
          </Field>
          <Field label="Shared Google Drive folder" error={errors.driveFolderUrl} className="sm:col-span-2">
            {(id, d) => (
              <Input id={id} aria-describedby={d} type="url" value={client.driveFolderUrl} onChange={(e) => set("driveFolderUrl", e.target.value)} placeholder="https://drive.google.com/drive/folders/…" />
            )}
          </Field>
        </div>
      </Card>

      <Card className="space-y-4 p-5">
        <h2 className="text-sm font-semibold">Main contact</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Name">
            {(id) => <Input id={id} value={client.contactName} onChange={(e) => set("contactName", e.target.value)} />}
          </Field>
          <Field label="Email" error={errors.contactEmail}>
            {(id, d) => <Input id={id} aria-describedby={d} type="email" value={client.contactEmail} onChange={(e) => set("contactEmail", e.target.value)} />}
          </Field>
          <Field label="Phone">
            {(id) => <Input id={id} type="tel" value={client.phone} onChange={(e) => set("phone", e.target.value)} />}
          </Field>
        </div>
      </Card>

      <Card className="space-y-4 p-5">
        <h2 className="text-sm font-semibold">Retainer</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Status">
            {(id) => (
              <Select
                id={id}
                value={client.retainer.status}
                onChange={(e) => set("retainer", { ...client.retainer, status: e.target.value as RetainerStatus })}
              >
                {RETAINER_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {RETAINER_STATUS_LABELS[s]}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <Field label="Plan name" hint="Shown to the client, e.g. “Social Growth — Monthly”.">
            {(id, d) => (
              <Input id={id} aria-describedby={d} value={client.retainer.planName} onChange={(e) => set("retainer", { ...client.retainer, planName: e.target.value })} />
            )}
          </Field>
        </div>
      </Card>

      <Card className="space-y-4 border-dashed p-5">
        <div>
          <h2 className="text-sm font-semibold">Internal (admin only)</h2>
          <p className="mt-0.5 text-xs text-muted">Stored separately and never readable by the client.</p>
        </div>
        <Field label="Billing email" error={errors.billingEmail}>
          {(id, d) => (
            <Input
              id={id}
              aria-describedby={d}
              type="email"
              value={priv.billingEmail}
              onChange={(e) => {
                setSaved(false);
                setPriv((p) => ({ ...p, billingEmail: e.target.value }));
              }}
            />
          )}
        </Field>
        <Field label="Internal notes">
          {(id) => (
            <Textarea
              id={id}
              value={priv.internalNotes}
              onChange={(e) => {
                setSaved(false);
                setPriv((p) => ({ ...p, internalNotes: e.target.value }));
              }}
            />
          )}
        </Field>
      </Card>

      <div className="flex items-center justify-end gap-3">
        {saved && <span className="text-sm text-emerald-700">Saved</span>}
        {onCancel && (
          <Button variant="secondary" onClick={onCancel} disabled={saving}>
            Cancel
          </Button>
        )}
        <Button type="submit" loading={saving}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}

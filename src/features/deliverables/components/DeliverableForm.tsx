"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select, Textarea } from "@/components/ui/Field";
import { Alert, friendlyError } from "@/components/ui/feedback";
import { Sheet } from "@/components/ui/Sheet";
import { dateInputToTimestamp, timestampToDateInput } from "@/lib/utils/dates";
import { isGoogleDriveUrl, isHttpsUrl, toPreviewImageUrl } from "@/lib/utils/urls";
import {
  CATEGORY_LABELS,
  DELIVERABLE_CATEGORIES,
  DELIVERABLE_STATUSES,
  STATUS_LABELS,
  type DeliverableCategory,
  type DeliverableStatus,
} from "../constants";
import type { Deliverable, DeliverableInput } from "../types";
import { DeliverablePreview } from "./presentation";

interface FormValues {
  title: string;
  description: string;
  category: DeliverableCategory;
  status: DeliverableStatus;
  previewUrl: string;
  googleDriveUrl: string;
  deliveryDate: string;
  notes: string;
}

function toValues(d?: Deliverable | null): FormValues {
  return {
    title: d?.title ?? "",
    description: d?.description ?? "",
    category: d?.category ?? "design",
    status: d?.status ?? "draft",
    previewUrl: d?.previewUrl ?? "",
    googleDriveUrl: d?.googleDriveUrl ?? "",
    deliveryDate: timestampToDateInput(d?.deliveryDate),
    notes: d?.notes ?? "",
  };
}

type Errors = Partial<Record<keyof FormValues, string>>;

function validate(v: FormValues): Errors {
  const errors: Errors = {};
  if (!v.title.trim()) errors.title = "Give the deliverable a title.";
  else if (v.title.trim().length > 200) errors.title = "Keep the title under 200 characters.";
  if (v.description.length > 5000) errors.description = "Maximum 5000 characters.";
  if (v.notes.length > 5000) errors.notes = "Maximum 5000 characters.";
  if (v.googleDriveUrl.trim() && !isHttpsUrl(v.googleDriveUrl.trim())) errors.googleDriveUrl = "Paste a full https:// link.";
  if (v.previewUrl.trim() && !isHttpsUrl(v.previewUrl.trim())) errors.previewUrl = "Paste a full https:// image link.";
  return errors;
}

function toInput(v: FormValues): DeliverableInput {
  const preview = v.previewUrl.trim();
  return {
    title: v.title.trim(),
    description: v.description.trim(),
    category: v.category,
    status: v.status,
    previewUrl: preview ? toPreviewImageUrl(preview) : "",
    googleDriveUrl: v.googleDriveUrl.trim(),
    deliveryDate: dateInputToTimestamp(v.deliveryDate),
    notes: v.notes.trim(),
  };
}

interface DeliverableFormSheetProps {
  open: boolean;
  clientName: string;
  /** Existing deliverable to edit, or null to create. */
  deliverable: Deliverable | null;
  onClose: () => void;
  onSubmit: (input: DeliverableInput) => Promise<void>;
}

export function DeliverableFormSheet(props: DeliverableFormSheetProps) {
  // Remount the form whenever a different deliverable is opened, so its state starts fresh.
  return (
    <Sheet
      open={props.open}
      onClose={props.onClose}
      title={props.deliverable ? "Edit deliverable" : `New deliverable · ${props.clientName}`}
      size="lg"
    >
      {props.open && <DeliverableForm key={props.deliverable?.id ?? "new"} {...props} />}
    </Sheet>
  );
}

function DeliverableForm({ deliverable, onClose, onSubmit }: DeliverableFormSheetProps) {
  const [values, setValues] = useState<FormValues>(() => toValues(deliverable));
  const [errors, setErrors] = useState<Errors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const set = <K extends keyof FormValues>(key: K, value: FormValues[K]) =>
    setValues((v) => ({ ...v, [key]: value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const found = validate(values);
    setErrors(found);
    if (Object.keys(found).length) return;
    setSaving(true);
    setSubmitError(null);
    try {
      await onSubmit(toInput(values));
      onClose();
    } catch (err) {
      setSubmitError(friendlyError(err));
    } finally {
      setSaving(false);
    }
  }

  const previewCandidate = values.previewUrl.trim();
  const driveWarning =
    values.googleDriveUrl.trim() && isHttpsUrl(values.googleDriveUrl.trim()) && !isGoogleDriveUrl(values.googleDriveUrl.trim())
      ? "This isn't a Google Drive link — that's fine, it will still open."
      : undefined;

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="space-y-4 p-5">
        {submitError && <Alert>{submitError}</Alert>}

        <Field label="Title" error={errors.title}>
          {(id, d) => (
            <Input id={id} aria-describedby={d} value={values.title} onChange={(e) => set("title", e.target.value)} placeholder="Instagram Campaign" autoFocus />
          )}
        </Field>

        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Category">
            {(id) => (
              <Select id={id} value={values.category} onChange={(e) => set("category", e.target.value as DeliverableCategory)}>
                {DELIVERABLE_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {CATEGORY_LABELS[c]}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <Field label="Status">
            {(id) => (
              <Select id={id} value={values.status} onChange={(e) => set("status", e.target.value as DeliverableStatus)}>
                {DELIVERABLE_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {STATUS_LABELS[s]}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <Field label="Delivery date">
            {(id) => <Input id={id} type="date" value={values.deliveryDate} onChange={(e) => set("deliveryDate", e.target.value)} />}
          </Field>
        </div>

        <Field label="Description" error={errors.description} hint="Visible to the client.">
          {(id, d) => (
            <Textarea id={id} aria-describedby={d} value={values.description} onChange={(e) => set("description", e.target.value)} rows={3} />
          )}
        </Field>

        <Field label="Google Drive link" error={errors.googleDriveUrl} hint={driveWarning ?? "Make sure the client has access to the file or folder."}>
          {(id, d) => (
            <Input
              id={id}
              aria-describedby={d}
              type="url"
              inputMode="url"
              value={values.googleDriveUrl}
              onChange={(e) => set("googleDriveUrl", e.target.value)}
              placeholder="https://drive.google.com/…"
            />
          )}
        </Field>

        <Field
          label="Preview image link"
          error={errors.previewUrl}
          hint="Any https image link. Google Drive file links are converted automatically (file must be shared “Anyone with the link”)."
        >
          {(id, d) => (
            <Input
              id={id}
              aria-describedby={d}
              type="url"
              inputMode="url"
              value={values.previewUrl}
              onChange={(e) => set("previewUrl", e.target.value)}
              placeholder="https://…"
            />
          )}
        </Field>
        {previewCandidate && isHttpsUrl(previewCandidate) && (
          <DeliverablePreview
            previewUrl={toPreviewImageUrl(previewCandidate)}
            category={values.category}
            title={values.title || "Preview"}
            className="aspect-[16/10] w-full max-w-xs rounded-xl border border-line"
          />
        )}

        <Field label="Notes" error={errors.notes} hint="Visible to the client — e.g. feedback instructions or usage rights.">
          {(id, d) => <Textarea id={id} aria-describedby={d} value={values.notes} onChange={(e) => set("notes", e.target.value)} rows={3} />}
        </Field>
      </div>

      <div className="sticky bottom-0 flex justify-end gap-2 border-t border-line bg-surface px-5 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <Button variant="secondary" onClick={onClose} disabled={saving}>
          Cancel
        </Button>
        <Button type="submit" loading={saving}>
          {deliverable ? "Save changes" : "Add deliverable"}
        </Button>
      </div>
    </form>
  );
}

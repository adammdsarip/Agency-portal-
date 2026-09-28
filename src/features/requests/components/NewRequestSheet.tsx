"use client";

import { Flame } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Field, Input, Select, Textarea } from "@/components/ui/Field";
import { Alert, friendlyError } from "@/components/ui/feedback";
import { Sheet } from "@/components/ui/Sheet";
import type { DeliverableCategory } from "@/features/deliverables/constants";
import { cn } from "@/lib/utils/cn";
import { dateInputToTimestamp } from "@/lib/utils/dates";
import { isHttpsUrl } from "@/lib/utils/urls";
import { submitRequest } from "../api";
import { CATEGORY_LABELS, REQUEST_CATEGORIES, type RequestPriority } from "../constants";

interface Values {
  title: string;
  description: string;
  category: DeliverableCategory;
  priority: RequestPriority;
  fileUrl: string;
  neededBy: string;
}

const EMPTY: Values = { title: "", description: "", category: "design", priority: "normal", fileUrl: "", neededBy: "" };

type Errors = Partial<Record<keyof Values, string>>;

function validate(v: Values): Errors {
  const e: Errors = {};
  if (!v.title.trim()) e.title = "Give your request a short title.";
  else if (v.title.trim().length > 200) e.title = "Keep the title under 200 characters.";
  if (v.description.length > 5000) e.description = "Maximum 5000 characters.";
  if (v.fileUrl.trim() && !isHttpsUrl(v.fileUrl.trim())) e.fileUrl = "Paste the full link, starting with https://";
  return e;
}

/** Today's date in the user's own time zone, as YYYY-MM-DD. */
function todayInput() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function NewRequestSheet({
  open,
  clientId,
  onClose,
  onSubmitted,
}: {
  open: boolean;
  clientId: string;
  onClose: () => void;
  onSubmitted: (id: string) => void;
}) {
  return (
    <Sheet open={open} onClose={onClose} title="New request" size="lg">
      {open && <NewRequestForm clientId={clientId} onClose={onClose} onSubmitted={onSubmitted} />}
    </Sheet>
  );
}

function NewRequestForm({
  clientId,
  onClose,
  onSubmitted,
}: {
  clientId: string;
  onClose: () => void;
  onSubmitted: (id: string) => void;
}) {
  const [values, setValues] = useState<Values>(EMPTY);
  const [errors, setErrors] = useState<Errors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const set = <K extends keyof Values>(key: K, value: Values[K]) => setValues((v) => ({ ...v, [key]: value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const found = validate(values);
    setErrors(found);
    if (Object.keys(found).length) return;
    setSending(true);
    setSubmitError(null);
    try {
      const id = await submitRequest(clientId, {
        title: values.title.trim(),
        description: values.description.trim(),
        category: values.category,
        priority: values.priority,
        fileUrl: values.fileUrl.trim(),
        neededBy: dateInputToTimestamp(values.neededBy),
      });
      onSubmitted(id);
      onClose();
    } catch (err) {
      setSubmitError(friendlyError(err));
    } finally {
      setSending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="space-y-4 p-5">
        {submitError && <Alert>{submitError}</Alert>}

        <Field label="What do you need?" error={errors.title}>
          {(id, d) => (
            <Input
              id={id}
              aria-describedby={d}
              value={values.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="e.g. Story graphics for our weekend offer"
              autoFocus
            />
          )}
        </Field>

        <Field label="Details" error={errors.description} hint="Tell us as much as you can: sizes, wording, references, where it will be used.">
          {(id, d) => (
            <Textarea
              id={id}
              aria-describedby={d}
              value={values.description}
              onChange={(e) => set("description", e.target.value)}
              rows={5}
            />
          )}
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Type">
            {(id) => (
              <Select id={id} value={values.category} onChange={(e) => set("category", e.target.value as DeliverableCategory)}>
                {REQUEST_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {CATEGORY_LABELS[c]}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <Field label="Needed by (optional)">
            {(id) => (
              <Input id={id} type="date" min={todayInput()} value={values.neededBy} onChange={(e) => set("neededBy", e.target.value)} />
            )}
          </Field>
        </div>

        <Field
          label="File link (optional)"
          error={errors.fileUrl}
          hint="A link to Google Drive, Dropbox, WeTransfer… Make sure we have access."
        >
          {(id, d) => (
            <Input
              id={id}
              aria-describedby={d}
              type="url"
              inputMode="url"
              value={values.fileUrl}
              onChange={(e) => set("fileUrl", e.target.value)}
              placeholder="https://"
            />
          )}
        </Field>

        <fieldset>
          <legend className="mb-1.5 block text-sm font-medium">Priority</legend>
          <div className="grid grid-cols-2 gap-2">
            {(["normal", "urgent"] as const).map((p) => (
              <label
                key={p}
                className={cn(
                  "flex h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border text-sm font-medium transition-colors",
                  values.priority === p ? "border-ink bg-ink text-white" : "border-line bg-surface text-muted hover:text-ink",
                )}
              >
                <input
                  type="radio"
                  name="priority"
                  value={p}
                  checked={values.priority === p}
                  onChange={() => set("priority", p)}
                  className="sr-only"
                />
                {p === "urgent" && <Flame className="size-4" aria-hidden />}
                {p === "normal" ? "Normal" : "Urgent"}
              </label>
            ))}
          </div>
        </fieldset>
      </div>

      <div className="sticky bottom-0 flex justify-end gap-2 border-t border-line bg-surface px-5 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <Button variant="secondary" onClick={onClose} disabled={sending}>
          Cancel
        </Button>
        <Button type="submit" loading={sending}>
          Send request
        </Button>
      </div>
    </form>
  );
}

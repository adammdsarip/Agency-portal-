"use client";

import { Archive, ArchiveRestore, CalendarDays, ExternalLink, Layers, Pencil, Plus, SearchX, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Card";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Alert, EmptyState, friendlyError, Spinner } from "@/components/ui/feedback";
import { formatDate } from "@/lib/utils/dates";
import { safeHref } from "@/lib/utils/urls";
import { createDeliverable, deleteDeliverable, setDeliverableArchived, updateDeliverable } from "../api";
import { DELIVERABLE_STATUSES, STATUS_LABELS, type DeliverableStatus } from "../constants";
import { filterDeliverables } from "../filters";
import { useAdminDeliverables } from "../hooks";
import type { Deliverable } from "../types";
import { DeliverableFilters, INITIAL_FILTERS, type FilterState } from "./DeliverableFilters";
import { DeliverableFormSheet } from "./DeliverableForm";
import { CategoryLabel, DeliverablePreview } from "./presentation";

type Editing = { mode: "create" } | { mode: "edit"; id: string } | null;

/** Admin CRUD for one client's deliverables. Changes appear live in that client's portal. */
export function DeliverablesManager({ clientId, clientName }: { clientId: string; clientName: string }) {
  const [includeArchived, setIncludeArchived] = useState(false);
  const { data, loading, error } = useAdminDeliverables(clientId, includeArchived);
  const [filters, setFilters] = useState<FilterState>(INITIAL_FILTERS);
  const [editing, setEditing] = useState<Editing>(null);
  const [deleting, setDeleting] = useState<Deliverable | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const visible = useMemo(() => filterDeliverables(data, filters), [data, filters]);
  const editingDeliverable = editing?.mode === "edit" ? (data.find((d) => d.id === editing.id) ?? null) : null;

  async function run(action: () => Promise<unknown>) {
    setActionError(null);
    try {
      await action();
    } catch (e) {
      setActionError(friendlyError(e));
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <label className="flex items-center gap-2 text-sm text-muted">
          <input
            type="checkbox"
            checked={includeArchived}
            onChange={(e) => setIncludeArchived(e.target.checked)}
            className="size-4 rounded border-line accent-ink"
          />
          Show archived
        </label>
        <Button onClick={() => setEditing({ mode: "create" })}>
          <Plus className="size-4" /> Add deliverable
        </Button>
      </div>

      <DeliverableFilters value={filters} onChange={setFilters} />

      {actionError && <Alert>{actionError}</Alert>}

      {error ? (
        <Alert>{friendlyError(error)}</Alert>
      ) : loading ? (
        <div className="grid place-items-center py-16">
          <Spinner />
        </div>
      ) : data.length === 0 ? (
        <EmptyState
          icon={Layers}
          title={`No deliverables for ${clientName} yet`}
          description="Anything you add here appears instantly in the client's portal."
          action={
            <Button size="sm" onClick={() => setEditing({ mode: "create" })}>
              <Plus className="size-4" /> Add the first one
            </Button>
          }
        />
      ) : visible.length === 0 ? (
        <EmptyState icon={SearchX} title="No matches" description="Try a different search or filter." />
      ) : (
        <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line/70 bg-surface shadow-card">
          {visible.map((d) => (
            <li key={d.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
              <div className="flex min-w-0 flex-1 items-center gap-3.5">
                <DeliverablePreview
                  previewUrl={d.previewUrl}
                  category={d.category}
                  title={d.title}
                  className="size-14 shrink-0 rounded-xl"
                  iconSize="size-5"
                />
                <div className="min-w-0 space-y-1">
                  <p className="flex items-center gap-2 truncate text-sm font-semibold">
                    <span className="truncate">{d.title}</span>
                    {d.archived && <Badge>Archived</Badge>}
                  </p>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <CategoryLabel category={d.category} />
                    {d.deliveryDate && (
                      <span className="inline-flex items-center gap-1 text-xs text-muted">
                        <CalendarDays className="size-3.5" /> {formatDate(d.deliveryDate)}
                      </span>
                    )}
                    {safeHref(d.googleDriveUrl) && (
                      <a
                        href={safeHref(d.googleDriveUrl)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-muted hover:text-ink"
                      >
                        <ExternalLink className="size-3.5" /> Drive
                      </a>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 sm:shrink-0">
                <select
                  aria-label={`Status of ${d.title}`}
                  value={d.status}
                  onChange={(e) => run(() => updateDeliverable(d.id, { status: e.target.value as DeliverableStatus }))}
                  className="h-9 flex-1 rounded-lg border border-line bg-surface px-2.5 text-sm sm:flex-none"
                >
                  {DELIVERABLE_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {STATUS_LABELS[s]}
                    </option>
                  ))}
                </select>
                <IconButton label="Edit" onClick={() => setEditing({ mode: "edit", id: d.id })}>
                  <Pencil className="size-4" />
                </IconButton>
                <IconButton
                  label={d.archived ? "Restore" : "Archive (hide from client)"}
                  onClick={() => run(() => setDeliverableArchived(d.id, !d.archived))}
                >
                  {d.archived ? <ArchiveRestore className="size-4" /> : <Archive className="size-4" />}
                </IconButton>
                <IconButton label="Delete" onClick={() => setDeleting(d)} danger>
                  <Trash2 className="size-4" />
                </IconButton>
              </div>
            </li>
          ))}
        </ul>
      )}

      <DeliverableFormSheet
        open={editing !== null && (editing.mode === "create" || editingDeliverable !== null)}
        clientName={clientName}
        deliverable={editingDeliverable}
        onClose={() => setEditing(null)}
        onSubmit={async (input) => {
          if (editingDeliverable) await updateDeliverable(editingDeliverable.id, input);
          else await createDeliverable(clientId, input);
        }}
      />

      <ConfirmDialog
        open={deleting !== null}
        title="Delete deliverable?"
        description={
          <>
            <strong className="text-ink">{deleting?.title}</strong> will be permanently removed from the portal. Files in
            Google Drive are not affected. To just hide it from the client, archive it instead.
          </>
        }
        confirmLabel="Delete"
        destructive
        onConfirm={() => deleteDeliverable(deleting!.id)}
        onClose={() => setDeleting(null)}
      />
    </div>
  );
}

function IconButton({
  label,
  onClick,
  danger,
  children,
}: {
  label: string;
  onClick: () => void;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      className={`grid size-9 place-items-center rounded-lg text-muted transition-colors hover:bg-subtle ${danger ? "hover:text-danger" : "hover:text-ink"}`}
    >
      {children}
    </button>
  );
}

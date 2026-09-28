"use client";

import { Building2, ChevronRight, Plus, Search } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { ButtonLink } from "@/components/ui/Button";
import { Badge, PageHeader } from "@/components/ui/Card";
import { Alert, EmptyState, friendlyError, Spinner } from "@/components/ui/feedback";
import { useClients } from "@/features/clients/hooks";
import { RETAINER_STATUS_LABELS } from "@/features/clients/types";

export default function AdminClientsPage() {
  const { data: clients, loading, error } = useClients();
  const [search, setSearch] = useState("");

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return clients;
    return clients.filter((c) =>
      [c.name, c.contactName, c.contactEmail, c.industry].some((v) => v.toLowerCase().includes(q)),
    );
  }, [clients, search]);

  const activeCount = clients.filter((c) => c.status === "active").length;

  return (
    <div>
      <PageHeader
        title="Clients"
        description={loading ? "Loading…" : `${activeCount} active · ${clients.length} total`}
        action={
          <ButtonLink href="/admin/clients/new">
            <Plus className="size-4" /> Add client
          </ButtonLink>
        }
      />

      <div className="relative mb-4">
        <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-faint" />
        <input
          type="search"
          aria-label="Search clients"
          placeholder="Search clients"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-11 w-full rounded-xl border border-line bg-surface pr-3 pl-10 text-[15px] placeholder:text-faint focus:border-ink focus:ring-4 focus:ring-ink/5 focus:outline-none"
        />
      </div>

      {error ? (
        <Alert>{friendlyError(error)}</Alert>
      ) : loading ? (
        <div className="grid place-items-center py-16">
          <Spinner />
        </div>
      ) : clients.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No clients yet"
          description="Add your first client to start sharing deliverables."
          action={
            <ButtonLink href="/admin/clients/new" size="sm">
              <Plus className="size-4" /> Add client
            </ButtonLink>
          }
        />
      ) : visible.length === 0 ? (
        <EmptyState title="No clients match your search" />
      ) : (
        <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line/70 bg-surface shadow-card">
          {visible.map((c) => (
            <li key={c.id}>
              <Link href={`/admin/clients/${c.id}`} className="flex items-center gap-4 px-4 py-3.5 transition-colors hover:bg-subtle sm:px-5">
                <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-subtle text-sm font-semibold">
                  {c.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{c.name}</p>
                  <p className="truncate text-xs text-muted">
                    {[c.contactName, c.industry].filter(Boolean).join(" · ") || "No contact yet"}
                  </p>
                </div>
                <div className="hidden items-center gap-2 sm:flex">
                  <Badge tone={c.retainer.status === "active" ? "violet" : "neutral"}>
                    {c.retainer.planName || RETAINER_STATUS_LABELS[c.retainer.status]}
                  </Badge>
                </div>
                <Badge tone={c.status === "active" ? "green" : "neutral"}>{c.status === "active" ? "Active" : "Inactive"}</Badge>
                <ChevronRight className="size-4 shrink-0 text-faint" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

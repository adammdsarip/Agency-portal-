"use client";

import { Building2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { ButtonLink } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/Card";
import { Select } from "@/components/ui/Field";
import { Alert, EmptyState, friendlyError, Spinner } from "@/components/ui/feedback";
import { useClients } from "@/features/clients/hooks";
import { DeliverablesManager } from "@/features/deliverables/components/DeliverablesManager";

export default function AdminDeliverablesPage() {
  return (
    <Suspense fallback={<Spinner />}>
      <DeliverablesManagerPage />
    </Suspense>
  );
}

function DeliverablesManagerPage() {
  const { data: clients, loading, error } = useClients();
  const searchParams = useSearchParams();
  const router = useRouter();
  // Selected client lives in the URL so it survives reloads and can be linked.
  const selectedId = searchParams.get("client") ?? "";
  const selected = clients.find((c) => c.id === selectedId) ?? null;

  return (
    <div>
      <PageHeader title="Deliverables manager" description="Select a client to add and manage their deliverables." />

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
          description="Create a client first, then add deliverables for them."
          action={<ButtonLink href="/admin/clients/new" size="sm">Add client</ButtonLink>}
        />
      ) : (
        <div className="space-y-6">
          <div className="max-w-md">
            <label htmlFor="client-select" className="mb-1.5 block text-sm font-medium">
              Client
            </label>
            <Select
              id="client-select"
              value={selected ? selected.id : ""}
              onChange={(e) =>
                router.replace(e.target.value ? `/admin/deliverables?client=${e.target.value}` : "/admin/deliverables", {
                  scroll: false,
                })
              }
            >
              <option value="">Choose a client…</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                  {c.status === "inactive" ? " (inactive)" : ""}
                </option>
              ))}
            </Select>
          </div>

          {selected ? (
            <DeliverablesManager key={selected.id} clientId={selected.id} clientName={selected.name} />
          ) : (
            <EmptyState icon={Building2} title="No client selected" description="Pick a client above to see their deliverables." />
          )}
        </div>
      )}
    </div>
  );
}

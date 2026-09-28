"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Badge, PageHeader } from "@/components/ui/Card";
import { Alert, EmptyState, friendlyError, Spinner } from "@/components/ui/feedback";
import { saveClientPrivate, updateClient } from "@/features/clients/api";
import { ClientForm } from "@/features/clients/components/ClientForm";
import { ClientUsersPanel } from "@/features/clients/components/ClientUsersPanel";
import { useClient, useClientPrivate } from "@/features/clients/hooks";
import type { Client, ClientInput } from "@/features/clients/types";
import { DeliverablesManager } from "@/features/deliverables/components/DeliverablesManager";
import { cn } from "@/lib/utils/cn";

const TABS = [
  { id: "deliverables", label: "Deliverables" },
  { id: "profile", label: "Profile" },
  { id: "users", label: "Portal users" },
] as const;
type TabId = (typeof TABS)[number]["id"];

export default function ClientProfilePage() {
  return (
    <Suspense fallback={<Spinner />}>
      <ClientProfile />
    </Suspense>
  );
}

function toInput(c: Client): ClientInput {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { id, createdAt, updatedAt, ...input } = c;
  return input;
}

function ClientProfile() {
  const { clientId } = useParams<{ clientId: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const tabParam = searchParams.get("tab");
  const tab: TabId = TABS.some((t) => t.id === tabParam) ? (tabParam as TabId) : "deliverables";

  const client = useClient(clientId);
  const priv = useClientPrivate(clientId);

  if (client.loading || priv.loading) {
    return (
      <div className="grid place-items-center py-24">
        <Spinner />
      </div>
    );
  }
  if (client.error) return <Alert>{friendlyError(client.error)}</Alert>;
  if (!client.data) return <EmptyState title="Client not found" description={<Link href="/admin/clients" className="underline">Back to clients</Link>} />;

  const c = client.data;

  return (
    <div>
      <Link href="/admin/clients" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink">
        <ArrowLeft className="size-4" /> Clients
      </Link>
      <PageHeader
        title={c.name}
        description={[c.contactName, c.contactEmail].filter(Boolean).join(" · ") || undefined}
        action={<Badge tone={c.status === "active" ? "green" : "neutral"}>{c.status === "active" ? "Active" : "Inactive"}</Badge>}
      />

      <div role="tablist" className="no-scrollbar -mx-4 mb-5 flex gap-1 overflow-x-auto border-b border-line px-4 sm:mx-0 sm:px-0">
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => router.replace(`/admin/clients/${clientId}?tab=${t.id}`, { scroll: false })}
            className={cn(
              "-mb-px shrink-0 border-b-2 px-3 py-2.5 text-sm font-medium transition-colors",
              tab === t.id ? "border-ink text-ink" : "border-transparent text-muted hover:text-ink",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "deliverables" && <DeliverablesManager clientId={clientId} clientName={c.name} />}
      {tab === "users" && <ClientUsersPanel clientId={clientId} />}
      {tab === "profile" && (
        <div className="max-w-3xl">
          {priv.error && <Alert className="mb-4">{friendlyError(priv.error)}</Alert>}
          <ClientForm
            key={c.id}
            initial={toInput(c)}
            initialPrivate={priv.data}
            submitLabel="Save changes"
            onSubmit={async (input, p) => {
              await Promise.all([updateClient(clientId, input), saveClientPrivate(clientId, p)]);
            }}
          />
        </div>
      )}
    </div>
  );
}

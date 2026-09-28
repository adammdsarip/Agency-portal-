"use client";

import { CheckCircle2, MessageSquarePlus, Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/Card";
import { FilterChips } from "@/components/ui/FilterChips";
import { Alert, EmptyState, friendlyError, Spinner } from "@/components/ui/feedback";
import { useCurrentClient } from "@/features/clients/hooks";
import { isOpen } from "@/features/requests/constants";
import { ClientRequestSheet } from "@/features/requests/components/ClientRequestSheet";
import { NewRequestSheet } from "@/features/requests/components/NewRequestSheet";
import { RequestRow } from "@/features/requests/components/presentation";
import { useClientRequests } from "@/features/requests/hooks";

type View = "open" | "closed";

const VIEWS = [
  { value: "open" as const, label: "Open" },
  { value: "closed" as const, label: "Closed" },
];

export default function RequestsPage() {
  const { clientId } = useCurrentClient();
  const { data, loading, error } = useClientRequests(clientId);
  const [view, setView] = useState<View>("open");
  const [composing, setComposing] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const [justSent, setJustSent] = useState(false);

  const visible = useMemo(
    () => data.filter((r) => (view === "open" ? isOpen(r.status) : !isOpen(r.status))),
    [data, view],
  );
  const openRequest = data.find((r) => r.id === openId) ?? null;

  return (
    <div>
      <PageHeader
        title="Requests"
        description="Ask us for anything — we'll keep you posted here."
        action={
          <Button onClick={() => setComposing(true)} className="hidden sm:inline-flex">
            <Plus className="size-4" /> New request
          </Button>
        }
      />

      <Button size="lg" className="mb-5 w-full sm:hidden" onClick={() => setComposing(true)}>
        <Plus className="size-4" /> New request
      </Button>

      {justSent && (
        <div role="status" className="mb-4 flex items-center gap-2.5 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          <CheckCircle2 className="size-4 shrink-0" /> Thanks! Your request was sent to our team.
        </div>
      )}

      <FilterChips label="Show" options={VIEWS} value={view} onChange={setView} />

      <div className="mt-4">
        {error ? (
          <Alert>{friendlyError(error)}</Alert>
        ) : loading ? (
          <div className="grid place-items-center py-16">
            <Spinner />
          </div>
        ) : visible.length === 0 ? (
          <EmptyState
            icon={MessageSquarePlus}
            title={view === "open" ? "No open requests" : "No closed requests yet"}
            description={
              view === "open"
                ? "Need a new design, video or change? Send us a request and track its progress here."
                : "Completed and withdrawn requests will appear here."
            }
            action={
              view === "open" ? (
                <Button size="sm" onClick={() => setComposing(true)}>
                  <Plus className="size-4" /> New request
                </Button>
              ) : undefined
            }
          />
        ) : (
          <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line/70 bg-surface shadow-card">
            {visible.map((r) => (
              <li key={r.id}>
                <RequestRow request={r} audience="client" onOpen={() => setOpenId(r.id)} />
              </li>
            ))}
          </ul>
        )}
      </div>

      <NewRequestSheet
        open={composing}
        clientId={clientId}
        onClose={() => setComposing(false)}
        onSubmitted={() => {
          setView("open");
          setJustSent(true);
        }}
      />
      <ClientRequestSheet request={openRequest} onClose={() => setOpenId(null)} />
    </div>
  );
}

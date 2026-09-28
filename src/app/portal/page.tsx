"use client";

import { ArrowRight, BadgeCheck, CalendarDays, Layers, MessageSquarePlus, Receipt } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Badge, Card, CardHeader } from "@/components/ui/Card";
import { EmptyState, friendlyError, Spinner } from "@/components/ui/feedback";
import { useAuth } from "@/features/auth/AuthProvider";
import { useCurrentClient } from "@/features/clients/hooks";
import { RETAINER_STATUS_LABELS } from "@/features/clients/types";
import { DeliverableRow } from "@/features/deliverables/components/DeliverableCard";
import { DeliverableDetailSheet } from "@/features/deliverables/components/DeliverableDetailSheet";
import { useClientDeliverables } from "@/features/deliverables/hooks";
import type { Deliverable } from "@/features/deliverables/types";
import { isOpen } from "@/features/requests/constants";
import { ClientRequestSheet } from "@/features/requests/components/ClientRequestSheet";
import { RequestRow } from "@/features/requests/components/presentation";
import { useClientRequests } from "@/features/requests/hooks";

function greeting(date = new Date()) {
  const h = date.getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

export default function PortalHomePage() {
  const { user } = useAuth();
  const { client, clientId } = useCurrentClient();
  const latest = useClientDeliverables(clientId, 4);
  const [open, setOpen] = useState<Deliverable | null>(null);
  const requests = useClientRequests(clientId);
  const openRequests = requests.data.filter((r) => isOpen(r.status));
  const [openRequestId, setOpenRequestId] = useState<string | null>(null);

  const firstName = user?.displayName?.split(" ")[0];
  const retainerTone = { active: "green", paused: "amber", ended: "neutral", none: "neutral" } as const;

  return (
    <div className="space-y-6">
      <header className="pt-2">
        <p className="text-sm text-muted">{client.name}</p>
        <h1 className="mt-1 text-[28px] leading-tight font-semibold tracking-tight">
          {greeting()}
          {firstName ? `, ${firstName}` : ""}
        </h1>
      </header>

      {/* Retainer */}
      <Card className="overflow-hidden bg-ink text-white">
        <div className="flex items-center justify-between gap-4 p-5">
          <div className="min-w-0">
            <p className="flex items-center gap-1.5 text-xs font-medium tracking-wide text-white/60 uppercase">
              <BadgeCheck className="size-3.5" /> Retainer
            </p>
            <p className="mt-1.5 truncate text-lg font-semibold">
              {client.retainer.planName || RETAINER_STATUS_LABELS[client.retainer.status]}
            </p>
          </div>
          <Badge tone={retainerTone[client.retainer.status]} className="shrink-0">
            {RETAINER_STATUS_LABELS[client.retainer.status]}
          </Badge>
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Latest deliverables — live from Firestore */}
        <Card className="lg:row-span-2">
          <CardHeader
            title="Latest deliverables"
            icon={Layers}
            action={
              <Link href="/portal/deliverables" className="flex items-center gap-1 text-sm font-medium text-muted hover:text-ink">
                View all <ArrowRight className="size-4" />
              </Link>
            }
          />
          <div className="px-3 pb-3">
            {latest.loading ? (
              <div className="grid place-items-center py-10">
                <Spinner />
              </div>
            ) : latest.error ? (
              <p className="px-2 py-6 text-center text-sm text-danger">{friendlyError(latest.error)}</p>
            ) : latest.data.length === 0 ? (
              <EmptyState compact title="Nothing delivered yet" description="New work will appear here as soon as it's shared with you." />
            ) : (
              latest.data.map((d) => <DeliverableRow key={d.id} deliverable={d} onOpen={() => setOpen(d)} />)
            )}
          </div>
        </Card>

        {/* Calendar and invoices aren't built yet: honest empty states, no fake data. */}
        <Card>
          <CardHeader title="Upcoming content" icon={CalendarDays} />
          <EmptyState compact title="Your content calendar is coming soon" description="Scheduled posts and campaigns will show here." />
        </Card>
        <Card>
          <CardHeader title="Upcoming invoice" icon={Receipt} />
          <EmptyState compact title="No invoices to show" description="Invoices and payments will be available in the portal soon." />
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader
            title={openRequests.length ? `Open requests · ${openRequests.length}` : "Open requests"}
            icon={MessageSquarePlus}
            action={
              <Link href="/portal/requests" className="flex items-center gap-1 text-sm font-medium text-muted hover:text-ink">
                Requests <ArrowRight className="size-4" />
              </Link>
            }
          />
          {requests.loading ? (
            <div className="grid place-items-center py-8">
              <Spinner />
            </div>
          ) : requests.error ? (
            <p className="px-5 pb-5 text-sm text-danger">{friendlyError(requests.error)}</p>
          ) : openRequests.length === 0 ? (
            <EmptyState
              compact
              title="No open requests"
              description={
                <>
                  Need something?{" "}
                  <Link href="/portal/requests" className="font-medium text-ink underline underline-offset-2">
                    Send us a request
                  </Link>
                </>
              }
            />
          ) : (
            <ul className="divide-y divide-line border-t border-line">
              {openRequests.slice(0, 3).map((r) => (
                <li key={r.id}>
                  <RequestRow request={r} audience="client" onOpen={() => setOpenRequestId(r.id)} />
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <DeliverableDetailSheet deliverable={open} onClose={() => setOpen(null)} />
      <ClientRequestSheet
        request={requests.data.find((r) => r.id === openRequestId) ?? null}
        onClose={() => setOpenRequestId(null)}
      />
    </div>
  );
}

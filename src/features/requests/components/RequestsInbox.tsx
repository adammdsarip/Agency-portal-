"use client";

import { Inbox, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { FilterChips } from "@/components/ui/FilterChips";
import { Alert, EmptyState, friendlyError, Spinner } from "@/components/ui/feedback";
import { useClients } from "@/features/clients/hooks";
import { isOpen } from "../constants";
import { useAllRequests, useClientRequests } from "../hooks";
import type { ClientRequest } from "../types";
import { AdminRequestSheet } from "./AdminRequestSheet";
import { RequestRow } from "./presentation";

type View = "open" | "completed" | "cancelled" | "all";

const VIEWS = [
  { value: "open" as const, label: "Open" },
  { value: "completed" as const, label: "Completed" },
  { value: "cancelled" as const, label: "Cancelled" },
  { value: "all" as const, label: "All" },
];

function matchesView(r: ClientRequest, view: View) {
  if (view === "all") return true;
  if (view === "open") return isOpen(r.status);
  return r.status === view;
}

/**
 * Admin request management. With `clientId` it shows one client's requests
 * (client profile tab); without, it's the cross-client inbox.
 */
export function RequestsInbox({ clientId }: { clientId?: string }) {
  const [view, setView] = useState<View>("open");
  const [search, setSearch] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  // Cross-client "Open" view uses a server-side status filter; other views load the latest of any status.
  const perClient = useClientRequests(clientId ?? null);
  const global = useAllRequests(view === "open", !clientId);
  const source = clientId ? perClient : global;
  const clients = useClients(!clientId);

  const clientNames = useMemo(() => new Map(clients.data.map((c) => [c.id, c.name])), [clients.data]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return source.data.filter((r) => {
      if (!matchesView(r, view)) return false;
      if (!q) return true;
      return [r.title, r.description, r.createdByName, r.createdByEmail, clientNames.get(r.clientId) ?? ""].some((v) =>
        v.toLowerCase().includes(q),
      );
    });
  }, [source.data, view, search, clientNames]);

  const openRequest = source.data.find((r) => r.id === openId) ?? null;

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-faint" />
        <input
          type="search"
          aria-label="Search requests"
          placeholder={clientId ? "Search requests" : "Search requests or clients"}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-11 w-full rounded-xl border border-line bg-surface pr-3 pl-10 text-[15px] placeholder:text-faint focus:border-ink focus:ring-4 focus:ring-ink/5 focus:outline-none"
        />
      </div>
      <FilterChips label="Show" options={VIEWS} value={view} onChange={setView} />

      {source.error ? (
        <Alert>{friendlyError(source.error)}</Alert>
      ) : source.loading ? (
        <div className="grid place-items-center py-16">
          <Spinner />
        </div>
      ) : visible.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title={view === "open" ? "Inbox zero" : "No requests here"}
          description={view === "open" ? "New client requests will appear here instantly." : undefined}
        />
      ) : (
        <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line/70 bg-surface shadow-card">
          {visible.map((r) => (
            <li key={r.id}>
              <RequestRow
                request={r}
                audience="admin"
                subtitle={clientId ? undefined : clientNames.get(r.clientId) ?? "Unknown client"}
                onOpen={() => setOpenId(r.id)}
              />
            </li>
          ))}
        </ul>
      )}

      <AdminRequestSheet
        request={openRequest}
        clientName={clientId ? undefined : clientNames.get(openRequest?.clientId ?? "")}
        onClose={() => setOpenId(null)}
      />
    </div>
  );
}

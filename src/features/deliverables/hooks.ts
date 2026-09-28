"use client";

import { useSubscription } from "@/lib/useSubscription";
import { subscribeAdminDeliverables, subscribeClientDeliverables } from "./api";
import { DELIVERABLES_PAGE_LIMIT } from "./constants";
import type { Deliverable } from "./types";

const EMPTY: Deliverable[] = [];

export function useClientDeliverables(clientId: string | null, max = DELIVERABLES_PAGE_LIMIT) {
  return useSubscription<Deliverable[]>(clientId ? `${clientId}:${max}` : null, EMPTY, (onData, onError) =>
    subscribeClientDeliverables(clientId!, onData, onError, max),
  );
}

export function useAdminDeliverables(clientId: string | null, includeArchived: boolean) {
  return useSubscription<Deliverable[]>(
    clientId ? `${clientId}:${includeArchived}` : null,
    EMPTY,
    (onData, onError) => subscribeAdminDeliverables(clientId!, includeArchived, onData, onError),
  );
}

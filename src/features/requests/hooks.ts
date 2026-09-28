"use client";

import { useSubscription } from "@/lib/useSubscription";
import { subscribeAllRequests, subscribeClientRequests } from "./api";
import type { ClientRequest } from "./types";

const EMPTY: ClientRequest[] = [];

export function useClientRequests(clientId: string | null) {
  return useSubscription<ClientRequest[]>(clientId, EMPTY, (onData, onError) =>
    subscribeClientRequests(clientId!, onData, onError),
  );
}

export function useAllRequests(openOnly: boolean, enabled = true) {
  const key = enabled ? (openOnly ? "open" : "all") : null;
  return useSubscription<ClientRequest[]>(key, EMPTY, (onData, onError) =>
    subscribeAllRequests(openOnly, onData, onError),
  );
}

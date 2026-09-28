"use client";

import { createContext, useContext } from "react";
import { useSubscription } from "@/lib/useSubscription";
import { subscribeClient, subscribeClientPrivate, subscribeClients } from "./api";
import type { Client, ClientPrivateProfile } from "./types";

const NO_CLIENTS: Client[] = [];
const EMPTY_PRIVATE: ClientPrivateProfile = { internalNotes: "", billingEmail: "" };

export function useClients(enabled = true) {
  return useSubscription<Client[]>(enabled ? "all" : null, NO_CLIENTS, subscribeClients);
}

export function useClient(clientId: string | null) {
  return useSubscription<Client | null>(clientId, null, (onData, onError) =>
    subscribeClient(clientId!, onData, onError),
  );
}

export function useClientPrivate(clientId: string | null) {
  return useSubscription<ClientPrivateProfile>(clientId, EMPTY_PRIVATE, (onData, onError) =>
    subscribeClientPrivate(clientId!, onData, onError),
  );
}

/** The signed-in client user's company, loaded once by the portal layout. */
export const CurrentClientContext = createContext<{ client: Client; clientId: string } | null>(null);

export function useCurrentClient() {
  const ctx = useContext(CurrentClientContext);
  if (!ctx) throw new Error("useCurrentClient must be used inside the client portal layout");
  return ctx;
}

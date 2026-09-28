import type { Timestamp } from "firebase/firestore";

export const CLIENT_STATUSES = ["active", "inactive"] as const;
export type ClientStatus = (typeof CLIENT_STATUSES)[number];

export const RETAINER_STATUSES = ["active", "paused", "ended", "none"] as const;
export type RetainerStatus = (typeof RETAINER_STATUSES)[number];

export const RETAINER_STATUS_LABELS: Record<RetainerStatus, string> = {
  active: "Active",
  paused: "Paused",
  ended: "Ended",
  none: "No retainer",
};

/** Client-visible company profile: clients/{clientId}. */
export interface Client {
  id: string;
  name: string;
  status: ClientStatus;
  contactName: string;
  contactEmail: string;
  phone: string;
  website: string;
  industry: string;
  logoUrl: string;
  driveFolderUrl: string;
  retainer: { status: RetainerStatus; planName: string };
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
}

export type ClientInput = Omit<Client, "id" | "createdAt" | "updatedAt">;

/** Admin-only data: clients/{clientId}/private/profile. */
export interface ClientPrivateProfile {
  internalNotes: string;
  billingEmail: string;
}

export const EMPTY_CLIENT_INPUT: ClientInput = {
  name: "",
  status: "active",
  contactName: "",
  contactEmail: "",
  phone: "",
  website: "",
  industry: "",
  logoUrl: "",
  driveFolderUrl: "",
  retainer: { status: "none", planName: "" },
};

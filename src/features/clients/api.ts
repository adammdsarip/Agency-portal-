"use client";

import {
  collection,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
  type DocumentData,
  type Unsubscribe,
} from "firebase/firestore";
import { firebaseAuth, firestore } from "@/lib/firebase/client";
import type { Client, ClientInput, ClientPrivateProfile } from "./types";

function toClient(id: string, d: DocumentData): Client {
  return {
    id,
    name: d.name ?? "",
    status: d.status ?? "inactive",
    contactName: d.contactName ?? "",
    contactEmail: d.contactEmail ?? "",
    phone: d.phone ?? "",
    website: d.website ?? "",
    industry: d.industry ?? "",
    logoUrl: d.logoUrl ?? "",
    driveFolderUrl: d.driveFolderUrl ?? "",
    retainer: {
      status: d.retainer?.status ?? "none",
      planName: d.retainer?.planName ?? "",
    },
    createdAt: d.createdAt ?? null,
    updatedAt: d.updatedAt ?? null,
  };
}

function currentUid(): string {
  const uid = firebaseAuth().currentUser?.uid;
  if (!uid) throw new Error("Not signed in.");
  return uid;
}

/** Only fields allowed by the rules are written, whatever the caller passes. */
function pickClientInput(input: ClientInput): ClientInput {
  return {
    name: input.name.trim(),
    status: input.status,
    contactName: input.contactName.trim(),
    contactEmail: input.contactEmail.trim(),
    phone: input.phone.trim(),
    website: input.website.trim(),
    industry: input.industry.trim(),
    logoUrl: input.logoUrl.trim(),
    driveFolderUrl: input.driveFolderUrl.trim(),
    retainer: { status: input.retainer.status, planName: input.retainer.planName.trim() },
  };
}

/** Admin: all clients. ~100 clients fits comfortably in one listener. */
export function subscribeClients(
  onData: (clients: Client[]) => void,
  onError: (e: Error) => void,
): Unsubscribe {
  const q = query(collection(firestore(), "clients"), orderBy("name"), limit(1000));
  return onSnapshot(
    q,
    (snap) => onData(snap.docs.map((d) => toClient(d.id, d.data({ serverTimestamps: "estimate" })))),
    onError,
  );
}

/** Admin: any client. Client users: only their own (enforced by rules). */
export function subscribeClient(
  clientId: string,
  onData: (client: Client | null) => void,
  onError: (e: Error) => void,
): Unsubscribe {
  return onSnapshot(
    doc(firestore(), "clients", clientId),
    (snap) => onData(snap.exists() ? toClient(snap.id, snap.data({ serverTimestamps: "estimate" })) : null),
    onError,
  );
}

export function subscribeClientPrivate(
  clientId: string,
  onData: (profile: ClientPrivateProfile) => void,
  onError: (e: Error) => void,
): Unsubscribe {
  return onSnapshot(
    doc(firestore(), "clients", clientId, "private", "profile"),
    (snap) => {
      const d = snap.data() ?? {};
      onData({ internalNotes: d.internalNotes ?? "", billingEmail: d.billingEmail ?? "" });
    },
    onError,
  );
}

export async function createClient(input: ClientInput, privateProfile: ClientPrivateProfile): Promise<string> {
  const db = firestore();
  const uid = currentUid();
  const ref = doc(collection(db, "clients"));
  // One atomic batch: the public profile and the admin-only profile are created together.
  const batch = writeBatch(db);
  batch.set(ref, {
    ...pickClientInput(input),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    createdBy: uid,
    updatedBy: uid,
  });
  batch.set(doc(db, "clients", ref.id, "private", "profile"), {
    internalNotes: privateProfile.internalNotes,
    billingEmail: privateProfile.billingEmail.trim(),
    updatedAt: serverTimestamp(),
    updatedBy: uid,
  });
  await batch.commit();
  return ref.id;
}

export async function updateClient(clientId: string, input: ClientInput): Promise<void> {
  await updateDoc(doc(firestore(), "clients", clientId), {
    ...pickClientInput(input),
    updatedAt: serverTimestamp(),
    updatedBy: currentUid(),
  });
}

export async function saveClientPrivate(clientId: string, profile: ClientPrivateProfile): Promise<void> {
  await setDoc(doc(firestore(), "clients", clientId, "private", "profile"), {
    internalNotes: profile.internalNotes,
    billingEmail: profile.billingEmail.trim(),
    updatedAt: serverTimestamp(),
    updatedBy: currentUid(),
  });
}

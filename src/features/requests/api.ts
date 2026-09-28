"use client";

import {
  addDoc,
  collection,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
  type DocumentData,
  type QueryDocumentSnapshot,
  type Unsubscribe,
} from "firebase/firestore";
import { firebaseAuth, firestore } from "@/lib/firebase/client";
import { OPEN_REQUEST_STATUSES, REQUESTS_PAGE_LIMIT } from "./constants";
import type { ClientRequest, NewRequestInput, RequestAdminUpdate } from "./types";

function toRequest(snap: QueryDocumentSnapshot<DocumentData>): ClientRequest {
  const d = snap.data({ serverTimestamps: "estimate" });
  return {
    id: snap.id,
    clientId: d.clientId,
    title: d.title ?? "",
    description: d.description ?? "",
    category: d.category ?? "other",
    priority: d.priority ?? "normal",
    fileUrl: d.fileUrl ?? "",
    neededBy: d.neededBy ?? null,
    status: d.status ?? "submitted",
    adminResponse: d.adminResponse ?? "",
    createdByName: d.createdByName ?? "",
    createdByEmail: d.createdByEmail ?? "",
    createdAt: d.createdAt ?? null,
    updatedAt: d.updatedAt ?? null,
    createdBy: d.createdBy ?? "",
    updatedBy: d.updatedBy ?? "",
  };
}

const requestsCol = () => collection(firestore(), "requests");

function currentUser() {
  const user = firebaseAuth().currentUser;
  if (!user) throw new Error("Not signed in.");
  return user;
}

type Listener = (items: ClientRequest[]) => void;
type ErrorListener = (error: Error) => void;

/** One company's requests (client portal, and the admin client profile). Scoped as the rules require. */
export function subscribeClientRequests(clientId: string, onData: Listener, onError: ErrorListener): Unsubscribe {
  const q = query(requestsCol(), where("clientId", "==", clientId), orderBy("createdAt", "desc"), limit(REQUESTS_PAGE_LIMIT));
  return onSnapshot(q, (snap) => onData(snap.docs.map(toRequest)), onError);
}

/** Admin inbox across all clients: open requests only, or the most recent of any status. */
export function subscribeAllRequests(openOnly: boolean, onData: Listener, onError: ErrorListener): Unsubscribe {
  const q = openOnly
    ? query(requestsCol(), where("status", "in", [...OPEN_REQUEST_STATUSES]), orderBy("createdAt", "desc"), limit(REQUESTS_PAGE_LIMIT))
    : query(requestsCol(), orderBy("createdAt", "desc"), limit(REQUESTS_PAGE_LIMIT));
  return onSnapshot(q, (snap) => onData(snap.docs.map(toRequest)), onError);
}

/**
 * Client submits a request. Identity fields come from the signed-in user and are
 * re-checked by the rules against the verified token, so they can't be spoofed.
 */
export async function submitRequest(clientId: string, input: NewRequestInput): Promise<string> {
  const user = currentUser();
  // Read name/email from the same ID token the rules will check them against.
  const token = await user.getIdTokenResult();
  const ref = await addDoc(requestsCol(), {
    ...input,
    clientId,
    status: "submitted",
    adminResponse: "",
    createdByName: typeof token.claims.name === "string" ? token.claims.name : "",
    createdByEmail: typeof token.claims.email === "string" ? token.claims.email : "",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    createdBy: user.uid,
    updatedBy: user.uid,
  });
  return ref.id;
}

/** Client: withdraw a request the agency hasn't started yet. */
export async function cancelRequest(id: string): Promise<void> {
  await updateDoc(doc(firestore(), "requests", id), {
    status: "cancelled",
    updatedAt: serverTimestamp(),
    updatedBy: currentUser().uid,
  });
}

/** Admin: change status and/or reply to the client. */
export async function updateRequestAsAdmin(id: string, update: RequestAdminUpdate): Promise<void> {
  await updateDoc(doc(firestore(), "requests", id), {
    status: update.status,
    adminResponse: update.adminResponse.trim(),
    updatedAt: serverTimestamp(),
    updatedBy: currentUser().uid,
  });
}

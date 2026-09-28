"use client";

import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  where,
  type DocumentData,
  type Unsubscribe,
} from "firebase/firestore";
import { sendPasswordResetEmail } from "firebase/auth";
import { firebaseAuth, firestore } from "@/lib/firebase/client";
import type { UserProfile } from "@/features/auth/types";

function toProfile(uid: string, d: DocumentData): UserProfile {
  return {
    uid,
    email: d.email ?? "",
    displayName: d.displayName ?? "",
    role: d.role,
    clientId: d.clientId ?? null,
    disabled: Boolean(d.disabled),
  };
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const snap = await getDoc(doc(firestore(), "users", uid));
  return snap.exists() ? toProfile(snap.id, snap.data()) : null;
}

/** Admin: portal logins belonging to one client. */
export function subscribeClientUsers(
  clientId: string,
  onData: (users: UserProfile[]) => void,
  onError: (e: Error) => void,
): Unsubscribe {
  const q = query(collection(firestore(), "users"), where("clientId", "==", clientId));
  return onSnapshot(q, (snap) => onData(snap.docs.map((d) => toProfile(d.id, d.data()))), onError);
}

// ---- Server-backed admin actions (they change who can access what) ----

async function adminFetch<T>(path: string, init: RequestInit): Promise<T> {
  const user = firebaseAuth().currentUser;
  if (!user) throw new Error("Not signed in.");
  const token = await user.getIdToken();
  const res = await fetch(path, {
    ...init,
    headers: { "content-type": "application/json", authorization: `Bearer ${token}`, ...init.headers },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error ?? `Request failed (${res.status})`);
  return body as T;
}

export function inviteClientUser(clientId: string, input: { email: string; displayName: string }) {
  return adminFetch<{ uid: string; passwordSetupLink: string | null }>(
    `/api/admin/clients/${encodeURIComponent(clientId)}/users`,
    { method: "POST", body: JSON.stringify(input) },
  );
}

export function setClientUserDisabled(uid: string, disabled: boolean) {
  return adminFetch<{ ok: true }>(`/api/admin/users/${encodeURIComponent(uid)}`, {
    method: "PATCH",
    body: JSON.stringify({ disabled }),
  });
}

/** Firebase sends its standard password-reset email, which doubles as an invite. */
export function emailPasswordSetupLink(email: string) {
  return sendPasswordResetEmail(firebaseAuth(), email);
}

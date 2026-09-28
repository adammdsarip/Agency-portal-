"use client";

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
  type FirestoreDataConverter,
  type QueryDocumentSnapshot,
  type Unsubscribe,
} from "firebase/firestore";
import { firebaseAuth, firestore } from "@/lib/firebase/client";
import { DELIVERABLES_PAGE_LIMIT } from "./constants";
import type { Deliverable, DeliverableInput } from "./types";

const converter: FirestoreDataConverter<Deliverable> = {
  toFirestore: (d) => d,
  fromFirestore: (snap: QueryDocumentSnapshot) => {
    const d = snap.data({ serverTimestamps: "estimate" });
    return {
      id: snap.id,
      clientId: d.clientId,
      title: d.title ?? "",
      description: d.description ?? "",
      category: d.category ?? "other",
      status: d.status ?? "draft",
      previewUrl: d.previewUrl ?? "",
      googleDriveUrl: d.googleDriveUrl ?? "",
      deliveryDate: d.deliveryDate ?? null,
      notes: d.notes ?? "",
      archived: Boolean(d.archived),
      createdAt: d.createdAt ?? null,
      updatedAt: d.updatedAt ?? null,
      createdBy: d.createdBy ?? "",
      updatedBy: d.updatedBy ?? "",
    };
  },
};

const deliverablesCol = () => collection(firestore(), "deliverables").withConverter(converter);

function currentUid(): string {
  const uid = firebaseAuth().currentUser?.uid;
  if (!uid) throw new Error("Not signed in.");
  return uid;
}

type Listener = (items: Deliverable[]) => void;
type ErrorListener = (error: Error) => void;

/**
 * Client portal query. Its shape (clientId == own id AND archived == false) is
 * what the security rules require — an unscoped query is rejected by Firestore.
 */
export function subscribeClientDeliverables(
  clientId: string,
  onData: Listener,
  onError: ErrorListener,
  max = DELIVERABLES_PAGE_LIMIT,
): Unsubscribe {
  const q = query(
    deliverablesCol(),
    where("clientId", "==", clientId),
    where("archived", "==", false),
    orderBy("createdAt", "desc"),
    limit(max),
  );
  return onSnapshot(q, (snap) => onData(snap.docs.map((d) => d.data())), onError);
}

/** Admin query for one client, optionally including archived items. */
export function subscribeAdminDeliverables(
  clientId: string,
  includeArchived: boolean,
  onData: Listener,
  onError: ErrorListener,
): Unsubscribe {
  const constraints = includeArchived
    ? [where("clientId", "==", clientId)]
    : [where("clientId", "==", clientId), where("archived", "==", false)];
  const q = query(
    deliverablesCol(),
    ...constraints,
    orderBy("createdAt", "desc"),
    limit(DELIVERABLES_PAGE_LIMIT),
  );
  return onSnapshot(q, (snap) => onData(snap.docs.map((d) => d.data())), onError);
}

export async function createDeliverable(clientId: string, input: DeliverableInput): Promise<string> {
  const uid = currentUid();
  // Written without the converter: server timestamps are sentinels, not Timestamps.
  const ref = await addDoc(collection(firestore(), "deliverables"), {
    ...input,
    clientId,
    archived: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    createdBy: uid,
    updatedBy: uid,
  });
  return ref.id;
}

export async function updateDeliverable(
  id: string,
  changes: Partial<DeliverableInput> & { archived?: boolean },
): Promise<void> {
  await updateDoc(doc(firestore(), "deliverables", id), {
    ...changes,
    updatedAt: serverTimestamp(),
    updatedBy: currentUid(),
  });
}

export function setDeliverableArchived(id: string, archived: boolean) {
  return updateDeliverable(id, { archived });
}

export function deleteDeliverable(id: string) {
  return deleteDoc(doc(firestore(), "deliverables", id));
}

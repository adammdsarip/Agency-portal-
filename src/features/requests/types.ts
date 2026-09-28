import type { Timestamp } from "firebase/firestore";
import type { DeliverableCategory } from "@/features/deliverables/constants";
import type { RequestPriority, RequestStatus } from "./constants";

export interface ClientRequest {
  /** Firestore document id. */
  id: string;
  clientId: string;
  title: string;
  description: string;
  category: DeliverableCategory;
  priority: RequestPriority;
  /** Optional https link to a file (Drive, Dropbox, WeTransfer…). */
  fileUrl: string;
  neededBy: Timestamp | null;
  status: RequestStatus;
  /** Agency reply, visible to the client. */
  adminResponse: string;
  createdByName: string;
  createdByEmail: string;
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
  createdBy: string;
  updatedBy: string;
}

/** What a client fills in when submitting a request. */
export interface NewRequestInput {
  title: string;
  description: string;
  category: DeliverableCategory;
  priority: RequestPriority;
  fileUrl: string;
  neededBy: Timestamp | null;
}

/** What an admin changes when handling a request. */
export interface RequestAdminUpdate {
  status: RequestStatus;
  adminResponse: string;
}

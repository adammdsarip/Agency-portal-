import type { Timestamp } from "firebase/firestore";
import type { DeliverableCategory, DeliverableStatus } from "./constants";

export interface Deliverable {
  /** Firestore document id. */
  id: string;
  clientId: string;
  title: string;
  description: string;
  category: DeliverableCategory;
  status: DeliverableStatus;
  previewUrl: string;
  googleDriveUrl: string;
  deliveryDate: Timestamp | null;
  notes: string;
  archived: boolean;
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
  createdBy: string;
  updatedBy: string;
}

/** Fields an admin edits in the form. */
export interface DeliverableInput {
  title: string;
  description: string;
  category: DeliverableCategory;
  status: DeliverableStatus;
  previewUrl: string;
  googleDriveUrl: string;
  deliveryDate: Timestamp | null;
  notes: string;
}

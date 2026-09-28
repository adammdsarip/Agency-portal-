// Stored values are stable slugs; keep in sync with the enums in firestore.rules.
// Request types reuse the deliverable categories so a request can later be
// fulfilled by a deliverable of the same kind.
export { DELIVERABLE_CATEGORIES as REQUEST_CATEGORIES, CATEGORY_LABELS } from "@/features/deliverables/constants";

export const REQUEST_STATUSES = ["submitted", "in_progress", "waiting_on_client", "completed", "cancelled"] as const;
export type RequestStatus = (typeof REQUEST_STATUSES)[number];

export const OPEN_REQUEST_STATUSES: readonly RequestStatus[] = ["submitted", "in_progress", "waiting_on_client"];

export const REQUEST_PRIORITIES = ["normal", "urgent"] as const;
export type RequestPriority = (typeof REQUEST_PRIORITIES)[number];

/** Labels from the agency's point of view. */
export const ADMIN_STATUS_LABELS: Record<RequestStatus, string> = {
  submitted: "New",
  in_progress: "In Progress",
  waiting_on_client: "Waiting on client",
  completed: "Completed",
  cancelled: "Cancelled",
};

/** Labels from the client's point of view. */
export const CLIENT_STATUS_LABELS: Record<RequestStatus, string> = {
  submitted: "Submitted",
  in_progress: "In Progress",
  waiting_on_client: "Needs your input",
  completed: "Completed",
  cancelled: "Cancelled",
};

export const REQUESTS_PAGE_LIMIT = 200;

export function isOpen(status: RequestStatus) {
  return OPEN_REQUEST_STATUSES.includes(status);
}

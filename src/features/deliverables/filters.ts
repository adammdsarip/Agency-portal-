import {
  CATEGORY_LABELS,
  DELIVERABLE_CATEGORIES,
  DELIVERABLE_STATUSES,
  STATUS_LABELS,
  type DeliverableCategory,
  type DeliverableStatus,
} from "./constants";
import type { Deliverable } from "./types";

// UX filtering over the already-authorized result set. Security never depends
// on this: the Firestore query itself is scoped to the user's client by the rules.

export type CategoryFilter = DeliverableCategory | "all";
export type StatusFilter = DeliverableStatus | "all";

export const CATEGORY_FILTER_OPTIONS = [
  { value: "all" as const, label: "All" },
  ...DELIVERABLE_CATEGORIES.map((value) => ({ value, label: CATEGORY_LABELS[value] })),
];

export const STATUS_FILTER_OPTIONS = [
  { value: "all" as const, label: "Any status" },
  ...DELIVERABLE_STATUSES.map((value) => ({ value, label: STATUS_LABELS[value] })),
];

export function filterDeliverables(
  items: Deliverable[],
  { search, category, status }: { search: string; category: CategoryFilter; status: StatusFilter },
): Deliverable[] {
  const terms = search.trim().toLowerCase().split(/\s+/).filter(Boolean);
  return items.filter((d) => {
    if (category !== "all" && d.category !== category) return false;
    if (status !== "all" && d.status !== status) return false;
    if (terms.length === 0) return true;
    const haystack = `${d.title} ${d.description} ${d.notes} ${CATEGORY_LABELS[d.category]}`.toLowerCase();
    return terms.every((t) => haystack.includes(t));
  });
}

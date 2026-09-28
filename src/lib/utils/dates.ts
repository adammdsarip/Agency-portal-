import { Timestamp } from "firebase/firestore";

// Date-only values (e.g. delivery dates) are stored as 00:00 UTC and always
// formatted in UTC, so they show the same calendar day in every time zone.

export function dateInputToTimestamp(value: string): Timestamp | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  return Timestamp.fromDate(new Date(`${value}T00:00:00Z`));
}

export function timestampToDateInput(ts: Timestamp | null | undefined): string {
  return ts ? ts.toDate().toISOString().slice(0, 10) : "";
}

export function formatDate(ts: Timestamp | null | undefined): string {
  if (!ts) return "";
  return ts.toDate().toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

/** For real moments in time (createdAt etc.) shown in the viewer's time zone. */
export function formatDateTime(ts: Timestamp | null | undefined): string {
  if (!ts) return "";
  return ts.toDate().toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" });
}

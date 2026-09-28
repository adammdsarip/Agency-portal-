// Stored values are stable slugs; labels are presentation only. Keep these in
// sync with the enums in firestore.rules.

export const DELIVERABLE_CATEGORIES = [
  "design",
  "video",
  "photo",
  "document",
  "social_media",
  "website",
  "other",
] as const;

export const DELIVERABLE_STATUSES = ["draft", "in_review", "approved", "completed"] as const;

export type DeliverableCategory = (typeof DELIVERABLE_CATEGORIES)[number];
export type DeliverableStatus = (typeof DELIVERABLE_STATUSES)[number];

export const CATEGORY_LABELS: Record<DeliverableCategory, string> = {
  design: "Design",
  video: "Video",
  photo: "Photo",
  document: "Document",
  social_media: "Social Media",
  website: "Website",
  other: "Other",
};

export const STATUS_LABELS: Record<DeliverableStatus, string> = {
  draft: "Draft",
  in_review: "In Review",
  approved: "Approved",
  completed: "Completed",
};

/** Max documents a single listener loads. Paginate when a client exceeds this. */
export const DELIVERABLES_PAGE_LIMIT = 300;

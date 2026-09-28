"use client";

import {
  Camera,
  Clapperboard,
  FileText,
  Globe,
  Palette,
  Shapes,
  Share2,
  type LucideIcon,
} from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/Card";
import { cn } from "@/lib/utils/cn";
import { safeHref } from "@/lib/utils/urls";
import {
  CATEGORY_LABELS,
  STATUS_LABELS,
  type DeliverableCategory,
  type DeliverableStatus,
} from "../constants";

export const CATEGORY_ICONS: Record<DeliverableCategory, LucideIcon> = {
  design: Palette,
  video: Clapperboard,
  photo: Camera,
  document: FileText,
  social_media: Share2,
  website: Globe,
  other: Shapes,
};

const CATEGORY_TINTS: Record<DeliverableCategory, string> = {
  design: "from-violet-100 to-fuchsia-50 text-violet-700",
  video: "from-rose-100 to-orange-50 text-rose-700",
  photo: "from-amber-100 to-yellow-50 text-amber-700",
  document: "from-slate-200 to-slate-50 text-slate-700",
  social_media: "from-pink-100 to-violet-50 text-pink-700",
  website: "from-sky-100 to-cyan-50 text-sky-700",
  other: "from-stone-200 to-stone-50 text-stone-700",
};

const STATUS_TONES = {
  draft: "neutral",
  in_review: "amber",
  approved: "blue",
  completed: "green",
} as const;

export function StatusBadge({ status }: { status: DeliverableStatus }) {
  return (
    <Badge tone={STATUS_TONES[status]}>
      <span className="size-1.5 rounded-full bg-current opacity-70" aria-hidden />
      {STATUS_LABELS[status]}
    </Badge>
  );
}

export function CategoryLabel({ category, className }: { category: DeliverableCategory; className?: string }) {
  const Icon = CATEGORY_ICONS[category];
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-xs font-medium text-muted", className)}>
      <Icon className="size-3.5" aria-hidden />
      {CATEGORY_LABELS[category]}
    </span>
  );
}

/**
 * Preview image, or a branded category tile when there is no (loadable) preview.
 * Only https URLs are ever rendered.
 */
export function DeliverablePreview({
  previewUrl,
  category,
  title,
  className,
  iconSize = "size-7",
}: {
  previewUrl: string;
  category: DeliverableCategory;
  title: string;
  className?: string;
  iconSize?: string;
}) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const src = safeHref(previewUrl);
  const Icon = CATEGORY_ICONS[category];

  if (src && failedSrc !== src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- arbitrary external hosts (Drive, CDNs)
      <img
        src={src}
        alt={`Preview of ${title}`}
        loading="lazy"
        referrerPolicy="no-referrer"
        onError={() => setFailedSrc(src)}
        className={cn("bg-subtle object-cover", className)}
      />
    );
  }
  return (
    <div className={cn("grid place-items-center bg-gradient-to-br", CATEGORY_TINTS[category], className)} aria-hidden>
      <Icon className={cn(iconSize, "opacity-80")} strokeWidth={1.6} />
    </div>
  );
}

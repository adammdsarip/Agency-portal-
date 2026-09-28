"use client";

import { CalendarDays } from "lucide-react";
import { ComingSoon } from "@/components/layout/ComingSoon";

export default function CalendarPage() {
  return (
    <ComingSoon
      title="Calendar"
      icon={CalendarDays}
      description="Your content calendar — upcoming Instagram and TikTok posts, shoots and launches — will live here."
    />
  );
}

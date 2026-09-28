"use client";

import { MessageSquarePlus } from "lucide-react";
import { ComingSoon } from "@/components/layout/ComingSoon";

export default function RequestsPage() {
  return (
    <ComingSoon
      title="Requests"
      icon={MessageSquarePlus}
      description="Soon you'll be able to send us new requests, attach file links and follow their progress here."
    />
  );
}

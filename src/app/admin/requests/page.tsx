"use client";

import { PageHeader } from "@/components/ui/Card";
import { RequestsInbox } from "@/features/requests/components/RequestsInbox";

export default function AdminRequestsPage() {
  return (
    <div>
      <PageHeader title="Requests" description="Everything your clients have asked for, across all accounts." />
      <RequestsInbox />
    </div>
  );
}

"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/ui/Card";
import { createClient } from "@/features/clients/api";
import { ClientForm } from "@/features/clients/components/ClientForm";
import { EMPTY_CLIENT_INPUT } from "@/features/clients/types";

export default function NewClientPage() {
  const router = useRouter();
  return (
    <div className="max-w-3xl">
      <Link href="/admin/clients" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink">
        <ArrowLeft className="size-4" /> Clients
      </Link>
      <PageHeader title="Add client" description="You can invite portal users after the client is created." />
      <ClientForm
        initial={EMPTY_CLIENT_INPUT}
        initialPrivate={{ internalNotes: "", billingEmail: "" }}
        submitLabel="Create client"
        onCancel={() => router.push("/admin/clients")}
        onSubmit={async (client, priv) => {
          const id = await createClient(client, priv);
          router.replace(`/admin/clients/${id}?tab=users`);
        }}
      />
    </div>
  );
}

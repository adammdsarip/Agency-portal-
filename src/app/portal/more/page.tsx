"use client";

import { FolderOpen, Globe, LogOut, MessagesSquare, Receipt, Shapes } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, PageHeader } from "@/components/ui/Card";
import { useAuth } from "@/features/auth/AuthProvider";
import { useCurrentClient } from "@/features/clients/hooks";
import { safeHref } from "@/lib/utils/urls";

const UPCOMING = [
  { label: "Messages", icon: MessagesSquare },
  { label: "Invoices & payments", icon: Receipt },
  { label: "Brand assets", icon: Shapes },
  { label: "Website, domain & email", icon: Globe },
];

export default function MorePage() {
  const { user, signOut } = useAuth();
  const { client } = useCurrentClient();
  const driveFolder = safeHref(client.driveFolderUrl);

  return (
    <div className="space-y-5">
      <PageHeader title="More" />

      <Card className="p-5">
        <div className="flex items-center gap-4">
          <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-subtle text-lg font-semibold">
            {(user?.displayName || user?.email || "?").charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="truncate font-semibold">{user?.displayName || "Your account"}</p>
            <p className="truncate text-sm text-muted">{user?.email}</p>
            <p className="truncate text-sm text-muted">{client.name}</p>
          </div>
        </div>
      </Card>

      {driveFolder && (
        <Card>
          <a
            href={driveFolder}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 rounded-2xl px-5 py-4 text-sm font-medium hover:bg-subtle"
          >
            <FolderOpen className="size-5 text-muted" /> Shared Google Drive folder
          </a>
        </Card>
      )}

      <Card className="divide-y divide-line">
        {UPCOMING.map(({ label, icon: Icon }) => (
          <div key={label} className="flex items-center justify-between gap-3 px-5 py-4 text-sm">
            <span className="flex items-center gap-3 text-muted">
              <Icon className="size-5" /> {label}
            </span>
            <span className="text-xs text-faint">Coming soon</span>
          </div>
        ))}
      </Card>

      <Button variant="secondary" size="lg" className="w-full" onClick={() => signOut()}>
        <LogOut className="size-4" /> Sign out
      </Button>
    </div>
  );
}

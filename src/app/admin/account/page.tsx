"use client";

import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, PageHeader } from "@/components/ui/Card";
import { useAuth } from "@/features/auth/AuthProvider";

const UPCOMING = ["Requests inbox", "Content calendars", "Invoices & payments", "Client chat", "Notifications"];

export default function AdminAccountPage() {
  const { user, signOut } = useAuth();
  return (
    <div className="space-y-5">
      <PageHeader title="Account" />
      <Card className="p-5">
        <p className="font-semibold">{user?.displayName || "Administrator"}</p>
        <p className="text-sm text-muted">{user?.email}</p>
      </Card>
      <Card className="divide-y divide-line">
        {UPCOMING.map((label) => (
          <div key={label} className="flex items-center justify-between px-5 py-4 text-sm text-muted">
            {label}
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

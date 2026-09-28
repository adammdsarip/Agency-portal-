"use client";

import { Building2, Inbox, Layers, LogOut, UserCircle } from "lucide-react";
import { AppShell, type NavItem } from "@/components/layout/AppShell";
import { useAuth } from "@/features/auth/AuthProvider";
import { RoleGuard } from "@/features/auth/RoleGuard";

// Future modules (Calendar, Invoices, Chat) plug in here.
const NAV: NavItem[] = [
  { href: "/admin/clients", label: "Clients", icon: Building2 },
  { href: "/admin/requests", label: "Requests", icon: Inbox },
  { href: "/admin/deliverables", label: "Deliverables", icon: Layers },
  { href: "/admin/account", label: "Account", icon: UserCircle },
];

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <RoleGuard role="admin">
      <AdminFrame>{children}</AdminFrame>
    </RoleGuard>
  );
}

function AdminFrame({ children }: { children: React.ReactNode }) {
  const { user, signOut } = useAuth();
  return (
    <AppShell
      nav={NAV}
      context={<span className="inline-flex items-center gap-1.5">Admin · {user?.email}</span>}
      sidebarFooter={
        <button
          type="button"
          onClick={() => signOut()}
          className="flex h-10 items-center gap-3 rounded-xl px-3 text-sm font-medium text-muted hover:bg-subtle hover:text-ink"
        >
          <LogOut className="size-[18px]" /> Sign out
        </button>
      }
    >
      {children}
    </AppShell>
  );
}

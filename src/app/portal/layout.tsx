"use client";

import { CalendarDays, Home, Layers, LayoutGrid, MessageSquarePlus } from "lucide-react";
import { AppShell, type NavItem } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/Button";
import { friendlyError, FullPageMessage } from "@/components/ui/feedback";
import { useAuth } from "@/features/auth/AuthProvider";
import { RoleGuard } from "@/features/auth/RoleGuard";
import { CurrentClientContext, useClient } from "@/features/clients/hooks";

const NAV: NavItem[] = [
  { href: "/portal", label: "Home", icon: Home, exact: true },
  { href: "/portal/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/portal/deliverables", label: "Deliverables", icon: Layers },
  { href: "/portal/requests", label: "Requests", icon: MessageSquarePlus },
  { href: "/portal/more", label: "More", icon: LayoutGrid },
];

export default function PortalLayout({ children }: LayoutProps<"/portal">) {
  return (
    <RoleGuard role="client">
      <ClientPortal>{children}</ClientPortal>
    </RoleGuard>
  );
}

function ClientPortal({ children }: { children: React.ReactNode }) {
  const { claims, signOut } = useAuth();
  // clientId comes from the signed token, never from the URL.
  const clientId = claims.clientId!;
  const { data: client, loading, error } = useClient(clientId);

  if (loading) return <FullPageMessage />;

  if (error || !client) {
    return (
      <FullPageMessage title="We couldn't load your portal">
        <p>{error ? friendlyError(error) : "Your company profile could not be found."}</p>
        <Button variant="secondary" className="mt-4" onClick={() => signOut()}>
          Sign out
        </Button>
      </FullPageMessage>
    );
  }

  if (client.status !== "active") {
    return (
      <FullPageMessage title="Your portal is currently paused">
        <p>Please contact your account manager to reactivate access.</p>
        <Button variant="secondary" className="mt-4" onClick={() => signOut()}>
          Sign out
        </Button>
      </FullPageMessage>
    );
  }

  return (
    <CurrentClientContext.Provider value={{ client, clientId }}>
      <AppShell nav={NAV} context={client.name}>
        {children}
      </AppShell>
    </CurrentClientContext.Provider>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { FullPageMessage } from "@/components/ui/feedback";
import { homePathFor, useAuth } from "./AuthProvider";
import type { Role } from "./types";

/**
 * Navigation guard ONLY. It keeps people on the right screens; it is not the
 * security boundary. Data access is enforced by Firestore Security Rules, so
 * bypassing this component yields empty/denied queries, never other data.
 */
export function RoleGuard({ role, children }: { role: Role; children: React.ReactNode }) {
  const { status, claims, signOut } = useAuth();
  const router = useRouter();

  const wrongRole = status === "signedIn" && claims.role !== null && claims.role !== role;

  useEffect(() => {
    if (status === "signedOut") router.replace("/login");
    else if (wrongRole) router.replace(homePathFor(claims.role));
  }, [status, wrongRole, claims.role, router]);

  if (status === "unconfigured") {
    return (
      <FullPageMessage title="Firebase isn't configured">
        Copy <code>.env.example</code> to <code>.env.local</code> and add your Firebase project settings.
      </FullPageMessage>
    );
  }

  if (status === "signedIn" && (claims.role === null || (role === "client" && !claims.clientId))) {
    return (
      <FullPageMessage title="Your account isn't set up yet">
        <p>Your login exists but hasn&apos;t been linked to a portal. Please contact your account manager.</p>
        <Button variant="secondary" className="mt-4" onClick={() => signOut()}>
          Sign out
        </Button>
      </FullPageMessage>
    );
  }

  if (status !== "signedIn" || wrongRole) return <FullPageMessage />;

  return <>{children}</>;
}

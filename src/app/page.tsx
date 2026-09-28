"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { FullPageMessage } from "@/components/ui/feedback";
import { homePathFor, useAuth } from "@/features/auth/AuthProvider";

/** Entry point: sends each user to the area their role allows. */
export default function IndexPage() {
  const { status, claims } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === "signedOut") router.replace("/login");
    // A signed-in user without a role lands on /portal, where RoleGuard explains the situation.
    if (status === "signedIn") router.replace(claims.role ? homePathFor(claims.role) : "/portal");
  }, [status, claims.role, router]);

  if (status === "unconfigured") {
    return (
      <FullPageMessage title="Firebase isn't configured">
        Copy <code>.env.example</code> to <code>.env.local</code> and add your Firebase project settings.
      </FullPageMessage>
    );
  }
  return <FullPageMessage />;
}

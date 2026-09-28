"use client";

import {
  onIdTokenChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  type User,
} from "firebase/auth";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { firebaseAuth, isFirebaseConfigured } from "@/lib/firebase/client";
import type { Role, RoleClaims } from "./types";

type AuthStatus = "loading" | "signedOut" | "signedIn" | "unconfigured";

interface AuthState {
  status: AuthStatus;
  user: User | null;
  claims: RoleClaims;
}

interface AuthContextValue extends AuthState {
  signIn: (email: string, password: string) => Promise<Role | null>;
  signOut: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
}

const EMPTY_CLAIMS: RoleClaims = { role: null, clientId: null };

const AuthContext = createContext<AuthContextValue | null>(null);

function readClaims(raw: Record<string, unknown>): RoleClaims {
  const role = raw.role === "admin" || raw.role === "client" ? raw.role : null;
  const clientId = typeof raw.clientId === "string" ? raw.clientId : null;
  return { role, clientId };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({ status: "loading", user: null, claims: EMPTY_CLAIMS });

  useEffect(() => {
    if (!isFirebaseConfigured()) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time environment check
      setState({ status: "unconfigured", user: null, claims: EMPTY_CLAIMS });
      return;
    }
    // onIdTokenChanged (not onAuthStateChanged) so refreshed claims are picked up too.
    return onIdTokenChanged(firebaseAuth(), async (user) => {
      if (!user) {
        setState({ status: "signedOut", user: null, claims: EMPTY_CLAIMS });
        return;
      }
      const token = await user.getIdTokenResult();
      setState({ status: "signedIn", user, claims: readClaims(token.claims) });
    });
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const cred = await signInWithEmailAndPassword(firebaseAuth(), email.trim(), password);
    // Force refresh so claims set since the last sign-in are included.
    const token = await cred.user.getIdTokenResult(true);
    return readClaims(token.claims).role;
  }, []);

  const signOut = useCallback(() => firebaseSignOut(firebaseAuth()), []);

  const sendPasswordReset = useCallback(
    (email: string) => sendPasswordResetEmail(firebaseAuth(), email.trim()),
    [],
  );

  const value = useMemo(
    () => ({ ...state, signIn, signOut, sendPasswordReset }),
    [state, signIn, signOut, sendPasswordReset],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}

export function homePathFor(role: Role | null): string {
  if (role === "admin") return "/admin";
  if (role === "client") return "/portal";
  return "/login";
}

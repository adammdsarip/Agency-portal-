"use client";

import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";
import { Alert, friendlyError, FullPageMessage } from "@/components/ui/feedback";
import { BRAND_NAME } from "@/components/layout/AppShell";
import { homePathFor, useAuth } from "@/features/auth/AuthProvider";

type Mode = "signIn" | "reset";

export default function LoginPage() {
  const { status, claims, signIn, sendPasswordReset } = useAuth();
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("signIn");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetSent, setResetSent] = useState(false);

  // Already signed in → go to the right area.
  useEffect(() => {
    if (status === "signedIn" && claims.role) router.replace(homePathFor(claims.role));
  }, [status, claims.role, router]);

  if (status === "unconfigured") {
    return (
      <FullPageMessage title="Firebase isn't configured">
        Copy <code>.env.example</code> to <code>.env.local</code> and add your Firebase project settings.
      </FullPageMessage>
    );
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      if (mode === "signIn") {
        const role = await signIn(email, password);
        router.replace(role ? homePathFor(role) : "/portal");
      } else {
        await sendPasswordReset(email);
        setResetSent(true);
      }
    } catch (err) {
      // For resets, don't reveal whether an account exists.
      if (mode === "reset" && (err as { code?: string }).code === "auth/user-not-found") setResetSent(true);
      else setError(friendlyError(err));
    } finally {
      setBusy(false);
    }
  }

  function switchMode(next: Mode) {
    setMode(next);
    setError(null);
    setResetSent(false);
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-5 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-ink text-lg font-bold text-white shadow-lift">
            {BRAND_NAME.charAt(0)}
          </span>
          <h1 className="mt-5 text-2xl font-semibold tracking-tight">
            {mode === "signIn" ? "Welcome back" : "Reset your password"}
          </h1>
          <p className="mt-1.5 text-sm text-muted">
            {mode === "signIn"
              ? `Sign in to ${BRAND_NAME}`
              : "We'll email you a link to choose a new password."}
          </p>
        </div>

        <div className="rounded-3xl border border-line/70 bg-surface p-6 shadow-card">
          {resetSent ? (
            <div className="space-y-4 text-center">
              <CheckCircle2 className="mx-auto size-10 text-emerald-600" />
              <p className="text-sm text-muted">
                If an account exists for <strong className="text-ink">{email}</strong>, a reset link is on its way.
              </p>
              <Button variant="secondary" className="w-full" onClick={() => switchMode("signIn")}>
                Back to sign in
              </Button>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="space-y-4" noValidate>
              {error && <Alert>{error}</Alert>}
              <Field label="Email">
                {(id) => (
                  <Input
                    id={id}
                    type="email"
                    autoComplete="email"
                    inputMode="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@company.com"
                  />
                )}
              </Field>
              {mode === "signIn" && (
                <Field label="Password">
                  {(id) => (
                    <Input
                      id={id}
                      type="password"
                      autoComplete="current-password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  )}
                </Field>
              )}
              <Button type="submit" size="lg" className="w-full" loading={busy} disabled={!email || (mode === "signIn" && !password)}>
                {mode === "signIn" ? "Sign in" : "Send reset link"}
              </Button>
              {mode === "signIn" ? (
                <button
                  type="button"
                  onClick={() => switchMode("reset")}
                  className="block w-full text-center text-sm text-muted hover:text-ink"
                >
                  Forgot your password?
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => switchMode("signIn")}
                  className="mx-auto flex items-center gap-1.5 text-sm text-muted hover:text-ink"
                >
                  <ArrowLeft className="size-4" /> Back to sign in
                </button>
              )}
            </form>
          )}
        </div>
        <p className="mt-6 text-center text-xs text-faint">
          Access is by invitation. Contact your account manager if you need a login.
        </p>
      </div>
    </div>
  );
}

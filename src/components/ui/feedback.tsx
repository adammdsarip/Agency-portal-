import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export function Spinner({ className }: { className?: string }) {
  return (
    <span
      role="status"
      aria-label="Loading"
      className={cn("inline-block size-5 animate-spin rounded-full border-2 border-line border-t-ink", className)}
    />
  );
}

export function FullPageMessage({ title, children }: { title?: string; children?: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-3 px-6 text-center">
      {title ? <h1 className="text-lg font-semibold">{title}</h1> : <Spinner />}
      {children && <div className="max-w-sm text-sm text-muted">{children}</div>}
    </div>
  );
}

export function Alert({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      role="alert"
      className={cn("flex items-start gap-2.5 rounded-xl bg-danger-soft px-3.5 py-3 text-sm text-danger", className)}
    >
      <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
      <div>{children}</div>
    </div>
  );
}

interface EmptyStateProps {
  icon?: React.ComponentType<{ className?: string }>;
  title: string;
  description?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
  compact?: boolean;
}

export function EmptyState({ icon: Icon, title, description, action, className, compact }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center",
        compact ? "gap-1.5 py-6" : "gap-2 rounded-2xl border border-dashed border-line px-6 py-12",
        className,
      )}
    >
      {Icon && (
        <div className="mb-1 grid size-11 place-items-center rounded-2xl bg-subtle text-muted">
          <Icon className="size-5" />
        </div>
      )}
      <p className="text-sm font-medium text-ink">{title}</p>
      {description && <p className="max-w-xs text-sm text-muted">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

/** Translates Firebase errors into plain language for non-technical users. */
export function friendlyError(error: unknown): string {
  const code = (error as { code?: string })?.code ?? "";
  switch (code) {
    case "permission-denied":
      return "You don't have access to this.";
    case "unavailable":
      return "You appear to be offline. Changes will sync when you reconnect.";
    case "failed-precondition":
      return "The database is still being prepared (missing index). Please try again in a few minutes.";
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
    case "auth/invalid-email":
      return "That email and password don't match. Please try again.";
    case "auth/user-disabled":
      return "This account has been disabled. Please contact your account manager.";
    case "auth/too-many-requests":
      return "Too many attempts. Please wait a moment and try again.";
    case "auth/network-request-failed":
      return "Network error. Please check your connection.";
  }
  return error instanceof Error && error.message ? error.message : "Something went wrong. Please try again.";
}

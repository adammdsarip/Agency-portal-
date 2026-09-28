"use client";

import { Check, Copy, Mail, UserPlus, Users } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Badge, Card } from "@/components/ui/Card";
import { Field, Input } from "@/components/ui/Field";
import { Alert, EmptyState, friendlyError, Spinner } from "@/components/ui/feedback";
import type { UserProfile } from "@/features/auth/types";
import { emailPasswordSetupLink, inviteClientUser, setClientUserDisabled, subscribeClientUsers } from "@/features/users/api";
import { useSubscription } from "@/lib/useSubscription";

const NO_USERS: UserProfile[] = [];

/** Portal logins for a client. Creating/disabling goes through the server (Admin SDK). */
export function ClientUsersPanel({ clientId }: { clientId: string }) {
  const users = useSubscription<UserProfile[]>(clientId, NO_USERS, (onData, onError) =>
    subscribeClientUsers(clientId, onData, onError),
  );
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [inviting, setInviting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [invite, setInvite] = useState<{ email: string; link: string | null; emailed: boolean } | null>(null);
  const [copied, setCopied] = useState(false);
  const [busyUid, setBusyUid] = useState<string | null>(null);

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setInviting(true);
    setError(null);
    setInvite(null);
    try {
      const result = await inviteClientUser(clientId, { email, displayName });
      setInvite({ email: email.trim().toLowerCase(), link: result.passwordSetupLink, emailed: false });
      setEmail("");
      setDisplayName("");
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setInviting(false);
    }
  }

  async function sendEmail() {
    if (!invite) return;
    try {
      await emailPasswordSetupLink(invite.email);
      setInvite({ ...invite, emailed: true });
    } catch (err) {
      setError(friendlyError(err));
    }
  }

  async function toggle(user: UserProfile) {
    setBusyUid(user.uid);
    setError(null);
    try {
      await setClientUserDisabled(user.uid, !user.disabled);
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setBusyUid(null);
    }
  }

  return (
    <div className="space-y-5">
      <Card className="p-5">
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          <UserPlus className="size-4 text-muted" /> Invite a portal user
        </h2>
        <p className="mt-1 text-sm text-muted">They&apos;ll only ever see this client&apos;s portal.</p>
        <form onSubmit={handleInvite} className="mt-4 grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
          <Field label="Name">
            {(id) => <Input id={id} value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Jane Smith" />}
          </Field>
          <Field label="Email">
            {(id) => <Input id={id} type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="jane@company.com" />}
          </Field>
          <Button type="submit" loading={inviting} disabled={!email.trim()}>
            Create login
          </Button>
        </form>

        {invite && (
          <div className="mt-4 space-y-3 rounded-xl bg-subtle p-4 text-sm">
            <p>
              Login created for <strong>{invite.email}</strong>. Send them a link to choose their password:
            </p>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" onClick={sendEmail} disabled={invite.emailed}>
                {invite.emailed ? <Check className="size-4" /> : <Mail className="size-4" />}
                {invite.emailed ? "Email sent" : "Email setup link"}
              </Button>
              {invite.link && (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={async () => {
                    await navigator.clipboard.writeText(invite.link!);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                >
                  {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
                  {copied ? "Copied" : "Copy link"}
                </Button>
              )}
            </div>
          </div>
        )}
      </Card>

      {error && <Alert>{error}</Alert>}

      <Card>
        <h2 className="flex items-center gap-2 px-5 pt-4 pb-2 text-sm font-semibold">
          <Users className="size-4 text-muted" /> Portal users
        </h2>
        {users.loading ? (
          <div className="grid place-items-center py-10">
            <Spinner />
          </div>
        ) : users.error ? (
          <p className="px-5 pb-5 text-sm text-danger">{friendlyError(users.error)}</p>
        ) : users.data.length === 0 ? (
          <EmptyState compact title="No logins yet" description="Invite someone from this client above." />
        ) : (
          <ul className="divide-y divide-line">
            {users.data.map((u) => (
              <li key={u.uid} className="flex items-center justify-between gap-3 px-5 py-3.5">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{u.displayName || u.email}</p>
                  {u.displayName && <p className="truncate text-xs text-muted">{u.email}</p>}
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {u.disabled ? <Badge tone="red">Disabled</Badge> : <Badge tone="green">Active</Badge>}
                  <Button size="sm" variant="ghost" loading={busyUid === u.uid} onClick={() => toggle(u)}>
                    {u.disabled ? "Enable" : "Disable"}
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

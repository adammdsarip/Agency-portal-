import { FieldValue } from "firebase-admin/firestore";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { errorResponse, HttpError, requireAdmin } from "@/lib/server/requireAdmin";

export const runtime = "nodejs";

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

/**
 * Creates a portal login for a client company.
 * Sets custom claims { role: 'client', clientId } — the value the security
 * rules use to scope every read to this client only.
 */
export async function POST(request: Request, ctx: RouteContext<"/api/admin/clients/[clientId]/users">) {
  try {
    const admin = await requireAdmin(request);
    const { clientId } = await ctx.params;

    const body = await request.json().catch(() => null);
    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    const displayName = typeof body?.displayName === "string" ? body.displayName.trim().slice(0, 120) : "";
    if (!EMAIL_RE.test(email) || email.length > 254) throw new HttpError(400, "A valid email is required.");

    const db = adminDb();
    const client = await db.doc(`clients/${clientId}`).get();
    if (!client.exists) throw new HttpError(404, "Client not found.");

    const auth = adminAuth();
    const existing = await auth.getUserByEmail(email).catch(() => null);
    if (existing) {
      // Never silently re-scope an existing account (it could be an admin or
      // another client's user). Access changes must be deliberate.
      throw new HttpError(409, "An account with this email already exists.");
    }

    const user = await auth.createUser({ email, displayName: displayName || undefined, emailVerified: false });
    await auth.setCustomUserClaims(user.uid, { role: "client", clientId });
    await db.doc(`users/${user.uid}`).set({
      email,
      displayName,
      role: "client",
      clientId,
      disabled: false,
      createdAt: FieldValue.serverTimestamp(),
      createdBy: admin.uid,
    });

    // The user has no password yet; this link lets them choose one.
    const passwordSetupLink = await auth.generatePasswordResetLink(email).catch((e) => {
      console.warn("Could not generate password setup link", e);
      return null;
    });

    return Response.json({ uid: user.uid, passwordSetupLink }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}

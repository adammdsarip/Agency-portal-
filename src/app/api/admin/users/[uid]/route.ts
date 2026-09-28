import { FieldValue } from "firebase-admin/firestore";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { errorResponse, HttpError, requireAdmin } from "@/lib/server/requireAdmin";

export const runtime = "nodejs";

/** Enables/disables a client portal login. Disabling also revokes active sessions. */
export async function PATCH(request: Request, ctx: RouteContext<"/api/admin/users/[uid]">) {
  try {
    const admin = await requireAdmin(request);
    const { uid } = await ctx.params;

    const body = await request.json().catch(() => null);
    if (typeof body?.disabled !== "boolean") throw new HttpError(400, "`disabled` must be a boolean.");
    const disabled: boolean = body.disabled;

    const auth = adminAuth();
    const target = await auth.getUser(uid).catch(() => null);
    if (!target) throw new HttpError(404, "User not found.");
    // Admin accounts are managed via scripts/set-admin.mjs, not from the portal UI.
    if (target.customClaims?.role !== "client") throw new HttpError(403, "Only client logins can be managed here.");

    await auth.updateUser(uid, { disabled });
    if (disabled) await auth.revokeRefreshTokens(uid);
    await adminDb().doc(`users/${uid}`).set(
      { disabled, updatedAt: FieldValue.serverTimestamp(), updatedBy: admin.uid },
      { merge: true },
    );

    return Response.json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}

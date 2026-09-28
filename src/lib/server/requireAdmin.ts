import "server-only";

import type { DecodedIdToken } from "firebase-admin/auth";
import { adminAuth } from "@/lib/firebase/admin";

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

/**
 * Verifies the caller's Firebase ID token (including revocation) and requires
 * the `admin` role claim. Every /api/admin route must call this first.
 */
export async function requireAdmin(request: Request): Promise<DecodedIdToken> {
  const header = request.headers.get("authorization") ?? "";
  const match = header.match(/^Bearer (.+)$/);
  if (!match) throw new HttpError(401, "Missing bearer token.");

  let token: DecodedIdToken;
  try {
    token = await adminAuth().verifyIdToken(match[1], true);
  } catch {
    throw new HttpError(401, "Invalid or expired session.");
  }
  if (token.role !== "admin") throw new HttpError(403, "Admin access required.");
  return token;
}

export function errorResponse(error: unknown): Response {
  if (error instanceof HttpError) {
    return Response.json({ error: error.message }, { status: error.status });
  }
  console.error(error);
  return Response.json({ error: "Something went wrong." }, { status: 500 });
}

import "server-only";

import { cert, getApp, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

// Server-only: the Admin SDK bypasses security rules, so it must never be
// bundled into browser code. The `server-only` import makes that a build error.
function adminApp(): App {
  if (getApps().length) return getApp();

  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

  // Local emulators need no credentials (FIRESTORE_EMULATOR_HOST / FIREBASE_AUTH_EMULATOR_HOST).
  if (process.env.FIRESTORE_EMULATOR_HOST || process.env.FIREBASE_AUTH_EMULATOR_HOST) {
    return initializeApp({ projectId });
  }

  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n");
  if (!projectId || !clientEmail || !privateKey) {
    throw new Error("Firebase Admin credentials are missing (FIREBASE_ADMIN_* env vars).");
  }
  return initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
}

export const adminAuth = () => getAuth(adminApp());
export const adminDb = () => getFirestore(adminApp());

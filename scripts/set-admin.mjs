// Promotes a Firebase Auth user to admin by setting the { role: 'admin' } custom claim.
//
//   npm run set-admin -- you@agency.com     # creates the user if it doesn't exist
//
// Reads FIREBASE_ADMIN_* from .env.local. Run this once to bootstrap the first admin.
import { cert, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { FieldValue, getFirestore } from "firebase-admin/firestore";

const email = process.argv[2]?.trim().toLowerCase();
if (!email) {
  console.error("Usage: npm run set-admin -- <email>");
  process.exit(1);
}

const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const usingEmulator = Boolean(process.env.FIREBASE_AUTH_EMULATOR_HOST);
initializeApp(
  usingEmulator
    ? { projectId }
    : {
        credential: cert({
          projectId,
          clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n"),
        }),
      },
);

const auth = getAuth();
let user = await auth.getUserByEmail(email).catch(() => null);
let created = false;
if (!user) {
  user = await auth.createUser({ email });
  created = true;
}

// Replaces any previous claims, so a former client login loses its clientId.
await auth.setCustomUserClaims(user.uid, { role: "admin" });
await auth.revokeRefreshTokens(user.uid); // forces a fresh token with the new claims
await getFirestore().doc(`users/${user.uid}`).set(
  {
    email,
    displayName: user.displayName ?? "",
    role: "admin",
    clientId: null,
    disabled: false,
    createdAt: FieldValue.serverTimestamp(),
    createdBy: "set-admin-script",
  },
  { merge: true },
);

console.log(`✔ ${email} is now an admin (uid ${user.uid}).`);
if (created) {
  const link = await auth.generatePasswordResetLink(email);
  console.log(`Account was created. Set a password here:\n${link}`);
} else {
  console.log("Sign out and back in for the new role to take effect.");
}
process.exit(0);

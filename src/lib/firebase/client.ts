"use client";

import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { connectAuthEmulator, getAuth, type Auth } from "firebase/auth";
import {
  connectFirestoreEmulator,
  initializeFirestore,
  getFirestore,
  type Firestore,
} from "firebase/firestore";

// The web config is public by design; access control is enforced by Firestore rules.
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const useEmulators = process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === "true";

let app: FirebaseApp | undefined;
let auth: Auth | undefined;
let db: Firestore | undefined;

export function isFirebaseConfigured(): boolean {
  return Boolean(firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId);
}

function firebaseApp(): FirebaseApp {
  if (!app) {
    if (!isFirebaseConfigured()) {
      throw new Error(
        "Firebase is not configured. Copy .env.example to .env.local and fill in the NEXT_PUBLIC_FIREBASE_* values.",
      );
    }
    app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  }
  return app;
}

// Lazily initialised so nothing touches Firebase during server-side prerendering.
export function firebaseAuth(): Auth {
  if (!auth) {
    auth = getAuth(firebaseApp());
    if (useEmulators) connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
  }
  return auth;
}

export function firestore(): Firestore {
  if (!db) {
    const firebase = firebaseApp();
    try {
      // Treat `undefined` fields as absent instead of throwing.
      db = initializeFirestore(firebase, { ignoreUndefinedProperties: true });
    } catch {
      db = getFirestore(firebase);
    }
    if (useEmulators) connectFirestoreEmulator(db, "127.0.0.1", 8080);
  }
  return db;
}

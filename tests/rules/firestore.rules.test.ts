/**
 * Firestore Security Rules tests. Run with `npm run test:rules`
 * (starts the Firestore emulator, requires Java).
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
  type Firestore,
} from "firebase/firestore";
import { afterAll, beforeAll, beforeEach, describe, it } from "vitest";

let env: RulesTestEnvironment;

const ADMIN = { uid: "admin-1", claims: { role: "admin" } };
const CLIENT_A = { uid: "user-a", claims: { role: "client", clientId: "client-a" } };
const CLIENT_B = { uid: "user-b", claims: { role: "client", clientId: "client-b" } };
const NO_ROLE = { uid: "user-x", claims: {} };

function dbFor(user: { uid: string; claims: Record<string, unknown> } | null): Firestore {
  const ctx = user
    ? env.authenticatedContext(user.uid, user.claims)
    : env.unauthenticatedContext();
  return ctx.firestore() as unknown as Firestore;
}

function clientDoc(name: string, status = "active") {
  return {
    name,
    status,
    contactName: "",
    contactEmail: "",
    phone: "",
    website: "",
    industry: "",
    logoUrl: "",
    driveFolderUrl: "",
    retainer: { status: "active", planName: "Growth" },
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
    createdBy: ADMIN.uid,
    updatedBy: ADMIN.uid,
  };
}

function deliverableDoc(clientId: string, overrides: Record<string, unknown> = {}) {
  return {
    clientId,
    title: "Instagram Campaign",
    description: "",
    category: "design",
    status: "in_review",
    previewUrl: "",
    googleDriveUrl: "https://drive.google.com/drive/folders/abc",
    deliveryDate: Timestamp.fromDate(new Date("2026-09-28T00:00:00Z")),
    notes: "",
    archived: false,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
    createdBy: ADMIN.uid,
    updatedBy: ADMIN.uid,
    ...overrides,
  };
}

/** A deliverable as the admin UI writes it (server timestamps). */
function newDeliverable(clientId: string, overrides: Record<string, unknown> = {}) {
  return deliverableDoc(clientId, {
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    ...overrides,
  });
}

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: "demo-agency-portal",
    firestore: { rules: readFileSync(resolve(__dirname, "../../firestore.rules"), "utf8") },
  });
});

afterAll(async () => {
  await env.cleanup();
});

beforeEach(async () => {
  await env.clearFirestore();
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    await db.doc("clients/client-a").set(clientDoc("Client A"));
    await db.doc("clients/client-b").set(clientDoc("Client B"));
    await db.doc("clients/client-c").set(clientDoc("Client C (inactive)", "inactive"));
    await db.doc("clients/client-a/private/profile").set({
      internalNotes: "Pays late",
      billingEmail: "",
      updatedAt: Timestamp.now(),
      updatedBy: ADMIN.uid,
    });
    await db.doc("deliverables/del-a1").set(deliverableDoc("client-a"));
    await db.doc("deliverables/del-a-archived").set(deliverableDoc("client-a", { archived: true }));
    await db.doc("deliverables/del-b1").set(deliverableDoc("client-b"));
    await db.doc("deliverables/del-c1").set(deliverableDoc("client-c"));
    await db.doc("users/user-a").set({ email: "a@example.com", role: "client", clientId: "client-a" });
    await db.doc("users/user-b").set({ email: "b@example.com", role: "client", clientId: "client-b" });
  });
});

const ownQuery = (db: Firestore, clientId: string) =>
  query(
    collection(db, "deliverables"),
    where("clientId", "==", clientId),
    where("archived", "==", false),
    orderBy("createdAt", "desc"),
    limit(50),
  );

describe("unauthenticated and role-less users", () => {
  it("cannot read anything", async () => {
    for (const user of [null, NO_ROLE]) {
      const db = dbFor(user);
      await assertFails(getDoc(doc(db, "clients/client-a")));
      await assertFails(getDoc(doc(db, "deliverables/del-a1")));
      await assertFails(getDocs(ownQuery(db, "client-a")));
      await assertFails(getDoc(doc(db, "users/user-a")));
    }
  });
});

describe("client isolation", () => {
  it("client A can read its own company and deliverables", async () => {
    const db = dbFor(CLIENT_A);
    await assertSucceeds(getDoc(doc(db, "clients/client-a")));
    await assertSucceeds(getDoc(doc(db, "deliverables/del-a1")));
    await assertSucceeds(getDocs(ownQuery(db, "client-a")));
  });

  it("client A can NOT read client B's company or deliverables", async () => {
    const db = dbFor(CLIENT_A);
    await assertFails(getDoc(doc(db, "clients/client-b")));
    await assertFails(getDoc(doc(db, "deliverables/del-b1")));
    await assertFails(getDocs(ownQuery(db, "client-b")));
  });

  it("client B can NOT see a deliverable created for client A", async () => {
    const admin = dbFor(ADMIN);
    await assertSucceeds(setDoc(doc(admin, "deliverables/new-for-a"), newDeliverable("client-a")));
    await assertSucceeds(getDoc(doc(dbFor(CLIENT_A), "deliverables/new-for-a")));
    await assertFails(getDoc(doc(dbFor(CLIENT_B), "deliverables/new-for-a")));
  });

  it("rejects unscoped queries (rules are not filters)", async () => {
    const db = dbFor(CLIENT_A);
    await assertFails(getDocs(collection(db, "deliverables")));
    await assertFails(getDocs(query(collection(db, "deliverables"), where("clientId", "==", "client-a"))));
    await assertFails(getDocs(collection(db, "clients")));
    await assertFails(getDocs(collection(db, "users")));
  });

  it("hides archived deliverables from clients", async () => {
    await assertFails(getDoc(doc(dbFor(CLIENT_A), "deliverables/del-a-archived")));
  });

  it("blocks deliverables of an inactive client company", async () => {
    const db = dbFor({ uid: "user-c", claims: { role: "client", clientId: "client-c" } });
    await assertSucceeds(getDoc(doc(db, "clients/client-c")));
    await assertFails(getDoc(doc(db, "deliverables/del-c1")));
  });

  it("clients cannot read the admin-only private profile", async () => {
    await assertFails(getDoc(doc(dbFor(CLIENT_A), "clients/client-a/private/profile")));
  });

  it("a user record is readable only by its owner (and admins)", async () => {
    await assertSucceeds(getDoc(doc(dbFor(CLIENT_A), "users/user-a")));
    await assertFails(getDoc(doc(dbFor(CLIENT_A), "users/user-b")));
  });

  it("forged claims in the wrong shape are rejected", async () => {
    // clientId claim without the client role
    const db = dbFor({ uid: "sneaky", claims: { clientId: "client-a" } });
    await assertFails(getDoc(doc(db, "deliverables/del-a1")));
  });
});

describe("clients cannot write", () => {
  it("cannot create, edit or delete deliverables", async () => {
    const db = dbFor(CLIENT_A);
    await assertFails(setDoc(doc(db, "deliverables/x"), newDeliverable("client-a", { createdBy: CLIENT_A.uid, updatedBy: CLIENT_A.uid })));
    await assertFails(updateDoc(doc(db, "deliverables/del-a1"), { status: "approved" }));
    await assertFails(deleteDoc(doc(db, "deliverables/del-a1")));
  });

  it("cannot edit their company or escalate via their user doc", async () => {
    const db = dbFor(CLIENT_A);
    await assertFails(updateDoc(doc(db, "clients/client-a"), { name: "Hacked" }));
    await assertFails(updateDoc(doc(db, "users/user-a"), { role: "admin" }));
    await assertFails(setDoc(doc(db, "users/user-a"), { role: "admin", clientId: "client-b" }));
  });
});

describe("admin", () => {
  it("can read everything", async () => {
    const db = dbFor(ADMIN);
    await assertSucceeds(getDocs(collection(db, "clients")));
    await assertSucceeds(getDocs(collection(db, "users")));
    await assertSucceeds(getDoc(doc(db, "clients/client-a/private/profile")));
    await assertSucceeds(getDoc(doc(db, "deliverables/del-a-archived")));
    await assertSucceeds(
      getDocs(query(collection(db, "deliverables"), where("clientId", "==", "client-b"), orderBy("createdAt", "desc"))),
    );
  });

  it("can create, update, archive and delete deliverables", async () => {
    const db = dbFor(ADMIN);
    const ref = doc(db, "deliverables/new");
    await assertSucceeds(setDoc(ref, newDeliverable("client-a")));
    await assertSucceeds(
      updateDoc(ref, { status: "approved", updatedAt: serverTimestamp(), updatedBy: ADMIN.uid }),
    );
    await assertSucceeds(
      updateDoc(ref, { archived: true, updatedAt: serverTimestamp(), updatedBy: ADMIN.uid }),
    );
    await assertSucceeds(deleteDoc(ref));
  });

  it("cannot move a deliverable to another client", async () => {
    const db = dbFor(ADMIN);
    await assertFails(
      updateDoc(doc(db, "deliverables/del-a1"), {
        clientId: "client-b",
        updatedAt: serverTimestamp(),
        updatedBy: ADMIN.uid,
      }),
    );
  });

  it("cannot create a deliverable for a non-existent client", async () => {
    await assertFails(setDoc(doc(dbFor(ADMIN), "deliverables/orphan"), newDeliverable("nope")));
  });

  it("enforces the deliverable schema", async () => {
    const db = dbFor(ADMIN);
    const bad: Record<string, unknown>[] = [
      { category: "podcast" },
      { status: "published" },
      { title: "" },
      { googleDriveUrl: "javascript:alert(1)" },
      { previewUrl: "http://insecure.example.com/a.png" },
      { extraField: true },
      { deliveryDate: "2026-09-28" },
      { createdAt: Timestamp.fromDate(new Date("2020-01-01")) },
    ];
    for (const override of bad) {
      await assertFails(setDoc(doc(db, "deliverables/bad"), newDeliverable("client-a", override)));
    }
  });

  it("can create and update clients with valid data only", async () => {
    const db = dbFor(ADMIN);
    const valid = { ...clientDoc("New Co"), createdAt: serverTimestamp(), updatedAt: serverTimestamp() };
    await assertSucceeds(setDoc(doc(db, "clients/new-co"), valid));
    await assertFails(setDoc(doc(db, "clients/bad-co"), { ...valid, status: "vip" }));
    await assertFails(setDoc(doc(db, "clients/bad-co"), { ...valid, name: "" }));
    await assertSucceeds(
      updateDoc(doc(db, "clients/new-co"), { name: "New Co Ltd", updatedAt: serverTimestamp(), updatedBy: ADMIN.uid }),
    );
    await assertFails(deleteDoc(doc(db, "clients/new-co")));
  });

  it("cannot write user docs from the browser (server only)", async () => {
    await assertFails(setDoc(doc(dbFor(ADMIN), "users/someone"), { role: "admin" }));
  });
});

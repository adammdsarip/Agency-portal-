/**
 * Security rules for `requests` — the first collection clients can write to.
 * Run with `npm run test:rules`.
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
const ALICE = { uid: "user-a", claims: { role: "client", clientId: "client-a", name: "Alice", email: "alice@a.test" } };
const BOB = { uid: "user-b", claims: { role: "client", clientId: "client-b", name: "Bob", email: "bob@b.test" } };
const CAROL_INACTIVE = { uid: "user-c", claims: { role: "client", clientId: "client-c", name: "Carol", email: "carol@c.test" } };

type TestUser = { uid: string; claims: Record<string, unknown> };

function dbFor(user: TestUser | null): Firestore {
  const ctx = user ? env.authenticatedContext(user.uid, user.claims) : env.unauthenticatedContext();
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
    retainer: { status: "none", planName: "" },
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
    createdBy: ADMIN.uid,
    updatedBy: ADMIN.uid,
  };
}

/** A request exactly as the client portal submits it. */
function newRequestAs(user: TestUser, overrides: Record<string, unknown> = {}) {
  return {
    clientId: user.claims.clientId ?? "client-a",
    title: "New menu design",
    description: "A4 menu for the autumn season.",
    category: "design",
    priority: "normal",
    fileUrl: "https://drive.google.com/file/d/abc123456789/view",
    neededBy: Timestamp.fromDate(new Date("2026-10-15T00:00:00Z")),
    status: "submitted",
    adminResponse: "",
    createdByName: user.claims.name ?? "",
    createdByEmail: user.claims.email ?? "",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    createdBy: user.uid,
    updatedBy: user.uid,
    ...overrides,
  };
}

function storedRequest(clientId: string, overrides: Record<string, unknown> = {}) {
  return {
    ...newRequestAs(ALICE),
    clientId,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
    ...overrides,
  };
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
    await db.doc("clients/client-c").set(clientDoc("Client C", "inactive"));
    await db.doc("requests/req-a").set(storedRequest("client-a"));
    await db.doc("requests/req-a-progress").set(storedRequest("client-a", { status: "in_progress" }));
    await db.doc("requests/req-b").set(storedRequest("client-b", { createdBy: BOB.uid }));
  });
});

const ownRequests = (db: Firestore, clientId: string) =>
  query(collection(db, "requests"), where("clientId", "==", clientId), orderBy("createdAt", "desc"), limit(50));

describe("client reads", () => {
  it("sees only their own company's requests", async () => {
    const db = dbFor(ALICE);
    await assertSucceeds(getDocs(ownRequests(db, "client-a")));
    await assertSucceeds(getDoc(doc(db, "requests/req-a")));
    await assertFails(getDoc(doc(db, "requests/req-b")));
    await assertFails(getDocs(ownRequests(db, "client-b")));
    await assertFails(getDocs(collection(db, "requests")));
  });

  it("inactive company cannot read", async () => {
    await assertFails(getDocs(ownRequests(dbFor(CAROL_INACTIVE), "client-c")));
  });

  it("anonymous users cannot read", async () => {
    await assertFails(getDoc(doc(dbFor(null), "requests/req-a")));
  });
});

describe("client creates", () => {
  it("can submit a request for their own company", async () => {
    await assertSucceeds(setDoc(doc(dbFor(ALICE), "requests/new"), newRequestAs(ALICE)));
  });

  it("can submit with optional fields empty", async () => {
    await assertSucceeds(
      setDoc(doc(dbFor(ALICE), "requests/new"), newRequestAs(ALICE, { description: "", fileUrl: "", neededBy: null })),
    );
  });

  it("cannot submit for another company", async () => {
    await assertFails(setDoc(doc(dbFor(ALICE), "requests/new"), newRequestAs(ALICE, { clientId: "client-b" })));
  });

  it("cannot impersonate a colleague or another user", async () => {
    const db = dbFor(ALICE);
    await assertFails(setDoc(doc(db, "requests/n1"), newRequestAs(ALICE, { createdByName: "Bob" })));
    await assertFails(setDoc(doc(db, "requests/n2"), newRequestAs(ALICE, { createdByEmail: "boss@a.test" })));
    await assertFails(setDoc(doc(db, "requests/n3"), newRequestAs(ALICE, { createdBy: "someone-else" })));
  });

  it("cannot skip the workflow or pre-fill the agency reply", async () => {
    const db = dbFor(ALICE);
    await assertFails(setDoc(doc(db, "requests/n1"), newRequestAs(ALICE, { status: "completed" })));
    await assertFails(setDoc(doc(db, "requests/n2"), newRequestAs(ALICE, { adminResponse: "Approved!" })));
  });

  it("cannot backdate or send invalid data", async () => {
    const db = dbFor(ALICE);
    const bad: Record<string, unknown>[] = [
      { createdAt: Timestamp.fromDate(new Date("2020-01-01")) },
      { title: "" },
      { title: "x".repeat(201) },
      { category: "podcast" },
      { priority: "critical" },
      { fileUrl: "javascript:alert(1)" },
      { fileUrl: "http://insecure.example.com" },
      { neededBy: "tomorrow" },
      { isAdmin: true },
    ];
    for (const override of bad) {
      await assertFails(setDoc(doc(db, "requests/bad"), newRequestAs(ALICE, override)));
    }
  });

  it("inactive company cannot submit", async () => {
    await assertFails(setDoc(doc(dbFor(CAROL_INACTIVE), "requests/new"), newRequestAs(CAROL_INACTIVE)));
  });
});

describe("client updates", () => {
  const cancel = (uid: string) => ({ status: "cancelled", updatedAt: serverTimestamp(), updatedBy: uid });

  it("can cancel their company's request while it's still submitted", async () => {
    await assertSucceeds(updateDoc(doc(dbFor(ALICE), "requests/req-a"), cancel(ALICE.uid)));
  });

  it("cannot cancel once work has started", async () => {
    await assertFails(updateDoc(doc(dbFor(ALICE), "requests/req-a-progress"), cancel(ALICE.uid)));
  });

  it("cannot cancel another company's request", async () => {
    await assertFails(updateDoc(doc(dbFor(ALICE), "requests/req-b"), cancel(ALICE.uid)));
  });

  it("cannot change anything else", async () => {
    const db = dbFor(ALICE);
    await assertFails(updateDoc(doc(db, "requests/req-a"), { ...cancel(ALICE.uid), title: "Edited" }));
    await assertFails(updateDoc(doc(db, "requests/req-a"), { status: "completed", updatedAt: serverTimestamp(), updatedBy: ALICE.uid }));
    await assertFails(updateDoc(doc(db, "requests/req-a"), { adminResponse: "Done", updatedAt: serverTimestamp(), updatedBy: ALICE.uid }));
    await assertFails(updateDoc(doc(db, "requests/req-a"), { clientId: "client-b", updatedAt: serverTimestamp(), updatedBy: ALICE.uid }));
  });

  it("cannot delete", async () => {
    await assertFails(deleteDoc(doc(dbFor(ALICE), "requests/req-a")));
  });
});

describe("admin", () => {
  it("reads all requests and the open-requests inbox query", async () => {
    const db = dbFor(ADMIN);
    await assertSucceeds(getDocs(query(collection(db, "requests"), orderBy("createdAt", "desc"), limit(100))));
    await assertSucceeds(
      getDocs(
        query(
          collection(db, "requests"),
          where("status", "in", ["submitted", "in_progress", "waiting_on_client"]),
          orderBy("createdAt", "desc"),
        ),
      ),
    );
  });

  it("updates status and reply", async () => {
    await assertSucceeds(
      updateDoc(doc(dbFor(ADMIN), "requests/req-a"), {
        status: "in_progress",
        adminResponse: "On it — first draft Friday.",
        updatedAt: serverTimestamp(),
        updatedBy: ADMIN.uid,
      }),
    );
  });

  it("cannot change who filed it or which client it belongs to", async () => {
    const db = dbFor(ADMIN);
    const stamp = { updatedAt: serverTimestamp(), updatedBy: ADMIN.uid };
    await assertFails(updateDoc(doc(db, "requests/req-a"), { clientId: "client-b", ...stamp }));
    await assertFails(updateDoc(doc(db, "requests/req-a"), { createdByName: "Someone", ...stamp }));
    await assertFails(updateDoc(doc(db, "requests/req-a"), { status: "archived", ...stamp }));
  });

  it("can log a request on a client's behalf, but only for an existing client", async () => {
    const db = dbFor(ADMIN);
    await assertSucceeds(setDoc(doc(db, "requests/by-admin"), newRequestAs(ADMIN, { clientId: "client-a" })));
    await assertFails(setDoc(doc(db, "requests/orphan"), newRequestAs(ADMIN, { clientId: "nope" })));
  });

  it("can delete", async () => {
    await assertSucceeds(deleteDoc(doc(dbFor(ADMIN), "requests/req-a")));
  });
});

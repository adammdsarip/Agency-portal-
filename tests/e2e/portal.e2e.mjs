/**
 * End-to-end test of the portal against the local Firebase emulators.
 *
 *   npm run test:e2e
 *
 * `firebase emulators:exec` starts Auth + Firestore, then this script starts
 * `next dev` pointed at them and drives a real browser (Playwright/Chromium)
 * through the admin and client flows, including cross-client isolation.
 *
 * Browser: uses Playwright's Chromium. Run `npx playwright install chromium`
 * once, or set PLAYWRIGHT_CHROMIUM_PATH to an existing Chromium binary.
 * Screenshots are written to tests/e2e/screenshots/ (git-ignored).
 */
import { spawn } from "node:child_process";
import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { chromium } from "playwright";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "../..");
const SHOTS = join(ROOT, "tests/e2e/screenshots");
const PORT = Number(process.env.E2E_PORT ?? 3100);
const BASE = `http://localhost:${PORT}`;
const PROJECT_ID = "demo-agency-portal";

process.env.FIREBASE_AUTH_EMULATOR_HOST ??= "127.0.0.1:9099";
process.env.FIRESTORE_EMULATOR_HOST ??= "127.0.0.1:8080";

mkdirSync(SHOTS, { recursive: true });
initializeApp({ projectId: PROJECT_ID });
const auth = getAuth();

let passed = 0;
function check(condition, message) {
  if (!condition) throw new Error(`FAILED: ${message}`);
  passed += 1;
  console.log(`  ✓ ${message}`);
}
const section = (name) => console.log(`\n${name}`);

// ---------- dev server ----------

function startDevServer() {
  const server = spawn("npx", ["next", "dev", "-p", String(PORT)], {
    cwd: ROOT,
    env: {
      ...process.env,
      NEXT_PUBLIC_FIREBASE_API_KEY: "demo-api-key",
      NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: `${PROJECT_ID}.firebaseapp.com`,
      NEXT_PUBLIC_FIREBASE_PROJECT_ID: PROJECT_ID,
      NEXT_PUBLIC_FIREBASE_APP_ID: "demo-app-id",
      NEXT_PUBLIC_USE_FIREBASE_EMULATORS: "true",
      FIREBASE_ADMIN_PROJECT_ID: PROJECT_ID,
      NEXT_TELEMETRY_DISABLED: "1",
    },
    stdio: ["ignore", "pipe", "pipe"],
    detached: true,
  });
  let output = "";
  server.stdout.on("data", (d) => (output += d));
  server.stderr.on("data", (d) => (output += d));
  server.output = () => output;
  return server;
}

async function waitForServer() {
  for (let i = 0; i < 90; i++) {
    try {
      const res = await fetch(`${BASE}/login`);
      if (res.ok) return;
    } catch {
      // not up yet
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error("Dev server did not start in time");
}

// ---------- helpers ----------

async function newPage(browser, viewport = { width: 390, height: 844 }) {
  const ctx = await browser.newContext({ viewport, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  page.on("pageerror", (e) => console.log("    [pageerror]", e.message));
  return page;
}

async function login(browser, email, password, viewport) {
  const page = await newPage(browser, viewport);
  await page.goto(`${BASE}/login`);
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  return page;
}

async function createClient(page, name, plan) {
  await page.goto(`${BASE}/admin/clients/new`);
  await page.getByLabel("Company name").fill(name);
  await page.getByLabel("Name", { exact: true }).fill("Main Contact");
  await page.getByLabel("Status", { exact: true }).selectOption("active");
  await page.getByLabel("Plan name").fill(plan);
  await page.getByLabel("Internal notes").fill(`Secret internal note for ${name}`);
  await page.getByRole("button", { name: "Create client" }).click();
  await page.waitForURL(/\/admin\/clients\/[^/?]+\?tab=users/);
  return new URL(page.url()).pathname.split("/").pop();
}

async function invite(page, name, email) {
  await page.getByLabel("Name", { exact: true }).fill(name);
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.getByRole("button", { name: "Create login" }).click();
  await page.getByText("Login created for").waitFor();
}

async function addDeliverable(page, d) {
  await page.getByRole("button", { name: "Add deliverable" }).first().click();
  const dlg = page.locator("dialog[open]");
  await dlg.getByLabel("Title").fill(d.title);
  await dlg.getByLabel("Category").selectOption(d.category);
  await dlg.getByLabel("Status").selectOption(d.status);
  await dlg.getByLabel("Delivery date").fill(d.date);
  await dlg.getByLabel("Description").fill(d.description);
  await dlg.getByLabel("Google Drive link").fill("https://drive.google.com/drive/folders/1AbCdEfGhIjKlMnOp");
  await dlg.getByLabel("Notes").fill(d.notes);
  await dlg.getByRole("button", { name: "Add deliverable" }).click();
  await page.locator("dialog[open]").waitFor({ state: "detached" });
  await page.getByText(d.title).first().waitFor();
}

async function submitRequest(page, r) {
  await page.getByRole("button", { name: "New request" }).first().click();
  const dlg = page.locator("dialog[open]");
  await dlg.getByLabel("What do you need?").fill(r.title);
  await dlg.getByLabel("Details").fill(r.details);
  await dlg.getByLabel("Type").selectOption(r.type);
  if (r.fileUrl) await dlg.getByLabel("File link (optional)").fill(r.fileUrl);
  if (r.urgent) await dlg.getByText("Urgent", { exact: true }).click();
  await dlg.getByRole("button", { name: "Send request" }).click();
  await page.locator("dialog[open]").waitFor({ state: "detached" });
}

const listItems = (page) => page.locator("main ul > li");

async function idTokenFromPage(page) {
  return page.evaluate(
    () =>
      new Promise((resolve) => {
        const req = indexedDB.open("firebaseLocalStorageDb");
        req.onsuccess = () => {
          const all = req.result.transaction("firebaseLocalStorage", "readonly").objectStore("firebaseLocalStorage").getAll();
          all.onsuccess = () => resolve(all.result[0]?.value?.stsTokenManager?.accessToken);
        };
      }),
  );
}

// ---------- the test ----------

async function run(browser) {
  // Bootstrap the admin exactly as a real deployment would (scripts/set-admin.mjs).
  await new Promise((resolve, reject) => {
    const p = spawn("node", ["scripts/set-admin.mjs", "admin@agency.test"], { cwd: ROOT, env: process.env, stdio: "ignore" });
    p.on("exit", (code) => (code === 0 ? resolve() : reject(new Error(`set-admin exited ${code}`))));
  });
  const adminUser = await auth.getUserByEmail("admin@agency.test");
  check(adminUser.customClaims?.role === "admin", "set-admin script grants the admin claim");
  await auth.updateUser(adminUser.uid, { password: "admin-pass-123", displayName: "Agency Admin" });

  section("Admin: clients, logins, deliverables");
  const admin = await login(browser, "admin@agency.test", "admin-pass-123");
  await admin.waitForURL("**/admin/clients");
  await admin.getByText("No clients yet").waitFor();
  check(true, "admin lands on the clients list");

  const clientA = await createClient(admin, "Northwind Coffee", "Social Growth — Monthly");
  await invite(admin, "Alice Walker", "alice@northwind.test");
  const clientB = await createClient(admin, "Blue Harbor Hotels", "");
  await invite(admin, "Bob Stone", "bob@blueharbor.test");
  check(true, "admin creates two clients and a login for each");

  await admin.goto(`${BASE}/admin/clients/${clientA}?tab=deliverables`);
  await admin.getByText("No deliverables for Northwind Coffee yet").waitFor();
  await addDeliverable(admin, {
    title: "Instagram Campaign",
    category: "design",
    status: "in_review",
    date: "2026-09-28",
    description: "Autumn launch carousel — 6 slides.",
    notes: "Please leave feedback by Friday.",
  });
  await addDeliverable(admin, {
    title: "Launch Video",
    category: "video",
    status: "completed",
    date: "2026-10-05",
    description: "30s hero cut, 9:16 and 16:9.",
    notes: "",
  });
  await admin.screenshot({ path: `${SHOTS}/admin-deliverables-mobile.png`, fullPage: true });

  for (const email of ["alice@northwind.test", "bob@blueharbor.test"]) {
    const u = await auth.getUserByEmail(email);
    await auth.updateUser(u.uid, { password: "client-pass-123" });
  }
  const alice = await auth.getUserByEmail("alice@northwind.test");
  check(alice.customClaims?.role === "client" && alice.customClaims?.clientId === clientA, "client login carries role=client and its clientId");

  section("Client A: home and deliverables");
  const c = await login(browser, "alice@northwind.test", "client-pass-123");
  await c.waitForURL(`${BASE}/portal`);
  await c.getByText("Instagram Campaign").waitFor();
  check(await c.locator("main").getByText("Northwind Coffee").isVisible(), "home shows the company name");
  check(await c.getByText("Social Growth — Monthly").isVisible(), "home shows the retainer plan");

  await c.getByRole("link", { name: "Deliverables" }).click();
  await c.waitForURL("**/portal/deliverables");
  await c.getByText("Launch Video").waitFor();
  check((await listItems(c).count()) === 2, "client A sees exactly its 2 deliverables");
  check((await c.getByText("Secret internal note").count()) === 0, "admin-only notes are never shown");
  await c.screenshot({ path: `${SHOTS}/client-deliverables-mobile.png`, fullPage: true });

  await c.getByLabel("Search deliverables").fill("video");
  check((await listItems(c).count()) === 1, "search filters");
  await c.getByLabel("Search deliverables").fill("");
  await c.getByRole("radio", { name: "Design" }).click();
  check((await listItems(c).count()) === 1, "category filter");
  await c.getByRole("radio", { name: "All" }).click();
  await c.getByLabel("Filter by status").selectOption("completed");
  check((await listItems(c).count()) === 1, "status filter");
  await c.getByLabel("Filter by status").selectOption("all");

  await c.getByRole("button", { name: /Instagram Campaign/ }).click();
  const sheet = c.locator("dialog[open]");
  await sheet.getByText("Please leave feedback by Friday.").waitFor();
  check(await sheet.getByRole("link", { name: "Open in Google Drive" }).isVisible(), "detail sheet has Open in Google Drive");
  await c.screenshot({ path: `${SHOTS}/client-deliverable-detail-mobile.png` });
  await sheet.getByRole("button", { name: "Close" }).click();

  await addDeliverable(admin, {
    title: "Menu Photography",
    category: "photo",
    status: "approved",
    date: "2026-10-12",
    description: "12 edited product shots.",
    notes: "",
  });
  await c.getByText("Menu Photography").waitFor({ timeout: 10000 });
  check(true, "a new deliverable appears live in client A's portal");

  await admin.getByRole("button", { name: "Archive (hide from client)" }).first().click();
  await c.waitForFunction(() => document.querySelectorAll("main ul > li").length === 2);
  check(true, "archiving hides a deliverable from the client");

  section("Requests");
  await c.goto(`${BASE}/portal/requests`);
  await c.getByText("No open requests").waitFor();
  await submitRequest(c, {
    title: "Story graphics for weekend offer",
    details: "3 Instagram stories, 20% off all pastries, Sat–Sun.",
    type: "social_media",
    fileUrl: "https://drive.google.com/file/d/1AbCdEfGhIjKlMnOp/view",
    urgent: true,
  });
  await c.getByText("Your request was sent").waitFor();
  await c.getByText("Story graphics for weekend offer").waitFor();
  check(await c.getByText("Urgent").first().isVisible(), "client submits an urgent request with a file link");
  await c.screenshot({ path: `${SHOTS}/client-requests-mobile.png`, fullPage: true });

  await submitRequest(c, { title: "Update opening hours on website", details: "", type: "website" });
  await c.getByText("Update opening hours on website").waitFor();
  await c.getByRole("button", { name: /Update opening hours/ }).click();
  await c.locator("dialog[open]").getByRole("button", { name: "Withdraw request" }).click();
  await c.locator("dialog[open]").getByRole("button", { name: "Withdraw", exact: true }).click();
  await c.locator("dialog[open]").getByText("Cancelled").waitFor();
  await c.locator("dialog[open]").getByRole("button", { name: "Close" }).click();
  await c.getByRole("radio", { name: "Closed" }).click();
  await c.getByText("Update opening hours on website").waitFor();
  check(true, "client can withdraw a request that hasn't been started");
  await c.getByRole("radio", { name: "Open" }).click();

  await admin.goto(`${BASE}/admin/requests`);
  await admin.getByText("Story graphics for weekend offer").waitFor();
  check(await admin.getByText("Northwind Coffee").first().isVisible(), "admin inbox shows the request with its client");
  check((await admin.getByText("Update opening hours on website").count()) === 0, "withdrawn requests leave the open inbox");
  await admin.getByRole("button", { name: /Story graphics/ }).click();
  const adminSheet = admin.locator("dialog[open]");
  await adminSheet.getByLabel("Status").selectOption("waiting_on_client");
  await adminSheet.getByLabel("Reply to client").fill("Love it — can you send the product photos?");
  await adminSheet.getByRole("button", { name: "Save" }).click();
  await admin.locator("dialog[open]").waitFor({ state: "detached" });

  await c.getByText("Needs your input").waitFor({ timeout: 10000 });
  check(true, "status change appears live for the client");
  await c.getByRole("button", { name: /Story graphics/ }).click();
  await c.locator("dialog[open]").getByText("can you send the product photos?").waitFor();
  check((await c.locator("dialog[open]").getByRole("button", { name: "Withdraw request" }).count()) === 0, "client can't withdraw once work has started");
  check(true, "client sees the agency's reply");
  await c.screenshot({ path: `${SHOTS}/client-request-detail-mobile.png` });
  await c.locator("dialog[open]").getByRole("button", { name: "Close" }).click();

  await c.goto(`${BASE}/portal`);
  await c.getByText("Open requests · 1").waitFor();
  check(true, "home shows the open request count");
  await c.screenshot({ path: `${SHOTS}/client-home-mobile.png`, fullPage: true });

  await admin.goto(`${BASE}/admin/clients/${clientA}?tab=requests`);
  await admin.getByRole("radio", { name: "All" }).click();
  await admin.getByText("Update opening hours on website").waitFor();
  check((await listItems(admin).count()) === 2, "client profile lists that client's requests");

  section("Isolation: client B");
  const b = await login(browser, "bob@blueharbor.test", "client-pass-123");
  await b.waitForURL(`${BASE}/portal`);
  await b.goto(`${BASE}/portal/deliverables`);
  await b.getByText("No deliverables yet").waitFor();
  check((await b.getByText("Instagram Campaign").count()) === 0, "client B can't see client A's deliverables");
  await b.goto(`${BASE}/portal/requests`);
  await b.getByText("No open requests").waitFor();
  await b.getByRole("radio", { name: "Closed" }).click();
  await b.getByText("No closed requests yet").waitFor();
  check((await b.getByText("Story graphics").count()) === 0, "client B can't see client A's requests");

  await b.goto(`${BASE}/admin/clients`);
  await b.waitForURL(`${BASE}/portal`);
  check(true, "client B is redirected away from /admin");

  const token = await idTokenFromPage(b);
  const asClient = await fetch(`${BASE}/api/admin/clients/${clientB}/users`, {
    method: "POST",
    headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
    body: JSON.stringify({ email: "evil@x.test" }),
  });
  check(asClient.status === 403, "admin API rejects a client token (403)");
  const anonymous = await fetch(`${BASE}/api/admin/users/${alice.uid}`, { method: "PATCH", body: "{}" });
  check(anonymous.status === 401, "admin API rejects missing token (401)");

  section("Admin: disable a login");
  await admin.goto(`${BASE}/admin/clients/${clientB}?tab=users`);
  await admin.getByRole("button", { name: "Disable" }).click();
  await admin.getByText("Disabled", { exact: true }).waitFor();
  check((await auth.getUserByEmail("bob@blueharbor.test")).disabled, "disabling a login disables the Auth user");

  section("Desktop screenshots");
  const desktop = { width: 1280, height: 860 };
  const cd = await login(browser, "alice@northwind.test", "client-pass-123", desktop);
  await cd.waitForURL(`${BASE}/portal`);
  await cd.getByText("Instagram Campaign").waitFor();
  await cd.screenshot({ path: `${SHOTS}/client-home-desktop.png` });
  await cd.goto(`${BASE}/portal/deliverables`);
  await cd.getByText("Launch Video").waitFor();
  await cd.screenshot({ path: `${SHOTS}/client-deliverables-desktop.png` });
  const ad = await login(browser, "admin@agency.test", "admin-pass-123", desktop);
  await ad.waitForURL("**/admin/clients");
  await ad.goto(`${BASE}/admin/requests`);
  await ad.getByText("Story graphics for weekend offer").waitFor();
  await ad.screenshot({ path: `${SHOTS}/admin-requests-desktop.png` });
  check(true, "screenshots saved to tests/e2e/screenshots/");
}

const server = startDevServer();
let exitCode = 0;
let browser;
try {
  await waitForServer();
  browser = await chromium.launch(
    process.env.PLAYWRIGHT_CHROMIUM_PATH ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH } : {},
  );
  await run(browser);
  console.log(`\n${passed} checks passed`);
} catch (error) {
  exitCode = 1;
  console.error(`\n${error.stack ?? error}`);
  console.error("\n--- dev server output (tail) ---\n" + server.output().slice(-3000));
} finally {
  await browser?.close();
  try {
    process.kill(-server.pid, "SIGTERM");
  } catch {
    // already gone
  }
}
process.exit(exitCode);

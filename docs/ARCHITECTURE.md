# Agency Portal — Architecture

Priority order for every decision: **Security → Scalability → Functionality → Design**.

Stack: Next.js 16 (App Router, TypeScript, Tailwind v4) · Firebase Authentication ·
Cloud Firestore · Firebase Admin SDK (in Next.js route handlers) · Google Drive (links) ·
Vercel or Netlify hosting · PWA manifest.

---

## 1. Project structure

```
.
├── firestore.rules            # THE security boundary (deployed with firebase-tools)
├── firestore.indexes.json     # Composite indexes the app's queries need
├── firebase.json              # Rules/indexes paths + local emulator config
├── scripts/
│   └── set-admin.mjs          # Bootstraps the first admin (custom claims)
├── tests/
│   └── rules/                 # Security-rules tests against the Firestore emulator
├── docs/ARCHITECTURE.md
└── src/
    ├── app/                   # Routes only — thin, compose features
    │   ├── login/             # Sign in + password reset
    │   ├── portal/            # CLIENT area  (Home | Calendar | Deliverables | Requests | More)
    │   ├── admin/             # ADMIN area   (Clients, Client profile, Deliverables manager)
    │   ├── api/admin/...      # Server-only endpoints (Admin SDK): create/disable client logins
    │   └── manifest.ts        # PWA manifest
    ├── features/              # One folder per business module
    │   ├── auth/              # AuthProvider, RoleGuard, claims types
    │   ├── clients/           # types, Firestore data access, admin components
    │   ├── deliverables/      # types, constants, data access, client + admin components
    │   └── users/             # portal-user data access + admin API client
    ├── components/
    │   ├── ui/                # Design-system primitives (Button, Input, Sheet, Badge…)
    │   └── layout/            # Portal shell / bottom nav, admin shell
    └── lib/
        ├── firebase/          # client.ts (browser SDK) · admin.ts (server SDK, server-only)
        ├── server/            # requireAdmin() — ID-token verification for API routes
        └── utils/             # dates, Google Drive URL helpers, cn()
```

**Why feature folders:** each future module (calendar, requests, chat, invoices…) becomes a
new folder under `src/features/` plus a route, with no reshuffling of existing code. Pages
never call Firestore directly — they go through each feature's `api.ts`, so query shapes
(which the security rules depend on) live in one place.

## 2. Firebase architecture

| Concern            | Service                          | Why |
|--------------------|----------------------------------|-----|
| Identity           | Firebase Auth (email + password) | Non-technical clients; no OAuth setup needed. Providers can be added later. |
| Roles / tenancy    | **Custom claims** `{ role, clientId }` | Set only by the Admin SDK, signed into the ID token → tamper-proof and free to check in rules (no extra document read). |
| Data               | Cloud Firestore                  | Real-time listeners: a deliverable an admin creates appears in the client's portal instantly. |
| Authorization      | **Firestore Security Rules**     | Enforced by Google's servers on every read/write; the frontend is never trusted. |
| Privileged actions | Next.js route handlers + Admin SDK | Creating logins and setting claims must happen server-side. Route handlers deploy with the site on Vercel/Netlify, so no Cloud Functions / Blaze plan is required yet. |
| Files              | Google Drive links               | Agency already works in Drive; the portal stores links + preview images. Drive API integration is a later module. |

The browser SDK talks to Firestore directly (fast, real-time, offline-capable); anything that
changes *who can access what* goes through the server.

## 3. Firestore collections

```
users/{uid}                       # mirror of auth profile (read-only for clients)
  email, displayName, role: "admin"|"client", clientId: string|null,
  disabled: bool, createdAt, createdBy

clients/{clientId}                # client-visible company profile
  name, status: "active"|"inactive",
  contactName, contactEmail, phone, website, industry, logoUrl, driveFolderUrl,
  retainer: { status: "active"|"paused"|"ended"|"none", planName },
  createdAt, updatedAt, createdBy, updatedBy

clients/{clientId}/private/profile   # ADMIN-ONLY data about a client
  internalNotes, billingEmail, updatedAt, updatedBy

deliverables/{deliverableId}      # top-level, tenant-scoped by clientId
  clientId, title, description,
  category: design|video|photo|document|social_media|website|other,
  status:   draft|in_review|approved|completed,
  previewUrl, googleDriveUrl, deliveryDate (Timestamp|null), notes,
  archived: bool, createdAt, updatedAt, createdBy, updatedBy
```

Decisions:
- **`id` is the document ID** (exposed as `id` by the data converter) rather than a duplicated
  field that could drift.
- **Top-level `deliverables` with a `clientId` field** (not a subcollection): admins can
  query across all clients ("everything due this week") with a simple query, and the rules
  still pin every client read to their own `clientId`.
- **Private subcollection for admin-only fields.** Firestore rules secure whole documents,
  not fields. Anything a client must never see (internal notes, billing) lives in
  `clients/{id}/private/*`, which only admins can read.
- **Enum values are stable slugs** (`in_review`), labels live in code — renaming a label never
  requires a data migration.
- **Archive instead of delete** by default (`archived: true` hides it from the client);
  hard delete is still available to admins.
- **Dates:** `deliveryDate` is a date-only value stored as a Timestamp at 00:00 UTC and always
  formatted in UTC, so it never shifts a day across time zones.
- **Future collections** follow the same tenant pattern (`clientId` field + rules):
  `requests`, `contentItems` (calendar / IG / TikTok posts), `threads/{id}/messages` (chat),
  `invoices`, `payments`, `assets`, `clients/{id}/private/*` for web/domain credentials,
  `users/{uid}/notifications`, `users/{uid}/pushTokens`.

## 4. Authentication structure

- **Admin users:** created in the Firebase console (or by the script), then promoted with
  `npm run set-admin -- you@agency.com` → claims `{ role: "admin" }`.
- **Client users:** created by an admin from the client profile ("Portal users" → invite).
  The server route creates the Auth user, sets claims `{ role: "client", clientId }`, writes
  `users/{uid}`, and returns a password-setup link (the admin can also have Firebase email it).
- **Login:** one `/login` page. After sign-in the app reads the claims from the ID token and
  routes admins to `/admin` and clients to `/portal`.
- **Route guards** in the UI are for navigation only. Even if bypassed, every query is
  rejected by the rules unless the token carries the right claims.
- **Revocation:** disabling a client login disables the Auth user and revokes refresh tokens;
  deactivating a client company (`status: "inactive"`) blocks its deliverables in the rules
  immediately.

## 5. Security rules (summary — full file: `firestore.rules`)

- Default **deny everything**; each collection opts in.
- `users/{uid}`: read own doc or admin. **No client writes at all** — role/clientId are
  server-controlled.
- `clients/{clientId}`: read if admin **or** `token.clientId == clientId`. Only admins write,
  and the document is schema-validated (allowed keys, types, enum values, `https://` URLs).
- `clients/{id}/private/*`: admins only.
- `deliverables/{id}`: a client may read only if
  `resource.data.clientId == token.clientId`, `archived == false`, and their company is
  active. Queries that don't constrain `clientId` to the caller's own are rejected outright
  (rules are not filters). Only admins create/update/delete; `clientId`, `createdAt`,
  `createdBy` are immutable; `updatedAt` must equal server time; the client must exist.
- All of this is covered by automated tests in `tests/rules/` run against the emulator.

## 6. User ↔ client relationship

```
Client (company)  1 ──── * User (role=client, clientId=<company>)
Admin user        (role=admin, no clientId) ── manages all clients
```

A company can have several logins (owner, marketing manager…). Each client login belongs to
exactly one company — the `clientId` claim. If multi-company logins are ever needed, a
`memberships` collection can replace the single claim without changing the data layout.

## 7. Pages and components

Client portal (`/portal`, bottom nav on mobile, sidebar on desktop):
| Route | Status |
|---|---|
| `/portal` Home — welcome, company, retainer status, latest deliverables, placeholders for invoice/content/requests | built |
| `/portal/deliverables` — search, category + status filters, cards, detail sheet, Open in Drive | built |
| `/portal/calendar`, `/portal/requests` | placeholder |
| `/portal/more` — account, sign out, upcoming modules | built |

Admin (`/admin`):
| Route | Status |
|---|---|
| `/admin` Clients list + search | built |
| `/admin/clients/new` Add client | built |
| `/admin/clients/[clientId]` Profile: edit info, internal notes, portal users, deliverables | built |
| `/admin/deliverables` Deliverables manager with client selector | built |

Key components: `AuthProvider`, `RoleGuard`, `PortalShell`, `AdminShell`, `DeliverableCard`,
`DeliverableDetailSheet`, `DeliverableFilters`, `DeliverableForm`, `DeliverablesManager`,
`ClientForm`, `ClientUsersPanel`, UI primitives in `components/ui`.

## 8. Environment variables

See `.env.example`.

| Variable | Where | Purpose |
|---|---|---|
| `NEXT_PUBLIC_FIREBASE_API_KEY`, `…_AUTH_DOMAIN`, `…_PROJECT_ID`, `…_STORAGE_BUCKET`, `…_MESSAGING_SENDER_ID`, `…_APP_ID` | browser | Firebase web config (public by design — security comes from rules) |
| `NEXT_PUBLIC_USE_FIREBASE_EMULATORS` | browser | `true` to use local emulators |
| `FIREBASE_ADMIN_PROJECT_ID`, `FIREBASE_ADMIN_CLIENT_EMAIL`, `FIREBASE_ADMIN_PRIVATE_KEY` | **server only** | Service account for the Admin SDK. Never prefix with `NEXT_PUBLIC_`. |

## 9. Installation commands

```bash
npm install
cp .env.example .env.local           # fill in values
npx firebase login
npx firebase use --add               # pick your Firebase project
npm run deploy:firestore             # deploy rules + indexes
npm run set-admin -- you@agency.com  # promote your account to admin
npm run dev
npm run test:rules                   # security tests (needs Java for the emulator)
```

## 10. Implementation plan

1. **Foundation (this PR):** Firebase setup, auth with role claims, rules + tests, clients
   database, deliverables (client + admin), PWA manifest.
2. **Requests:** `requests` collection (clients may *create* for their own `clientId` only),
   status workflow, admin inbox.
3. **Content calendar:** `contentItems` with platform (Instagram/TikTok), schedule date,
   approval by client.
4. **Chat:** `threads/{clientId}/messages`, real-time.
5. **Retainers, invoices, payments:** `invoices` (read-only for clients), Stripe via server
   routes / webhooks.
6. **Digital assets & website/domain info:** `assets`, admin-only secrets in `private/*`.
7. **Notifications:** in-app `users/{uid}/notifications`, then FCM web push with a service
   worker (full PWA offline support at that point).
8. **Google Drive integration:** server-side Drive API to list/upload files into each client's
   folder.
9. **Hardening:** Firebase App Check, session cookies + server-side route protection, audit log.

# Agency Client Portal

Mobile-first client portal for an agency: clients see their deliverables; admins manage
clients, portal logins and deliverables. Built with **Next.js 16 + Firebase Auth + Cloud
Firestore**, deployable to Vercel or Netlify, installable as a PWA.

> Architecture, data model, security model and roadmap: **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)**

## What's in this version

- **Auth** — email/password login, password reset, role-based routing (admin vs client) via
  Firebase custom claims.
- **Security** — `firestore.rules` enforce tenant isolation server-side; covered by
  automated tests (`npm run test:rules`).
- **Client portal** — Home (welcome, company, retainer, latest deliverables), Deliverables
  (search, category & status filters, detail sheet, Open in Google Drive), Requests (submit
  with details, type, deadline, file link and priority; track status; read the agency's reply;
  withdraw), More. Calendar is a placeholder.
- **Admin** — clients list, add/edit client (with admin-only internal notes), portal-user
  invites & disabling, deliverables manager (add, edit, status, archive, delete), requests
  inbox across all clients (status workflow + reply to the client).
- **PWA** — web manifest + icons (service worker comes with push notifications).

## Setup

1. **Create a Firebase project** at <https://console.firebase.google.com>.
   - *Build → Authentication → Sign-in method*: enable **Email/Password**.
   - *Build → Firestore Database*: create a database (production mode).
   - *Project settings → Your apps*: add a **Web app**, copy its config.
   - *Project settings → Service accounts*: **Generate new private key** (for the server).
2. **Configure env vars**
   ```bash
   npm install
   cp .env.example .env.local   # fill in the values
   ```
3. **Deploy security rules and indexes** (never skip this — rules are the security boundary)
   ```bash
   npx firebase login
   npx firebase use --add        # select your project
   npm run deploy:firestore
   ```
4. **Create your admin account**
   ```bash
   npm run set-admin -- you@youragency.com
   ```
   If the account didn't exist, the script prints a link to set its password.
5. **Run**
   ```bash
   npm run dev                   # http://localhost:3000
   ```
6. In the admin area: **Add client → Portal users → Create login**, then send the client the
   password-setup email/link. Add deliverables from the client's page or the Deliverables
   manager — they appear in that client's portal instantly.

### Local development with emulators (no real project needed)

```bash
npm run emulators              # Auth + Firestore emulators, UI on :4000
```
In `.env.local` set `NEXT_PUBLIC_USE_FIREBASE_EMULATORS=true`, a `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
of `demo-agency-portal`, any non-empty API key/app id, and add
`FIRESTORE_EMULATOR_HOST=127.0.0.1:8080` and `FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099`.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` / `build` / `start` | Next.js |
| `npm run lint` / `typecheck` | ESLint / TypeScript |
| `npm run test:rules` | Security-rules tests on the Firestore emulator (requires Java 11+) |
| `npm run test:e2e` | Browser end-to-end tests: starts emulators + dev server, drives Chromium through admin and client flows (run `npx playwright install chromium` once, or set `PLAYWRIGHT_CHROMIUM_PATH`) |
| `npm run emulators` | Local Auth + Firestore emulators |
| `npm run deploy:firestore` | Deploy `firestore.rules` + `firestore.indexes.json` |
| `npm run set-admin -- <email>` | Grant the admin role |

## Deploying

**Vercel (recommended):** import the repo, add every variable from `.env.example` in
*Project → Settings → Environment Variables* (paste `FIREBASE_ADMIN_PRIVATE_KEY` with its
`\n` escapes), deploy. **Netlify** works the same way with its Next.js runtime.

Then in Firebase *Authentication → Settings → Authorized domains*, add your production domain
(needed for password-reset links).

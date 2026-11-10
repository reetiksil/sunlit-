# Sunlit Pages

A quiet reading room for web fiction and your own documents. Browse a catalog, read with full typography control,
keep a bookshelf, and load your own EPUB, PDF, text or pasted prose. Curators get an admin studio.

**Stack:** Next.js 14 (App Router) · TypeScript · Tailwind · Zustand · TanStack Query · Dexie (IndexedDB) · epub.js · pdf.js · Vitest · Playwright

## Quick start

```bash
npm install
cp .env.example .env.local      # then edit it (see below)
npm run dev                     # http://localhost:3000
```

Scripts: `npm run lint`, `npm run type-check`, `npm test`, `npm run build`, `npm run test:e2e` (needs `npx playwright install`).

## Environment variables

| Variable | Required | Purpose |
|---|---|---|
| `AUTH_SECRET` | **Production** | Random string, 32+ chars, signs session cookies. `openssl rand -base64 48`. In development a built-in insecure fallback is used and anyone can forge sessions, so always set it for anything public. |
| `ADMIN_EMAILS` | No | Comma-separated emails that receive the **admin** role (applied server-side at sign-up and sign-in). |
| `DATA_DIR` | No | Directory for `users.json` and `catalog.json`. Default `./.data` (git-ignored). Must be a persistent, writable disk. |
| `ADMIN_NAME`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` | Only for `seed:admin` | Credentials for the seed script (it also prompts if they are missing). |

## Authentication and roles

There are two roles, **reader** (default) and **admin**.

- **Sign-up / login / logout / sessions.** `POST /api/auth/register|login|logout`, `GET /api/auth/me`. Passwords are hashed with scrypt.
  A successful login sets an **httpOnly, SameSite=Lax, signed (HMAC-SHA256) cookie** valid for 7 days, so sessions survive reloads and restarts.
  The client store (`useAuthStore`) is only a cache of `/api/auth/me`; it is not persisted, so editing `localStorage` cannot change who you are.
- **The role is never client-controlled.** The registration schema has no `role` field (extra keys are stripped), and the role is assigned in
  `createUser()` on the server from `ADMIN_EMAILS`. The role in the cookie is signed, and every admin API re-reads the user from the store, so
  demotions and deletions take effect immediately.
- **Enforcement points**
  1. `src/middleware.ts` redirects anonymous visitors from `/admin` and `/bookshelf` to `/login?next=…`, shows a 403 page to non-admins on `/admin`, and returns 401/403 JSON for `/api/admin/*`.
  2. Every `/api/admin/*` handler calls `requireRole("admin")` itself (defence in depth) and validates input with zod. Admin-only operations: create/update/delete books, save chapters, list users.
  3. The UI hides admin links from non-admins and the admin page renders a "curator access required" state, but these are conveniences, not the security boundary.
- **Other protections:** same-origin check on every state-changing endpoint, login/sign-up rate limiting, constant-time password and signature comparison, equalised timing for unknown emails, open-redirect-safe `?next=`.

### Creating the first admin

Pick one:

```bash
# A) Seed script. Creates the admin, or promotes + resets the password if the email exists.
ADMIN_EMAIL=you@example.com ADMIN_PASSWORD='a long passphrase' npm run seed:admin

# B) Env-configured email. Put it in .env.local, then register normally with that email.
ADMIN_EMAILS=you@example.com
```

## Reader

- **Typography panel** (chapter pages and "Read your own"): theme (5), typeface (5), size (14-30 px), line height, paragraph spacing, weight,
  alignment, column width. Everything persists in `localStorage` and is validated/clamped on load.
  Font size changes only the text; the column width is rem-based so it never behaves like page zoom.
- **Reader mode:** hides the site header, footer and ambient background and gives the text a quiet, centred page. Exit with `Esc` or the floating pill.
- **Read your own:** EPUB, PDF, `.txt`/`.md`, or pasted text. Plain text keeps paragraphs, line breaks, headings (`#`) and lists. PDFs are re-flowed into
  paragraphs page by page (with an "Original PDF" view). EPUBs receive the same typography via epub.js. Documents live only in your browser (IndexedDB).
  Limits: 25 MB for EPUB/PDF, 2 MB / 1,000,000 characters for text. Empty, oversized, binary-looking, password-protected and corrupt files show a clear message.
  Remove a document from the viewer or shelf (with confirmation) at any time.

## Project layout

```
src/app/api/            auth, catalog (public read) and admin (admin-only write) route handlers
src/lib/session.ts      edge-safe signed session tokens
src/lib/server/         user store, catalog store, guards, rate limit (server only)
src/middleware.ts       route protection
src/components/reader/  typography drawer, reader column/blocks
src/lib/                readerStyle, textBlocks, pdfText, epubTheme, validations
scripts/seed-admin.mjs  first-admin seeding
```

## Known limitations

- Users and catalog edits are stored in JSON files under `DATA_DIR`. That is fine for a single server or VPS but **not** for serverless hosts
  with ephemeral disks or multi-instance deployments; swap `src/lib/server/users.ts` and `catalog.ts` for a database before scaling.
- No email verification or password reset. Rate limiting is in-memory and per-process.
- Bookshelf and reading progress are still per-browser (localStorage), not per account.
- PDF paragraph detection is heuristic; multi-column or scanned PDFs may need the "Original PDF" view.

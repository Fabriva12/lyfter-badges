# Lyfter Badges — Implementation Plan

> **Documento histórico.** Refleja el diseño original y no se actualiza. El pseudo-schema de la
> sección 4 está desactualizado: usa los roles `ORGANIZER`/`PARTNER`, no incluye `Company` ni
> `CompanyMember` y omite `Scan.eventBadgeId`. La fuente vigente es
> [`prisma/schema.prisma`](./prisma/schema.prisma) y su resumen en
> [`docs/database.md`](./docs/database.md).

Status: **in progress** — Supabase connected (session pooler + `lyfter_shadow`). Phase 0 complete
(auth + domain schema, single initial migration, `Level` seed, Better Auth route, `proxy.ts`).
Phase 1 complete (`/login` with Server Actions and validated `next`). Phase 2 complete
(`/s/[token]` check-in + badge claim, idempotent, demo seed behind `SEED_DEMO_DATA`). Phase 3 complete
(`/collection` with global XP, level progression, per-event collection and prize status). Phase 4
complete (`/leaderboard` with global and per-event scope: podium, top 10, and a competition
rank that is not the same as the position in the list, ordered by XP, stands or talks). Phase 5 complete (public `/badge/[eventBadgeId]` page with
dynamic OG image through `ImageResponse`, share intents for X, WhatsApp and Facebook, and a copy-link
button). The share URL is keyed by `eventBadgeId`, never by the QR token, so sharing does not leak the
scan secret. Phase 6 complete (the event prize stays a secret until the attendee completes the
badge set: the collection card renders three states — locked, announced by the organizer, and
unlocked — and a locked prize ships without its details, so the name never reaches the browser).
Phase 7 complete (admin panel: an ORGANIZER manages only the events they own — badges, QR tokens,
stand partners, prize and scan log — and a PARTNER sees a read-only view of the stands assigned to
them. Ownership is per stand: `EventBadge.partnerId`, not a whole event). The badge economy is
enforced by the schema: `Scan` is unique per `(userId, eventBadgeId)`, so a badge can have several
printed QR tokens and still be collected only once per attendee.

## 1. Product model

An attendee scans a welcome QR to register for a Lyfter event, then scans a QR at each
talk and stand. Each scan awards a badge (collectible proof of presence) and XP. XP raises
the attendee's level. They can compare progress on a leaderboard, share badges on social
media, and unlock a prize by completing every badge for an event.

Behind it sits an admin panel for the Lyfter team and for partners (companies with stands).

### Gamification axes

Two distinct axes over the same `Scan` table. Mixing them up is the main design risk here.

| Axis | Scope | Purpose |
| --- | --- | --- |
| Level | **Global** — `SUM(Scan.xpAwarded)` across all events | Retention: attendees return to the next event already at level 5 |
| Leaderboard | **Global or per event** — XP, stand visits or talk attendance | Fair competition within a single day, plus the platform-wide race |

A global level is what makes the attendee come back. A per-event leaderboard is what keeps
the event from being a formality for veterans. The leaderboard can also be read globally,
and each scope can be sorted by `xp`, `stands` or `talks`.

### Aggregates

More than three questions, three different cuts of the same table:

```
level        SUM(Scan.xpAwarded)
leaderboard  SUM(Scan.xpAwarded)                  metric xp
             COUNT(*) WHERE Badge.type = STAND    metric stands
             COUNT(*) WHERE Badge.type = TALK     metric talks
collection   COUNT(DISTINCT Scan.qrTokenId)  WHERE eventId = X
```

The leaderboard scope is either global (no `eventId`) or one event (`WHERE eventId = X`).
`WELCOME` and `SPECIAL` badges add XP and collection count, but they are not a stand
visit or a talk attendance.

`Prize.requiredBadgesCount` is always compared against the collection count **within the
same event**. A prize belongs to one event.

Do **not** cache a running `xpTotal` on `User`. Each of the three questions above needs a
different cut, and a denormalized counter drifts without a traceable source. `Level` is the
only cached table.

## 2. Stack

| Layer | Choice | Rationale |
| --- | --- | --- |
| Framework | Next.js 16.3 + React 19.2 | Already in the repo |
| Styling | Tailwind 4 | Already in the repo |
| ORM | **Prisma 7.10** (not 8) | Prisma 8 is a release candidate, and `prisma dev` changes meaning in 8 |
| Database | **Supabase Postgres**, session pooler | Hosted and IPv4-reachable; no local server to keep alive |
| Auth | **Better Auth 1.4+** | `next-auth` v5 is still beta after 4 years and had a critical fail-open CVE in 2026 |
| Package manager | pnpm | Already in the repo |

### Why not the alternatives

- **Docker** — technically fine, and the `compose.yml` is a good course deliverable, but the
  course does not cover containers and this machine has 7.86 GB of RAM. Docker Desktop + WSL2
  costs ~2.5 GB permanently, which starves `next dev` on a 6-core i5-10400.
- **`npx prisma dev`** (PGlite) — zero install, but its default is stateless: schema included,
  so every restart needs a re-migrate. The CLI documents no persistence flag, and the default
  is ambiguous between the CLI docs and the `@prisma/dev` API. Too much uncertainty to build on.
- **`next-auth`** — v5 has never shipped stable. Do not use it for a new project.
- **Supabase Auth** — hands the session layer to an SDK. This is a Next.js course; delegating the
  framework's core mechanism defeats the point. Using Supabase as a *Postgres host* is a
  different decision and is what we do: the database is hosted, the auth stays ours.

## 3. Prerequisites (manual, outside the repo)

1. Create a **Supabase** project (free tier). The region sets the latency: this project lives
   in `aws-1-us-west-2` (Oregon), so every query pays a transatlantic hop.
2. Take the **Session pooler** URI from the dashboard (Connect → Session pooler) and replace
   the literal `[YOUR-PASSWORD]` placeholder yourself — the dashboard does not do it for you.
3. Three variables, one host:

   ```
   DATABASE_URL         -> session pooler, database postgres   (app runtime)
   DIRECT_URL           -> session pooler, database postgres   (migrations, introspection)
   SHADOW_DATABASE_URL  -> session pooler, database lyfter_shadow
   ```

4. Create the shadow database. The Supabase SQL editor wraps everything in a transaction, so
   `CREATE DATABASE` fails there; run it through a `pg` script against the session pooler.

Port `5432` (session mode) is mandatory. The direct connection is IPv6-only on the free tier,
and the transaction pooler (`6543`) breaks prepared statements and migrations.

Free-tier projects pause after ~7 days of inactivity. Wake the project from the dashboard
before `migrate` or `dev` will reach it.

## 4. Domain model

```prisma
User          // generated by Better Auth + `role` via additionalFields
enum Role { ATTENDEE ORGANIZER PARTNER }

Event         // a Lyfter event
Badge         // catalog entry: name, description, xpValue, imageUrl
EventBadge    // badge enabled for an event: room, startsAt
QrToken       // the physical QR: opaque token, kind (WELCOME|BADGE), eventId, eventBadgeId?
Registration  // welcome check-in: UNIQUE(userId, eventId)
Scan          // every scan: UNIQUE(userId, qrTokenId), xpAwarded, scannedAt
Level         // level, name, minXp
Prize         // event prize: requiredBadgesCount, revealedAt
```

A `WELCOME` token points at an event but has no `eventBadge`; scanning it creates the
`Registration` and awards no XP. A `BADGE` token requires that registration and creates a
`Scan`. Both scans are idempotent: a repeat returns the previous result instead of an error.

Two uniqueness constraints are non-negotiable:

- `Scan(userId, qrTokenId)` — stops someone photographing the same QR 400 times.
- `Registration(userId, eventId)` — stops double check-in.

Both must be database constraints, not application checks. Application-level checks race.

## 5. QR mechanism

Primary path: the in-app scanner at `/scan` (camera plus image upload). Fallback: the deep link
`/s/[token]`.

The QR is printed and stuck on a talk wall or stand. The native camera app can still open the
deep link, but the in-app scanner removes the hand-off: the attendee stays signed in, and the
welcome check-in gate is resolved before the claim page loads. Camera access requires a secure
context (HTTPS or localhost), so the deep link remains the universal fallback.

### Scan flow with auth gate

```
/s/[token]
  -> proxy.ts: no session cookie
/login?next=/s/[token]
  -> Better Auth: sign in / sign up
/s/[token]          <- returns with the token intact
  -> Server Action: records the scan
badge awarded + XP
```

`next` must survive the round trip. Losing it forces the attendee to re-scan the physical QR,
which reintroduces exactly the friction the deep link removed.

`next` is user-controlled. Validate it: relative paths only, must start with `/`, must not
start with `//`. Unvalidated `redirect(next)` is an open redirect, and this app has an admin
panel.

## 6. Directory layout

```
app/
  (marketing)/        landing + public event pages
  (attendee)/         collection, XP, level, leaderboard
  (admin)/            events, badges, QR tokens, scans
  scan/               in-app QR scanner (camera + image upload)
  s/[token]/          QR landing and claim
  login/
  api/auth/[...all]/  Better Auth handler
lib/
  auth.ts             Better Auth instance (nextCookies() LAST)
  db.ts               PrismaClient singleton
  session.ts          DAL: requireSession() / requireRole()
  gamification/       XP + level logic, PURE functions, no Prisma import
  redirect.ts         `next` parameter validation
proxy.ts              optimistic guard (cookie check only)
prisma/
  schema.prisma  migrations/  seed.ts
prisma7.config.ts     datasource url + shadowDatabaseUrl (Prisma 7.10 name, NOT prisma.config.ts)
app/generated/prisma/ generated client — import from here, never from @prisma/client
```

`lib/gamification/` must stay pure. `levelForXp(xp)` and `badgesNeededForPrize(event)`
are testable with no database and survive a Prisma API change.

## 7. Phase 0 execution order

The ordering matters — there is a real dependency.

1. Set `DATABASE_URL`, `DIRECT_URL`, `SHADOW_DATABASE_URL` in `.env`; create `lyfter_shadow`
2. Prisma init — generates both `schema.prisma` and `prisma7.config.ts`
3. **Better Auth first** — install, run the CLI `generate` to emit `User`, `Session`,
   `Account`, `Verification`
4. Add the domain models by hand on top; `Role` as a Better Auth `additionalFields` entry
5. **One** `prisma migrate dev` — a single clean initial migration
6. Mount `app/api/auth/[...all]/route.ts`, write `proxy.ts` and `seed.ts`

Running Better Auth before the hand-written schema avoids merging a generated schema into an
existing one.

## 8. Phases

| # | Deliverable | Core learning |
| --- | --- | --- |
| 0 | Prisma + schema + seed + Better Auth + `proxy.ts` | Server Components, DAL, `prisma.config.ts` |
| 1 | `/login` with cookie session, validated `next` | Server Actions, forms, validation |
| 2 | `/s/[token]` — records, renders badge + XP | `updateTag()`, business-rule errors |
| 3 | Collection + global XP + level | Aggregates, pure testable functions |
| 4 | Global and per-event leaderboard by XP, stands or talks | Ranking, scope filters, cache keys |
| 5 | Social sharing + dynamic OG image | `ImageResponse`, dynamic metadata |
| 6 | Prize revealed on set completion | State feedback |
| 7 | Admin panel (organizer + partner) | Roles, per-role authorization |

## 9. Gotchas

### Next.js 16

- `await cookies()`, `await params`, `await searchParams`. Synchronous access is removed.
- `middleware.ts` is `proxy.ts` now. Runtime is nodejs.
- `revalidateTag(tag, 'max')` — the second argument is required and is a TypeScript error
  without it.
- `updateTag()` gives read-your-writes. A newly scanned badge must appear immediately, not
  after stale-while-revalidate.
- `npx next typegen` generates the `PageProps<'/s/[token]'>` helpers.
- **Server Actions bypass `proxy.ts`.** They are POSTs to the same URL as the page, so matcher
  rules do not separate them from the GET. Every mutating action validates its own session.
- The `scroll-behavior` override during navigation is gone unless `data-scroll-behavior="smooth"` is
  set on `<html>`.
- **A server component's props travel to the browser inside the RSC payload.** Hiding a value in
  the UI is not enough: the data layer must not return it. A locked prize is queried with
  `details: null`, not with a name the component refuses to render.
- `eslint-config-next` rejects `setState` inside an effect (`react-hooks/set-state-in-effect`).
  Read browser-only values with `useSyncExternalStore` instead.

### Prisma 7

- Connection URLs live in `prisma7.config.ts` — 7.10 no longer generates `prisma.config.ts`:
  `datasource: { url, shadowDatabaseUrl }`.
- The CLI reads `DIRECT_URL`; the app adapter reads `DATABASE_URL`. Same host, two roles.
- Supabase TLS under `pg` 8: `sslmode=require` behaves as `verify-full` and dies with
  `SELF_SIGNED_CERT_IN_CHAIN` against the pooler. `sslmode=no-verify` keeps TLS but skips
  chain validation.
- `pnpm-workspace.yaml`'s `allowBuilds` needs real booleans. Placeholder text there makes
  every `pnpm` command die with `ERR_PNPM_IGNORED_BUILDS` before Prisma even starts.
- The generator's `output` field is required, and `PrismaClient` is imported from the
  generated path — not from `@prisma/client`.
- `shadowDatabaseUrl` is not optional. Without it the first `migrate dev` succeeds and later
  ones fail with `relation "..." already exists`.
- Known bug on a fresh instance: the first `migrate dev` can fail with
  `P1017 Server has closed the connection` (prisma/orm#29366). Create `_prisma_migrations`
  manually and re-run.
- `migrate dev` refuses to run non-interactively when the datasource emits a warning (for
  example a new unique constraint). Generate the SQL with
  `prisma migrate diff --from-config-datasource --to-schema prisma/schema.prisma --script`,
  write it into `prisma/migrations/<timestamp>_<name>/migration.sql`, then run
  `prisma migrate deploy`.
- The diff only knows the schema, not the data. A new `NOT NULL` column needs the backfill and the
  dedupe hand-written **between** `ADD COLUMN` and `SET NOT NULL`, inside one `BEGIN; … COMMIT;`:
  the unique index cannot be created before the duplicate rows are gone. `Scan.eventBadgeId` is the
  example — backfill it from `QrToken.eventBadgeId`, keep the oldest scan per `(userId,
  eventBadgeId)` and delete the rest.

### Better Auth

- `nextCookies()` must be **last** in the plugins array.
- In `proxy.ts` use `getSessionCookie` — a cheap cookie existence check with no database hit.
  Full validation belongs in pages, route handlers, and Server Actions. A crafted cookie must
  not grant access.
- The schema CLI moved to the `auth` package: `npx auth generate`. The old
  `@better-auth/cli` is deprecated and its latest version (1.4.x) does not match `better-auth`
  1.7.
- The CLI loads `lib/auth.ts` through `jiti`, which does not resolve the `@/` alias. Keep
  `lib/db.ts` importing the generated client with a relative path, or the CLI dies with
  `Cannot find module '@/app/generated/prisma/client'`.
- In Prisma 7 the seed command lives in `prisma7.config.ts` under `migrations.seed`
  (`"tsx prisma/seed.ts"`).
- A seeded demo user needs an `Account` row with `providerId: "credential"` and a password hashed
  with `hashPassword` from `better-auth/crypto`; the `User` row alone cannot sign in.

### Admin panel

- Authorization lives in pure functions (`lib/admin/access.ts`) so the rules are testable without a
  database: `ORGANIZER` owns an event by `organizerId`, `PARTNER` owns one `EventBadge` by
  `partnerId`. Ownership of an `EventBadge` is a property of the relation, not of the event.
- A foreign object returns `notFound()`, never `403`. A 403 confirms that the object exists and
  leaks the id space; a 404 says nothing.
- Server Actions re-check the session and the object scope themselves, because they bypass
  `proxy.ts` — the cookie check in `proxy.ts` is only a redirect for humans.
- Admin queries must not use `unstable_cache`: a dashboard has to show the scan that just happened.
  Public read models keep their tags, and any admin mutation that changes what attendees see calls
  `revalidateTag(configTag(), "max")` (badge count, prize state).
- `datetime-local` has no timezone. The whole app uses `America/Costa_Rica` (UTC−6, no DST):
  `parseLocalDateTime` and `toLocalInputValue` in `lib/date.ts` own the form round-trip, and every
  date is displayed with `es-CR` and a 24-hour clock. Existing events located in Costa Rica were
  shifted +6 h once with `scripts/migrate-costa-rica-times.ts` so their configured wall time stays.
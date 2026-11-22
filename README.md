# Lyfter Badges

Aplicación de gamificación para eventos de Lyfter. Los asistentes escanean un QR de
bienvenida, se registran y después escanean el QR de cada charla o stand. Cada escaneo
otorga un badge y XP: la XP acumulada define el **nivel global** del asistente, mientras
que el ranking puede ser **global o por evento** y ordenarse por XP, stands o charlas. Al
completar todos los badges de un evento se desbloquea el premio.

Detrás hay un panel de administración para el equipo de Lyfter (`ADMIN`) y para las
empresas con stand (también `ADMIN`, acotado a su stand), más un panel global para el
administrador de la plataforma (`SUPER_ADMIN`) en `/super-admin`.

El diseño técnico completo, las decisiones de arquitectura y los detalles del modelo de
dominio están en [`PLAN.md`](./PLAN.md).

## Documentación

- [`docs/architecture.md`](./docs/architecture.md) — capas, regla de dependencias y flujos.
- [`docs/database.md`](./docs/database.md) — entidades, relaciones e invariantes.
- [`docs/schema.sql`](./docs/schema.sql) — SQL generado desde `prisma/schema.prisma`.

## Stack

| Capa | Tecnología |
| --- | --- |
| Framework | Next.js 16.3 + React 19.2 |
| Estilos | Tailwind CSS 4 |
| ORM | Prisma 7.10 |
| Base de datos | Supabase Postgres (session pooler) |
| Autenticación | Better Auth 1.7 |
| Tests | Vitest |
| Gestor de paquetes | pnpm |

## Requisitos

- Node.js 20+
- pnpm
- Un proyecto de Supabase accesible

Variables en `.env`:

| Variable | Uso |
| --- | --- |
| `DATABASE_URL` | Conexión usada por la app en runtime |
| `DIRECT_URL` | Conexión usada por la CLI de Prisma (migraciones) |
| `SHADOW_DATABASE_URL` | Base `lyfter_shadow` para `migrate dev` |
| `BETTER_AUTH_SECRET` | Secreto de Better Auth |
| `BETTER_AUTH_URL` | URL base de la app (por ejemplo `http://localhost:3000`) |
| `SEED_DEMO_DATA` | Habilita los datos de demo en el seed (`false` por defecto en `.env.example`) |

Las URLs de conexión viven en `prisma7.config.ts` (Prisma 7.10 no genera
`prisma.config.ts`). Si el proyecto de Supabase está pausado, despertalo desde el panel
antes de correr migraciones o el seed.

## Puesta en marcha

```bash
pnpm install
pnpm prisma generate
pnpm prisma migrate deploy
pnpm dev
```

Para desarrollo con migraciones nuevas:

```bash
pnpm prisma migrate dev
```

La app queda en [http://localhost:3000](http://localhost:3000).

## Datos de demo

El seed siempre crea los niveles (`Level`). El resto del contenido de demo está detrás de
`SEED_DEMO_DATA=true`, que en `.env.example` figura como `false` (hay que ponerlo en `true`
al correr el seed).

PowerShell:

```powershell
$env:SEED_DEMO_DATA="true"; pnpm prisma db seed
```

Bash:

```bash
SEED_DEMO_DATA=true pnpm prisma db seed
```

El seed es idempotente: crea/actualiza los eventos **Lyfter Demo Costa Rica 2026** y
**Lyfter Meetup Costa Rica 2026**, sus badges, tokens QR, premios y asistentes con distinto XP.
Las fechas se guardan en UTC y se muestran en hora Costa Rica (UTC−6).

| Evento | Sede | Fecha (hora Costa Rica) |
| --- | --- | --- |
| Lyfter Demo Costa Rica 2026 | San José | 20 nov 2026, 10:00–16:00 |
| Lyfter Meetup Costa Rica 2026 | Escazú | 4 dic 2026, 11:00–17:00 |

## Usuarios de test

Estos usuarios tienen cuenta con contraseña (Better Auth, proveedor `credential`) y sirven
para entrar al panel:

| Rol | Email | Contraseña | Entrada en el navbar | Acceso |
| --- | --- | --- | --- | --- |
| `SUPER_ADMIN` | `superadmin@lyfter.demo` | `lyfter-demo-2026` | **Super Admin** | `/super-admin`: todas las empresas, eventos y administradores |
| `ADMIN` (organizador) | `organizer@lyfter.demo` | `lyfter-demo-2026` | **Admin** | `/admin` y los eventos de su empresa |
| `ADMIN` (partner/stand) | `partner@lyfter.demo` | `lyfter-demo-2026` | **Admin** | `/admin`, solo el stand asignado en modo lectura |

El resto de los asistentes sembrados existen únicamente para poblar el leaderboard y la
colección; **no tienen cuenta de credenciales, así que no pueden iniciar sesión**:

| Email | Colección en el evento demo | XP |
| --- | --- | --- |
| `attendee@lyfter.demo` | 2 de 4 badges | 110 |
| `builder@lyfter.demo` | 3 de 4 badges | 150 |
| `coder@lyfter.demo` | 2 de 4 badges | 120 |
| `dev@lyfter.demo` | 1 de 4 badges | 50 |
| `ema@lyfter.demo` | 4 de 4 badges (premio desbloqueado) | 220 |

`attendee@lyfter.demo` además participa del meetup con un badge, para mostrar el estado de
premio "anunciado pero no ganado".

> `verify-fase3@lyfter.test` es un usuario de verificación residual creado por registro
> manual. No se usa en el flujo normal y su contraseña no está documentada.

Para crear más usuarios, usá el formulario de `/login` (pestaña **Create account**). El rol
por defecto es `ATTENDEE`; los roles `ADMIN` y `SUPER_ADMIN` se asignan por base de datos
(el rol `ADMIN` cubre tanto organizadores como partners de stand).

## QRs de demo

Cada token se puede abrir directamente en el navegador con `/s/<token>`. Si no hay sesión,
la app redirige a `/login` y conserva el destino original. También podés escanear con la
cámara o subir una foto del QR desde `/scan`; la cámara requiere HTTPS o localhost.

| Evento | Token | URL | Tipo |
| --- | --- | --- | --- |
| Lyfter Demo Costa Rica 2026 | `demo-welcome` | `/s/demo-welcome` | Bienvenida (registro) |
| Lyfter Demo Costa Rica 2026 | `demo-keynote` | `/s/demo-keynote` | Insignia — Charla inaugural (50 XP) |
| Lyfter Demo Costa Rica 2026 | `demo-rsc` | `/s/demo-rsc` | Insignia — React Server Components (60 XP) |
| Lyfter Demo Costa Rica 2026 | `demo-supabase` | `/s/demo-supabase` | Insignia — Stand de Supabase (40 XP) |
| Lyfter Demo Costa Rica 2026 | `demo-auth` | `/s/demo-auth` | Insignia — Taller de Better Auth (70 XP) |
| Lyfter Meetup Costa Rica 2026 | `demo-meetup-welcome` | `/s/demo-meetup-welcome` | Bienvenida (registro) |
| Lyfter Meetup Costa Rica 2026 | `demo-meetup-checkin` | `/s/demo-meetup-checkin` | Insignia — Registro del meetup (20 XP) |
| Lyfter Meetup Costa Rica 2026 | `demo-meetup-talks` | `/s/demo-meetup-talks` | Insignia — Charlas relámpago (30 XP) |

Los escaneos son idempotentes: repetir el mismo QR no vuelve a otorgar XP.

## Rutas

| Ruta | Descripción | Acceso |
| --- | --- | --- |
| `/` | Landing pública | Público |
| `/login` | Inicio de sesión y registro | Público |
| `/events` | Catálogo público de eventos | Público |
| `/s/[token]` | Landing del QR: registra el escaneo o reclama el badge | Requiere sesión |
| `/scan` | Escáner de QR con cámara o imagen | Requiere sesión |
| `/collection` | Colección, XP global y nivel | Requiere sesión |
| `/leaderboard` | Ranking global o por evento, por XP/stands/talks | Requiere sesión |
| `/share/[token]` | Colección compartida e imagen OG | Público |
| `/badge/[eventBadgeId]` | Página pública del badge e imagen OG | Público |
| `/admin` | Panel según rol | `ADMIN` / `SUPER_ADMIN` |
| `/admin/audit` | Auditoría del panel | `ADMIN` / `SUPER_ADMIN` |
| `/admin/events/[id]` | Detalle del evento (badges, premio, escaneos) | `ADMIN` de la empresa dueña / `SUPER_ADMIN` |
| `/admin/events/[id]/badges` | Insignias y QR del evento | `ADMIN` de la empresa dueña / `SUPER_ADMIN` |
| `/admin/events/[id]/prize` | Premio del evento | `ADMIN` de la empresa dueña / `SUPER_ADMIN` |
| `/admin/events/[id]/attendees` | Participantes del evento | `ADMIN` de la empresa dueña / `SUPER_ADMIN` |
| `/admin/events/[id]/scans` | Escaneos del evento | `ADMIN` de la empresa dueña / `SUPER_ADMIN` |
| `/admin/events/[id]/metrics` | Métricas del evento | `ADMIN` de la empresa dueña / `SUPER_ADMIN` |
| `/admin/events/[id]/audit` | Auditoría del evento | `ADMIN` de la empresa dueña / `SUPER_ADMIN` |
| `/admin/stands/[eventBadgeId]` | Vista de solo lectura del stand | `ADMIN` asignado al stand / `SUPER_ADMIN` |
| `/super-admin` | Panel global: empresas, eventos y administradores | `SUPER_ADMIN` |
| `/super-admin/companies` | Empresas y administradores | `SUPER_ADMIN` |
| `/super-admin/events` | Eventos de todas las empresas | `SUPER_ADMIN` |
| `/super-admin/users` | Usuarios y roles | `SUPER_ADMIN` |
| `/super-admin/metrics` | Métricas de la plataforma | `SUPER_ADMIN` |
| `/super-admin/audit` | Auditoría global | `SUPER_ADMIN` |

Un objeto que no pertenece al usuario responde `404` a propósito, para no filtrar la
existencia de ids ajenos.

## Scripts

| Comando | Qué hace |
| --- | --- |
| `pnpm dev` | Servidor de desarrollo |
| `pnpm build` | Build de producción |
| `pnpm start` | Sirve el build |
| `pnpm lint` | ESLint |
| `pnpm test` | Tests con Vitest |
| `pnpm test:watch` | Vitest en modo watch |
| `pnpm tsx scripts/migrate-costa-rica-times.ts` | Simula el corrimiento de +6 h en eventos de Costa Rica |
| `pnpm tsx scripts/migrate-costa-rica-times.ts --apply` | Aplica el corrimiento de +6 h (no re-seeding después) |
| `pnpm tsx scripts/verify-leaderboard.ts` | Verifica ranking, podium y conteos |
| `pnpm tsx scripts/verify-collection.ts` | Verifica XP global vs. por evento |
| `pnpm tsx scripts/verify-partner.ts` | Verifica roles y stands del partner de demo |

## Estructura

```
app/                  rutas (App Router)
  admin/              panel de organizador y partner
  super-admin/        panel global del SUPER_ADMIN
  api/auth/[...all]/  handler de Better Auth
  badge/              página pública del badge + OG image
  collection/         colección, XP y nivel
  events/             catálogo público de eventos
  leaderboard/        ranking global o por evento
  login/              login y registro
  s/[token]/          landing de los QR
  scan/               escáner de QR
  share/[token]/      colección compartida + OG image
components/           UI (landing, admin, collection, auth, share, scan)
lib/
  auth.ts             instancia de Better Auth
  date.ts             fecha/hora en America/Costa_Rica
  db.ts               PrismaClient singleton
  session.ts          helpers de sesión (requireSession / requireRole)
  gamification/       lógica pura de XP, niveles, colección y ranking
  admin/              permisos, guards, queries y validación del panel
  scan/               resolver de targets de escaneo
  share/              share tokens y URL
prisma/
  schema.prisma       modelo de datos
  migrations/         migraciones
  seed.ts             datos de demo
prisma7.config.ts     datasource + shadow DB + seed (nombre propio de Prisma 7.10)
scripts/              scripts manuales de inspección, migración y verificación
```

## Troubleshooting

- **`ENOTFOUND ... tenant/user postgres.<ref> not found`**: el proyecto de Supabase está
  pausado o la connection string quedó vieja. Despertalo desde el dashboard y verificá
  `DATABASE_URL` / `DIRECT_URL`.
- **`P1017 Server has closed the connection` en el primer `migrate dev`**: bug conocido de
  Prisma en instancias nuevas. Crear `_prisma_migrations` a mano y reintentar.
- **`SELF_SIGNED_CERT_IN_CHAIN`**: usar `sslmode=no-verify` contra el pooler de Supabase.
- **`ERR_PNPM_IGNORED_BUILDS`**: `allowBuilds` en `pnpm-workspace.yaml` necesita booleanos
  reales.

Más gotchas de Next.js 16, Prisma 7 y Better Auth en [`PLAN.md`](./PLAN.md).

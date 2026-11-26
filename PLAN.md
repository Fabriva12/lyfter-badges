# Lyfter Badges — Plan de implementación

> **Documento histórico.** Refleja el diseño original y no se actualiza. El pseudo-schema de la
> sección 4 está desactualizado: usa los roles `ORGANIZER`/`PARTNER`, no incluye `Company` ni
> `CompanyMember` y omite `Scan.eventBadgeId`. La fuente vigente es
> [`prisma/schema.prisma`](./prisma/schema.prisma) y su resumen en
> [`docs/database.md`](./docs/database.md).

Estado: **en progreso** — Supabase conectado (session pooler + `lyfter_shadow`). Fase 0 completada
(autenticación + esquema de dominio, migración inicial única, seed de `Level`, ruta de Better Auth, `proxy.ts`).
Fase 1 completada (`/login` con Server Actions y `next` validado). Fase 2 completada
(`/s/[token]` check-in + reclamo de badge, idempotente, seed de demo detrás de `SEED_DEMO_DATA`). Fase 3 completada
(`/collection` con XP global, progresión de niveles, colección por evento y estado del premio). Fase 4
completada (`/leaderboard` con alcance global y por evento: podio, top 10 y un
puesto de competencia que no es lo mismo que la posición en la lista, ordenado por XP, stands o charlas). Fase 5 completada (página pública `/badge/[eventBadgeId]` con
imagen OG dinámica mediante `ImageResponse`, intents de compartir en X, WhatsApp y Facebook y un
botón de copiar enlace). La URL de compartir se basa en `eventBadgeId`, nunca en el token QR, de modo que compartir no filtra el
secreto del escaneo. Fase 6 completada (el premio del evento permanece en secreto hasta que el asistente completa el
conjunto de badges: la tarjeta de colección muestra tres estados — bloqueado, anunciado por el organizador y
desbloqueado — y un premio bloqueado se envía sin sus detalles, de modo que el nombre nunca llega al navegador).
Fase 7 completada (panel de administración: un ORGANIZER gestiona solo los eventos que posee — badges, tokens QR,
partners de stand, premio y registro de escaneos — y un PARTNER ve una vista de solo lectura de los stands asignados a
él. La propiedad es por stand: `EventBadge.partnerId`, no un evento completo). La economía de badges se
garantiza en el esquema: `Scan` es único por `(userId, eventBadgeId)`, de modo que un badge puede tener varios
tokens QR impresos y aun así recogerse una sola vez por asistente.

## 1. Modelo de producto

Un asistente escanea un QR de bienvenida para registrarse en un evento de Lyfter, y luego escanea un QR en cada
charla y stand. Cada escaneo otorga un badge (prueba de presencia coleccionable) y XP. La XP eleva
el nivel del asistente. Pueden comparar el progreso en un leaderboard, compartir badges en redes
sociales y desbloquear un premio al completar todos los badges de un evento.

Detrás se encuentra un panel de administración para el equipo de Lyfter y para los partners (empresas con stands).

### Ejes de gamificación

Dos ejes distintos sobre la misma tabla `Scan`. Confundirlos es el principal riesgo de diseño aquí.

| Eje | Alcance | Propósito |
| --- | --- | --- |
| Nivel | **Global** — `SUM(Scan.xpAwarded)` en todos los eventos | Retención: los asistentes regresan al siguiente evento ya en el nivel 5 |
| Leaderboard | **Global o por evento** — XP, visitas a stands o asistencia a charlas | Competencia justa dentro de un solo día, más la carrera a nivel de toda la plataforma |

Un nivel global es lo que hace que el asistente vuelva. Un leaderboard por evento es lo que evita
que el evento sea un mero trámite para los veteranos. El leaderboard también puede leerse de forma global,
y cada alcance puede ordenarse por `xp`, `stands` o `talks`.

### Agregados

Más que tres preguntas, tres cortes distintos de la misma tabla:

```
level        SUM(Scan.xpAwarded)
leaderboard  SUM(Scan.xpAwarded)                  metric xp
             COUNT(*) WHERE Badge.type = STAND    metric stands
             COUNT(*) WHERE Badge.type = TALK     metric talks
collection   COUNT(DISTINCT Scan.qrTokenId)  WHERE eventId = X
```

El alcance del leaderboard es global (sin `eventId`) o un solo evento (`WHERE eventId = X`).
Los badges `WELCOME` y `SPECIAL` suman XP y al recuento de colección, pero no son una visita
a un stand ni una asistencia a una charla.

`Prize.requiredBadgesCount` siempre se compara con el recuento de colección **dentro del
mismo evento**. Un premio pertenece a un solo evento.

**No** almacenes en caché un `xpTotal` acumulado en `User`. Cada una de las tres preguntas anteriores necesita
un corte distinto, y un contador desnormalizado se desvía sin una fuente rastreable. `Level` es la
única tabla en caché.

## 2. Stack

| Capa | Elección | Justificación |
| --- | --- | --- |
| Framework | Next.js 16.3 + React 19.2 | Ya está en el repo |
| Estilos | Tailwind 4 | Ya está en el repo |
| ORM | **Prisma 7.10** (no 8) | Prisma 8 es una versión candidata, y `prisma dev` cambia de significado en 8 |
| Base de datos | **Supabase Postgres**, session pooler | Alojada y accesible por IPv4; sin servidor local que mantener vivo |
| Autenticación | **Better Auth 1.4+** | `next-auth` v5 sigue en beta después de 4 años y tuvo una CVE crítica de fail-open en 2026 |
| Gestor de paquetes | pnpm | Ya está en el repo |

### ¿Por qué no las alternativas?

- **Docker** — técnicamente bien, y el `compose.yml` es un buen entregable del curso, pero el
  curso no cubre contenedores y esta máquina tiene 7.86 GB de RAM. Docker Desktop + WSL2
  cuesta ~2.5 GB de forma permanente, lo que asfixia `next dev` en un i5-10400 de 6 núcleos.
- **`npx prisma dev`** (PGlite) — instalación cero, pero por defecto es sin estado: incluye el esquema,
  así que cada reinicio requiere volver a migrar. La CLI no documenta ninguna bandera de persistencia, y el
  comportamiento por defecto es ambiguo entre la documentación de la CLI y la API de `@prisma/dev`. Demasiada incertidumbre para construir sobre eso.
- **`next-auth`** — v5 nunca ha entregado una versión estable. No lo uses en un proyecto nuevo.
- **Supabase Auth** — entrega la capa de sesión a un SDK. Este es un curso de Next.js; delegar el
  mecanismo central del framework contradice el objetivo. Usar Supabase como *host de Postgres* es una
  decisión distinta y es lo que hacemos: la base de datos está alojada, la autenticación sigue siendo nuestra.

## 3. Requisitos previos (manuales, fuera del repo)

1. Crea un proyecto en **Supabase** (nivel gratuito). La región define la latencia: este proyecto vive
   en `aws-1-us-west-2` (Oregón), así que cada consulta paga un salto transatlántico.
2. Toma la URI del **Session pooler** del panel (Connect → Session pooler) y reemplaza
   tú mismo el marcador literal `[YOUR-PASSWORD]` — el panel no lo hace por ti.
3. Tres variables, un solo host:

    ```
    DATABASE_URL         -> session pooler, database postgres   (app runtime)
    DIRECT_URL           -> session pooler, database postgres   (migrations, introspection)
    SHADOW_DATABASE_URL  -> session pooler, database lyfter_shadow
    ```

4. Crea la base de datos shadow. El editor SQL de Supabase envuelve todo en una transacción, así que
   `CREATE DATABASE` falla allí; ejecútalo mediante un script `pg` contra el session pooler.

El puerto `5432` (modo sesión) es obligatorio. La conexión directa es solo IPv6 en el nivel gratuito,
y el transaction pooler (`6543`) rompe las sentencias preparadas y las migraciones.

Los proyectos del nivel gratuito se pausan después de ~7 días de inactividad. Despierta el proyecto
desde el panel antes de que `migrate` o `dev` puedan acceder a él.

## 4. Modelo de dominio

```prisma
User          // generated by Better Auth + `role` via additionalFields
enum Role { ATTENDEE ORGANIZER PARTNER }

Event         // a Lyfter event
Badge         // catalog entry: name, imageUrl
EventBadge    // badge enabled for an event: description, xpValue, type, rarity, iconKey, room, startsAt
QrToken       // the physical QR: opaque token, kind (WELCOME|BADGE), eventId, eventBadgeId?
Registration  // welcome check-in: UNIQUE(userId, eventId)
Scan          // every scan: UNIQUE(userId, qrTokenId), xpAwarded, scannedAt
Level         // level, name, minXp
Prize         // event prize: requiredBadgesCount, revealedAt
```

Un token `WELCOME` apunta a un evento pero no tiene `eventBadge`; escanearlo crea el
`Registration` y no otorga XP. Un token `BADGE` requiere ese registro y crea un
`Scan`. Ambos escaneos son idempotentes: una repetición devuelve el resultado anterior en lugar de un error.

Dos restricciones de unicidad son innegociables:

- `Scan(userId, qrTokenId)` — evita que alguien fotografíe el mismo QR 400 veces.
- `Registration(userId, eventId)` — evita el doble check-in.

Ambas deben ser restricciones de base de datos, no comprobaciones de la aplicación. Las comprobaciones a nivel de aplicación tienen condiciones de carrera.

## 5. Mecanismo QR

Ruta principal: el escáner integrado en la app en `/scan` (cámara más subida de imagen). Alternativa: el deep link
`/s/[token]`.

El token de bienvenida se imprime en la entrada; el QR de cada insignia se genera en la pantalla de la charla o del
stand, cambia cada 60 s y tiene vigencia de 90 s. La app nativa de la cámara todavía puede abrir el deep link, pero el
escáner integrado elimina la entrega: el asistente permanece con la sesión iniciada y la
puerta del check-in de bienvenida se resuelve antes de que cargue la página de reclamo. El acceso a la cámara requiere un
contexto seguro (HTTPS o localhost), de modo que el deep link sigue siendo la alternativa universal.

### Flujo de escaneo con puerta de autenticación

```
/s/[token]
  -> proxy.ts: no session cookie
/login?next=/s/[token]
  -> Better Auth: sign in / sign up
/s/[token]          <- returns with the token intact
  -> Server Action: records the scan
badge awarded + XP
```

`next` debe sobrevivir al viaje de ida y vuelta. Perderlo obliga al asistente a volver a escanear el QR físico,
lo que reintroduce exactamente la fricción que el deep link había eliminado.

`next` está controlado por el usuario. Valídalo: solo rutas relativas, debe empezar con `/`, no debe
empezar con `//`. Un `redirect(next)` sin validar es un open redirect, y esta app tiene un
panel de administración.

## 6. Estructura de directorios

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

`lib/gamification/` debe permanecer puro. `levelForXp(xp)` y `badgesNeededForPrize(event)`
se pueden probar sin base de datos y sobreviven a un cambio de API de Prisma.

## 7. Orden de ejecución de la Fase 0

El orden importa: hay una dependencia real.

1. Configura `DATABASE_URL`, `DIRECT_URL`, `SHADOW_DATABASE_URL` en `.env`; crea `lyfter_shadow`
2. Inicializa Prisma — genera tanto `schema.prisma` como `prisma7.config.ts`
3. **Primero Better Auth** — instala, ejecuta el CLI `generate` para emitir `User`, `Session`,
   `Account`, `Verification`
4. Añade los modelos de dominio a mano encima; `Role` como entrada `additionalFields` de Better Auth
5. **Un** `prisma migrate dev` — una sola migración inicial limpia
6. Monta `app/api/auth/[...all]/route.ts`, escribe `proxy.ts` y `seed.ts`

Ejecutar Better Auth antes que el esquema escrito a mano evita tener que fusionar un esquema generado en
uno existente.

## 8. Fases

| # | Entregable | Aprendizaje clave |
| --- | --- | --- |
| 0 | Prisma + esquema + seed + Better Auth + `proxy.ts` | Server Components, DAL, `prisma.config.ts` |
| 1 | `/login` con sesión en cookie, `next` validado | Server Actions, formularios, validación |
| 2 | `/s/[token]` — registra, muestra badge + XP | `updateTag()`, errores de reglas de negocio |
| 3 | Colección + XP global + nivel | Agregados, funciones puras testeables |
| 4 | Leaderboard global y por evento por XP, stands o charlas | Ranking, filtros de alcance, claves de caché |
| 5 | Compartir en redes + imagen OG dinámica | `ImageResponse`, metadatos dinámicos |
| 6 | Premio revelado al completar el conjunto | Feedback de estado |
| 7 | Panel de administración (organizador + partner) | Roles, autorización por rol |

## 9. Problemas conocidos

### Next.js 16

- `await cookies()`, `await params`, `await searchParams`. Se eliminó el acceso síncrono.
- `middleware.ts` es `proxy.ts` ahora. El runtime es nodejs.
- `revalidateTag(tag, 'max')` — el segundo argumento es obligatorio y da un error de TypeScript
  sin él.
- `updateTag()` garantiza leer lo recién escrito. Un badge recién escaneado debe aparecer de inmediato, no
  después de stale-while-revalidate.
- `npx next typegen` genera los ayudantes `PageProps<'/s/[token]'>`.
- **Las Server Actions omiten `proxy.ts`.** Son POST a la misma URL que la página, así que las reglas de matcher
  no las separan del GET. Cada acción que muta valida su propia sesión.
- La anulación de `scroll-behavior` durante la navegación desaparece a menos que `data-scroll-behavior="smooth"` esté
  definido en `<html>`.
- **Las props de un componente de servidor viajan al navegador dentro del payload RSC.** Ocultar un valor en
  la UI no basta: la capa de datos no debe devolverlo. Un premio bloqueado se consulta con
  `details: null`, no con un nombre que el componente se niega a mostrar.
- `eslint-config-next` rechaza `setState` dentro de un efecto (`react-hooks/set-state-in-effect`).
  Lee valores exclusivos del navegador con `useSyncExternalStore` en su lugar.

### Prisma 7

- Las URL de conexión viven en `prisma7.config.ts` — 7.10 ya no genera `prisma.config.ts`:
  `datasource: { url, shadowDatabaseUrl }`.
- La CLI lee `DIRECT_URL`; el adaptador de la app lee `DATABASE_URL`. Mismo host, dos roles.
- TLS de Supabase bajo `pg` 8: `sslmode=require` se comporta como `verify-full` y falla con
  `SELF_SIGNED_CERT_IN_CHAIN` contra el pooler. `sslmode=no-verify` mantiene TLS pero omite
  la validación de la cadena.
- El `allowBuilds` de `pnpm-workspace.yaml` necesita booleanos reales. Un texto de marcador allí hace
  que cada comando `pnpm` muera con `ERR_PNPM_IGNORED_BUILDS` antes de que Prisma siquiera arranque.
- El campo `output` del generador es obligatorio, y `PrismaClient` se importa desde la ruta generada
  — no desde `@prisma/client`.
- `shadowDatabaseUrl` no es opcional. Sin él, el primer `migrate dev` funciona y los siguientes
  fallan con `relation "..." already exists`.
- Bug conocido en una instancia nueva: el primer `migrate dev` puede fallar con
  `P1017 Server has closed the connection` (prisma/orm#29366). Crea `_prisma_migrations`
  manualmente y vuelve a ejecutar.
- `migrate dev` se niega a ejecutarse de forma no interactiva cuando el datasource emite una advertencia
  (por ejemplo una nueva restricción única). Genera el SQL con
  `prisma migrate diff --from-config-datasource --to-schema prisma/schema.prisma --script`,
  escríbelo en `prisma/migrations/<timestamp>_<name>/migration.sql` y luego ejecuta
  `prisma migrate deploy`.
- El diff solo conoce el esquema, no los datos. Una columna `NOT NULL` nueva necesita el backfill y la
  deduplicación escritos a mano **entre** `ADD COLUMN` y `SET NOT NULL`, dentro de un solo `BEGIN; … COMMIT;`:
  el índice único no puede crearse antes de que desaparezcan las filas duplicadas. `Scan.eventBadgeId` es el
  ejemplo — rellénalo desde `QrToken.eventBadgeId`, conserva el escaneo más antiguo por `(userId,
  eventBadgeId)` y elimina el resto.

### Better Auth

- `nextCookies()` debe ir **al final** del array de plugins.
- En `proxy.ts` usa `getSessionCookie` — una comprobación barata de existencia de cookie sin acceso
  a la base de datos. La validación completa corresponde a las páginas, los route handlers y las Server Actions.
  Una cookie falsificada no debe conceder acceso.
- El CLI del esquema se movió al paquete `auth`: `npx auth generate`. El antiguo
  `@better-auth/cli` está obsoleto y su última versión (1.4.x) no coincide con `better-auth`
  1.7.
- El CLI carga `lib/auth.ts` mediante `jiti`, que no resuelve el alias `@/`. Mantén `lib/db.ts` importando
  el cliente generado con una ruta relativa, o el CLI morirá con
  `Cannot find module '@/app/generated/prisma/client'`.
- En Prisma 7 el comando seed vive en `prisma7.config.ts` bajo `migrations.seed`
  (`"tsx prisma/seed.ts"`).
- Un usuario demo sembrado necesita una fila `Account` con `providerId: "credential"` y una contraseña
  hasheada con `hashPassword` de `better-auth/crypto`; la fila `User` por sí sola no puede iniciar sesión.

### Panel de administración

- La autorización vive en funciones puras (`lib/admin/access.ts`) para que las reglas se puedan probar sin
  base de datos: `ORGANIZER` posee un evento por `organizerId`, `PARTNER` posee un `EventBadge` por
  `partnerId`. La propiedad de un `EventBadge` es una propiedad de la relación, no del evento.
- Un objeto ajeno devuelve `notFound()`, nunca `403`. Un 403 confirma que el objeto existe y filtra
  el espacio de ids; un 404 no dice nada.
- Las Server Actions vuelven a comprobar por sí mismas la sesión y el alcance del objeto, porque omiten
  `proxy.ts` — la comprobación de cookie en `proxy.ts` es solo una redirección para humanos.
- Las consultas de administración no deben usar `unstable_cache`: un panel debe mostrar el escaneo que
  acaba de ocurrir. Los modelos de lectura públicos conservan sus tags, y cualquier mutación de administración
  que cambie lo que ven los asistentes llama a `revalidateTag(configTag(), "max")` (recuento de badges, estado del premio).
- `datetime-local` no tiene zona horaria. Toda la app usa `America/Costa_Rica` (UTC−6, sin horario de verano):
  `parseLocalDateTime` y `toLocalInputValue` en `lib/date.ts` gestionan el ciclo del formulario, y cada
  fecha se muestra con `es-CR` y un reloj de 24 horas. Los eventos existentes ubicados en Costa Rica se
  desplazaron +6 h una vez con `scripts/migrate-costa-rica-times.ts` para conservar la hora local configurada.

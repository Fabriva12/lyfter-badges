# Arquitectura por capas

La app separa tres capas: **datos** (Prisma), **reglas puras** (lógica testeable sin base de
datos) e **interfaz** (páginas, componentes y Server Actions). El objetivo es que una regla de
negocio se pueda probar con `pnpm test` y que una página no pueda consultar la base de datos
por accidente.

## Capas

| Capa | Archivos reales | Responsabilidad |
| --- | --- | --- |
| Acceso a datos | `lib/db.ts`, `lib/auth.ts`, `lib/admin/queries.ts`, `lib/gamification/queries.ts`, `lib/share/collection.ts`; escrituras de auditoría/roles/guards en `lib/admin/audit.ts`, `lib/admin/roles.ts`, `lib/admin/guards.ts` | Único lugar con `prisma`. Consultas, caché con tags y escrituras de apoyo |
| Lógica de negocio | `lib/admin/{access,validation,metrics,badges,gallery,slug}.ts`, `lib/gamification/{levels,collection,leaderboard}.ts`, `lib/scan/target.ts`, `lib/share/token.ts`, `lib/{date,qr,redirect,share}.ts` | Funciones puras: permisos, validación, métricas, niveles, ranking, tokens y fechas |
| Interfaz | `app/**/page.tsx`, `app/**/layout.tsx`, `components/**` y los módulos `app/**/actions.ts` | Render, interacción y orquestación de Server Actions |

Las reglas puras tienen su test al lado (`lib/admin/access.test.ts`,
`lib/gamification/levels.test.ts`, `lib/scan/target.test.ts`, etc.). Hoy `lib/admin/slug.ts` y
`lib/redirect.ts` no tienen un `*.test.ts` dedicado.

## Regla de dependencias

```text
UI (páginas / componentes)
        │  llama
        ▼
Server Actions  →  validación  →  reglas puras  →  datos  →  revalidateTag / updateTag
        ▲
        │  también llama
páginas RSC  ───────────────────────────────────►  datos
```

- La UI **no importa Prisma**. Una página pide datos a un módulo de acceso a datos.
- Las reglas puras **no importan Prisma**. Reciben datos y devuelven un resultado; por eso se
  testean sin base de datos.
- Las acciones son la capa de aplicación: orquestan `validar → reglas → datos → revalidar`.
- La flecha nunca se invierte: los módulos de datos no importan páginas ni componentes.

### Excepción actual

Los 8 módulos de Server Actions (`app/**/actions.ts`, 7 de ellos con import directo de
`prisma`) siguen combinando orquestación y acceso a datos; por ahora permanecen en la capa de
aplicación. Esta entrega saca Prisma de los 4 archivos de presentación que lo importaban:
`app/badge/[eventBadgeId]/page.tsx`, `app/badge/[eventBadgeId]/opengraph-image.tsx`,
`app/s/[token]/page.tsx` y `app/scan/page.tsx`. Sus lecturas viven ahora en
`lib/share/collection.ts` y `lib/gamification/queries.ts`, con el mismo `select`/`include`,
orden y manejo de errores.

## Flujo: reclamo de un badge por QR

1. `app/s/[token]/page.tsx` exige sesión y pide el QR a `lib/gamification/queries.ts`.
2. Si el QR está activo, consulta si el usuario ya hizo check-in y pasa ambos datos a
   `resolveScanTarget` (`lib/scan/target.ts`): sabe si es bienvenida, si falta el check-in, si
   el badge aún no arranca o si el QR expiró.
3. La página muestra el bloqueo correspondiente o el componente `ScanClaim`.
4. `recordScan` (`app/s/[token]/actions.ts`) revalida sesión y QR, escribe `Scan` dentro de una
   transacción y confía en los `@@unique` para la idempotencia.
5. La acción llama a `collectionTag`, `leaderboardTag` y `globalLeaderboardTag` con `updateTag`,
   y la siguiente renderización refleja el badge recién obtenido.

## Cómo agregar una funcionalidad

- [ ] ¿La pantalla necesita datos? Agregar una función enfocada al módulo de datos más cercano;
  no poner `prisma` en `page.tsx` ni en `components/**`.
- [ ] ¿Hay una regla (permiso, validación, orden, cálculo)? Va en un módulo puro con su
  `*.test.ts`; la página y la acción solo la invocan.
- [ ] ¿Hay una mutación? Va en un Server Action: sesión → validación → reglas → datos →
  `revalidateTag` / `updateTag`.
- [ ] ¿El dato es público y compartido? Definir un tag de caché; si es por actor o del panel,
  no usar `unstable_cache`.
- [ ] ¿Cambió el schema? Actualizar `prisma/schema.prisma`, generar migración y regenerar
  [`docs/schema.sql`](./schema.sql).

Ver también [`docs/database.md`](./database.md) para el modelo de datos y sus invariantes.

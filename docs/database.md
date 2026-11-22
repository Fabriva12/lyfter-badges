# Modelo de datos

`prisma/schema.prisma` es la única fuente de verdad del modelo. Este documento resume las
relaciones y las invariantes; [`docs/schema.sql`](./schema.sql) es el SQL generado desde ese
mismo schema. Las 8 migraciones en `prisma/migrations/` son el historial autorizado.

## Correspondencia de conceptos

| Concepto en español | Modelo | Rol |
| --- | --- | --- |
| usuarios | `User` | Persona autenticada (asistente, `ADMIN` o `SUPER_ADMIN`); origen de XP, niveles y auditoría |
| empresas | `Company` + `CompanyMember` | `Company` agrupa eventos; `CompanyMember` es la pertenencia N:M con `User` |
| eventos | `Event` | Charlas/stands, horario, sede, estado y organizador |
| badges | `Badge` + `EventBadge` | `Badge` es el catálogo global; `EventBadge` habilita ese badge en un evento (sala, inicio y socio opcional) |
| badges canjeados | `Scan` | Prueba de colección por asistente y badge; `xpAwarded` alimenta nivel y ranking |

Modelos de soporte: `QrToken` (QR físico), `Registration` (check-in), `Prize` (premio por
evento), `Level` (umbrales de XP), `EventImage` (galería), `AuditLog` (trazabilidad) y
`Session` / `Account` / `Verification` (Better Auth).

## Diagrama de relaciones

```mermaid
erDiagram
    USER ||--o{ SESSION : "userId · CASCADE"
    USER ||--o{ ACCOUNT : "userId · CASCADE"
    USER ||--o{ EVENT : "organizerId · RESTRICT"
    USER ||--o{ COMPANY_MEMBER : "userId · CASCADE"
    USER |o--o{ EVENT_BADGE : "partnerId · SET NULL"
    USER ||--o{ REGISTRATION : "userId · CASCADE"
    USER ||--o{ SCAN : "userId · CASCADE"
    USER |o--o{ AUDIT_LOG : "actorId · SET NULL"

    COMPANY ||--o{ COMPANY_MEMBER : "companyId · CASCADE"
    COMPANY |o--o{ EVENT : "companyId · SET NULL"
    COMPANY |o--o{ AUDIT_LOG : "companyId · SET NULL"

    EVENT ||--o{ EVENT_IMAGE : "eventId · CASCADE"
    EVENT ||--o{ EVENT_BADGE : "eventId · CASCADE"
    EVENT ||--o{ QR_TOKEN : "eventId · CASCADE"
    EVENT ||--o{ REGISTRATION : "eventId · CASCADE"
    EVENT ||--o{ SCAN : "eventId · CASCADE"
    EVENT |o--o{ AUDIT_LOG : "eventId · SET NULL"
    EVENT ||--o| PRIZE : "eventId UNIQUE · CASCADE"

    BADGE ||--o{ EVENT_BADGE : "badgeId · RESTRICT"
    EVENT_BADGE |o--o{ QR_TOKEN : "eventBadgeId · CASCADE"
    EVENT_BADGE ||--o{ SCAN : "eventBadgeId · CASCADE"
    QR_TOKEN ||--o{ SCAN : "qrTokenId · CASCADE"

    USER {
        String id PK
        String name
        String email UK
        Role role
    }
    SESSION {
        String id PK
        String token UK
        String userId FK
        DateTime expiresAt
    }
    ACCOUNT {
        String id PK
        String providerId
        String userId FK
        String password
    }
    VERIFICATION {
        String id PK
        String identifier
        String value
        DateTime expiresAt
    }
    COMPANY {
        String id PK
        String name
        String slug UK
    }
    COMPANY_MEMBER {
        String id PK
        String companyId FK
        String userId FK
    }
    EVENT {
        String id PK
        String name
        String slug UK
        String organizerId FK
        String companyId FK
        EventMode mode
        EventStatus status
        DateTime startsAt
        DateTime endsAt
    }
    EVENT_IMAGE {
        String id PK
        String eventId FK
        String url
        Int sortOrder
    }
    BADGE {
        String id PK
        String name UK
        Int xpValue
        BadgeType type
        BadgeRarity rarity
    }
    EVENT_BADGE {
        String id PK
        String eventId FK
        String badgeId FK
        String partnerId FK
        String room
        DateTime startsAt
    }
    QR_TOKEN {
        String id PK
        String token UK
        QrKind kind
        String eventId FK
        String eventBadgeId FK
        Boolean active
        Int maxScans
    }
    REGISTRATION {
        String id PK
        String userId FK
        String eventId FK
        DateTime createdAt
    }
    SCAN {
        String id PK
        String userId FK
        String qrTokenId FK
        String eventBadgeId FK
        String eventId FK
        Int xpAwarded
        DateTime scannedAt
    }
    LEVEL {
        Int id PK
        Int level UK
        String name
        Int minXp UK
    }
    PRIZE {
        String id PK
        String eventId FK
        String name
        Int requiredBadgesCount
        DateTime revealedAt
    }
    AUDIT_LOG {
        String id PK
        String eventId FK
        String companyId FK
        String actorId FK
        String action
        String entityType
        Json metadata
    }
```

`VERIFICATION` y `LEVEL` no tienen foreign keys: la primera es un token de Better Auth y la
segunda es una tabla de umbrales consultada por XP. Las tablas de Better Auth se mapean a
nombres en minúscula (`user`, `session`, `account`, `verification`); el resto conserva el
nombre del modelo.

## Invariantes

| Invariante | Garantía |
| --- | --- |
| `EventBadge @@unique([eventId, badgeId])` | Un catálogo `Badge` solo puede estar habilitado una vez por evento |
| `Scan @@unique([userId, eventBadgeId])` | Un badge se cuenta una sola vez por asistente, aunque tenga varios QR |
| `Scan @@unique([userId, qrTokenId])` | Un mismo QR físico no otorga XP dos veces al mismo asistente |
| `Registration @@unique([userId, eventId])` | Un check-in por asistente y evento |
| `Prize.eventId @unique` | Relación 1:1 entre `Event` y su premio |
| `Event.organizerId` sin `onDelete` | `RESTRICT`: no se puede borrar al organizador mientras tenga eventos |
| `EventBadge.badgeId` sin `onDelete` | `RESTRICT`: no se puede borrar un badge de catálogo en uso |

El resto de las relaciones de dominio usan `CASCADE` (los hijos siguen al padre) o `SET NULL`
cuando el padre es opcional (`Event.companyId`, `EventBadge.partnerId` y los snapshots de
`AuditLog`). Estas reglas viven en la base de datos: los checks de aplicación compiten entre
sí y no bastan para evitar duplicados.

## Regenerar el SQL

```bash
pnpm exec prisma migrate diff --from-empty --to-schema=prisma/schema.prisma --script --output=docs/schema.sql
```

El comando se ejecuta desde la raíz del repo y carga la configuración desde `prisma7.config.ts`.
Si el schema cambia, volver a generar el archivo en vez de editarlo a mano.

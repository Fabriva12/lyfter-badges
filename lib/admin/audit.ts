// Event-scoped audit trail. Writes are best-effort on purpose: a logging
// failure must never roll back the organizer action that already succeeded.

import type { Prisma, Role } from "@/app/generated/prisma/client";
import { prisma } from "@/lib/db";

interface AuditActor {
  id: string;
  name: string;
  role?: string | null;
}

interface AuditEntry {
  eventId: string | null;
  eventName: string | null;
  companyId?: string | null;
  companyName?: string | null;
  actor: AuditActor;
  action: string;
  entityType: string;
  entityId?: string | null;
  summary: string;
  metadata?: Record<string, unknown> | null;
}

export async function logAudit(entry: AuditEntry): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        eventId: entry.eventId,
        eventName: entry.eventName,
        companyId: entry.companyId ?? null,
        companyName: entry.companyName ?? null,
        actorId: entry.actor.id,
        actorName: entry.actor.name,
        actorRole: (entry.actor.role as Role | null | undefined) ?? null,
        action: entry.action,
        entityType: entry.entityType,
        entityId: entry.entityId ?? null,
        summary: entry.summary,
        metadata: entry.metadata
          ? (entry.metadata as Prisma.InputJsonValue)
          : undefined,
      },
    });
  } catch (error) {
    console.error("Could not write the audit log entry.", error);
  }
}

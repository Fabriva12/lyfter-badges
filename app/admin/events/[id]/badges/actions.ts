"use server";

import { randomUUID } from "node:crypto";

import { revalidateTag, updateTag } from "next/cache";
import { redirect } from "next/navigation";

import { Prisma } from "@/app/generated/prisma/client";
import { prisma } from "@/lib/db";
import { logAudit } from "@/lib/admin/audit";
import {
  canRemoveEventBadge,
  isCatalogBadgeShared,
} from "@/lib/admin/badges";
import type { AdminFormState } from "@/lib/admin/forms";
import { requireEventForAdmin } from "@/lib/admin/guards";
import { reconcileAdminRole } from "@/lib/admin/roles";
import {
  parseBadgeRarity,
  parseBadgeType,
  parseMaxScans,
  parseOptionalText,
  parseXpValue,
} from "@/lib/admin/validation";
import { isBadgeIconKey } from "@/lib/badges/icons";
import { parseLocalDateTime } from "@/lib/date";
import {
  configTag,
  globalLeaderboardTag,
  leaderboardTag,
} from "@/lib/gamification/queries";

const UNEXPECTED_ERROR = "Ocurrió un error. Inténtalo de nuevo.";

function isUniqueViolation(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  );
}

function trimmed(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export async function addEventBadge(
  _prevState: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  const { event, session } = await requireEventForAdmin(
    String(formData.get("eventId") ?? ""),
  );

  const name = trimmed(formData.get("name"));

  if (name.length < 2 || name.length > 120) {
    return {
      status: "error",
      message: "El nombre de la insignia debe tener entre 2 y 120 caracteres.",
    };
  }

  const xp = parseXpValue(formData.get("xpValue"));

  if (!xp.ok) {
    return { status: "error", message: xp.error };
  }

  const description = parseOptionalText(
    formData.get("description"),
    1000,
    "La descripción",
  );

  if (!description.ok) {
    return { status: "error", message: description.error };
  }

  const type = parseBadgeType(formData.get("type"));

  if (!type.ok) {
    return { status: "error", message: type.error };
  }

  const rarity = parseBadgeRarity(formData.get("rarity"));

  if (!rarity.ok) {
    return { status: "error", message: rarity.error };
  }

  const rawIconKey = trimmed(formData.get("iconKey"));
  const iconKey = rawIconKey || null;

  if (iconKey && !isBadgeIconKey(iconKey)) {
    return { status: "error", message: "Elige un icono de la biblioteca." };
  }

  const room = parseOptionalText(formData.get("room"), 120, "La sala");

  if (!room.ok) {
    return { status: "error", message: room.error };
  }

  const rawStartsAt = trimmed(formData.get("startsAt"));
  const startsAt = rawStartsAt ? parseLocalDateTime(rawStartsAt) : null;

  if (rawStartsAt && !startsAt) {
    return { status: "error", message: "Ingresa una hora de inicio válida para la insignia." };
  }

  try {
    // The catalog is global: an existing name is reused as-is, so editing one
    // event can never rewrite the XP value of another event's badge.
    const badge = await prisma.badge.upsert({
      where: { name },
      update: {},
      create: {
        name,
        description: description.value,
        xpValue: xp.value,
        type: type.value,
        rarity: rarity.value,
        iconKey,
      },
      select: { id: true },
    });

    const eventBadge = await prisma.eventBadge.create({
      data: {
        eventId: event.id,
        badgeId: badge.id,
        room: room.value,
        startsAt,
      },
      select: { id: true },
    });

    await logAudit({
      eventId: event.id,
      eventName: event.name,
      companyId: event.companyId,
      companyName: event.company?.name ?? null,
      actor: session.user,
      action: "badge.added",
      entityType: "eventBadge",
      entityId: eventBadge.id,
      summary: `Agregaste la insignia “${name}” al evento.`,
      metadata: {
        type: type.value,
        rarity: rarity.value,
        xpValue: xp.value,
      },
    });
  } catch (error) {
    if (isUniqueViolation(error)) {
      return {
        status: "error",
        message: "Esa insignia ya forma parte de este evento.",
      };
    }

    console.error(error);
    return { status: "error", message: UNEXPECTED_ERROR };
  }

  // The badge count changes every attendee's collection total.
  revalidateTag(configTag(), "max");

  redirect(`/admin/events/${event.id}/badges?saved=badge`);
}

export async function assignStandPartner(
  _prevState: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  const { event, session } = await requireEventForAdmin(
    String(formData.get("eventId") ?? ""),
  );

  const eventBadgeId = String(formData.get("eventBadgeId") ?? "");
  const partnerId = trimmed(formData.get("partnerId"));

  const eventBadge = await prisma.eventBadge.findFirst({
    where: { id: eventBadgeId, eventId: event.id },
    select: { id: true, partnerId: true },
  });

  if (!eventBadge) {
    return { status: "error", message: "Esa insignia no pertenece a este evento." };
  }

  const previousPartnerId = eventBadge.partnerId;

  let partnerName: string | null = null;
  let promotedPartnerId: string | null = null;

  if (partnerId) {
    const partner = await prisma.user.findUnique({
      where: { id: partnerId },
      select: { id: true, name: true, role: true },
    });

    if (!partner) {
      return { status: "error", message: "Esa cuenta no existe." };
    }

    // A stand can be linked to any existing account. The access is scoped by
    // EventBadge.partnerId, but the account still needs the ADMIN role to open
    // the admin area, so an attendee is promoted when assigned. Keeping the
    // promotion inside the transaction rolls it back if the assignment fails.
    if (partner.role === "ATTENDEE") {
      promotedPartnerId = partner.id;
    }

    partnerName = partner.name;
  }

  try {
    await prisma.$transaction(async (tx) => {
      if (promotedPartnerId) {
        await tx.user.update({
          where: { id: promotedPartnerId },
          data: { role: "ADMIN" },
        });
      }

      await tx.eventBadge.update({
        where: { id: eventBadge.id },
        data: { partnerId: partnerId || null },
      });

      if (previousPartnerId && previousPartnerId !== (partnerId || null)) {
        await reconcileAdminRole(previousPartnerId, tx);
      }
    });

    await logAudit({
      eventId: event.id,
      eventName: event.name,
      companyId: event.companyId,
      companyName: event.company?.name ?? null,
      actor: session.user,
      action: partnerId ? "badge.partner_assigned" : "badge.partner_cleared",
      entityType: "eventBadge",
      entityId: eventBadge.id,
      summary: partnerId
        ? `Asignaste ${partnerName ?? "un socio"} a una insignia de stand.`
        : "Quitaste la asignación de socio de una insignia de stand.",
      metadata: { partnerId: partnerId || null },
    });
  } catch (error) {
    console.error(error);
    return { status: "error", message: UNEXPECTED_ERROR };
  }

  redirect(`/admin/events/${event.id}/badges?saved=partner`);
}

export async function createQrToken(
  _prevState: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  const { event, session } = await requireEventForAdmin(
    String(formData.get("eventId") ?? ""),
  );

  const kind = trimmed(formData.get("kind")) === "WELCOME" ? "WELCOME" : "BADGE";
  const maxScans = parseMaxScans(formData.get("maxScans"));

  if (!maxScans.ok) {
    return { status: "error", message: maxScans.error };
  }

  let eventBadgeId: string | null = null;

  if (kind === "BADGE") {
    const requestedId = String(formData.get("eventBadgeId") ?? "");
    const eventBadge = await prisma.eventBadge.findFirst({
      where: { id: requestedId, eventId: event.id },
      select: { id: true },
    });

    if (!eventBadge) {
      return {
        status: "error",
        message: "Elige una insignia que pertenezca a este evento.",
      };
    }

    eventBadgeId = eventBadge.id;
  }

  try {
    // UUIDv4: 122 random bits. The token is the secret printed on the wall, so
    // it must not be guessable or sequential.
    const qrToken = await prisma.qrToken.create({
      data: {
        token: randomUUID(),
        kind,
        eventId: event.id,
        eventBadgeId,
        maxScans: maxScans.value,
      },
      select: { id: true },
    });

    // The token secret is never logged.
    await logAudit({
      eventId: event.id,
      eventName: event.name,
      companyId: event.companyId,
      companyName: event.company?.name ?? null,
      actor: session.user,
      action: "qr_token.created",
      entityType: "qrToken",
      entityId: qrToken.id,
      summary: `Creaste un token QR de ${kind === "WELCOME" ? "bienvenida" : "insignia"}.`,
      metadata: { kind, maxScans: maxScans.value },
    });
  } catch (error) {
    console.error(error);
    return { status: "error", message: UNEXPECTED_ERROR };
  }

  redirect(`/admin/events/${event.id}/badges?saved=token`);
}

export async function setQrTokenActive(
  _prevState: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  const { event, session } = await requireEventForAdmin(
    String(formData.get("eventId") ?? ""),
  );

  const tokenId = String(formData.get("tokenId") ?? "");
  const active = trimmed(formData.get("active")) === "true";

  const token = await prisma.qrToken.findFirst({
    where: { id: tokenId, eventId: event.id },
    select: { id: true },
  });

  if (!token) {
    return { status: "error", message: "Ese token QR no pertenece a este evento." };
  }

  try {
    await prisma.qrToken.update({
      where: { id: token.id },
      data: { active },
    });

    await logAudit({
      eventId: event.id,
      eventName: event.name,
      companyId: event.companyId,
      companyName: event.company?.name ?? null,
      actor: session.user,
      action: "qr_token.updated",
      entityType: "qrToken",
      entityId: token.id,
      summary: active ? "Activaste un token QR." : "Pausaste un token QR.",
      metadata: { active },
    });
  } catch (error) {
    console.error(error);
    return { status: "error", message: UNEXPECTED_ERROR };
  }

  redirect(`/admin/events/${event.id}/badges?saved=token`);
}

export async function updateEventBadge(
  _prevState: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  const { event, session } = await requireEventForAdmin(
    String(formData.get("eventId") ?? ""),
  );

  const eventBadgeId = String(formData.get("eventBadgeId") ?? "");

  const eventBadge = await prisma.eventBadge.findFirst({
    where: { id: eventBadgeId, eventId: event.id },
    select: { id: true, badge: { select: { name: true } } },
  });

  if (!eventBadge) {
    return {
      status: "error",
      message: "Esa insignia no pertenece a este evento.",
    };
  }

  const room = parseOptionalText(formData.get("room"), 120, "La sala");

  if (!room.ok) {
    return { status: "error", message: room.error };
  }

  const rawStartsAt = trimmed(formData.get("startsAt"));
  const startsAt = rawStartsAt ? parseLocalDateTime(rawStartsAt) : null;

  if (rawStartsAt && !startsAt) {
    return { status: "error", message: "Ingresa una hora de inicio válida para la insignia." };
  }

  try {
    await prisma.eventBadge.update({
      where: { id: eventBadge.id },
      data: { room: room.value, startsAt },
    });

    await logAudit({
      eventId: event.id,
      eventName: event.name,
      companyId: event.companyId,
      companyName: event.company?.name ?? null,
      actor: session.user,
      action: "badge.updated",
      entityType: "eventBadge",
      entityId: eventBadge.id,
      summary: `Actualizaste los detalles del horario de “${eventBadge.badge.name}”.`,
      metadata: { room: room.value, startsAt: startsAt?.toISOString() ?? null },
    });
  } catch (error) {
    console.error(error);
    return { status: "error", message: UNEXPECTED_ERROR };
  }

  // The room and start time appear in every attendee's collection payload.
  revalidateTag(configTag(), "max");

  redirect(`/admin/events/${event.id}/badges?saved=badge-updated`);
}

export async function updateCatalogBadge(
  _prevState: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  const { event, session } = await requireEventForAdmin(
    String(formData.get("eventId") ?? ""),
  );

  const eventBadgeId = String(formData.get("eventBadgeId") ?? "");

  const eventBadge = await prisma.eventBadge.findFirst({
    where: { id: eventBadgeId, eventId: event.id },
    select: {
      id: true,
      badgeId: true,
      badge: {
        select: {
          name: true,
          _count: { select: { eventBadges: true } },
        },
      },
    },
  });

  if (!eventBadge) {
    return {
      status: "error",
      message: "Esa insignia no pertenece a este evento.",
    };
  }

  // The catalog is global: rewriting a shared entry would change the XP and
  // icon of every other event using the same name.
  if (isCatalogBadgeShared(eventBadge.badge._count.eventBadges)) {
    return {
      status: "error",
      message:
        "Esta insignia se usa en otros eventos. Crea una insignia nueva en lugar de editar la entrada del catálogo.",
    };
  }

  const name = trimmed(formData.get("name"));

  if (name.length < 2 || name.length > 120) {
    return {
      status: "error",
      message: "El nombre de la insignia debe tener entre 2 y 120 caracteres.",
    };
  }

  const xp = parseXpValue(formData.get("xpValue"));

  if (!xp.ok) {
    return { status: "error", message: xp.error };
  }

  const description = parseOptionalText(
    formData.get("description"),
    1000,
    "La descripción",
  );

  if (!description.ok) {
    return { status: "error", message: description.error };
  }

  const type = parseBadgeType(formData.get("type"));

  if (!type.ok) {
    return { status: "error", message: type.error };
  }

  const rarity = parseBadgeRarity(formData.get("rarity"));

  if (!rarity.ok) {
    return { status: "error", message: rarity.error };
  }

  const rawIconKey = trimmed(formData.get("iconKey"));
  const iconKey = rawIconKey || null;

  if (iconKey && !isBadgeIconKey(iconKey)) {
    return { status: "error", message: "Elige un icono de la biblioteca." };
  }

  try {
    const updated = await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM "Badge" WHERE id = ${eventBadge.badgeId} FOR UPDATE`;

      const badge = await tx.badge.findUnique({
        where: { id: eventBadge.badgeId },
        select: { _count: { select: { eventBadges: true } } },
      });

      if (!badge) {
        return { ok: false as const, reason: "missing" as const };
      }

      if (isCatalogBadgeShared(badge._count.eventBadges)) {
        return { ok: false as const, reason: "shared" as const };
      }

      await tx.badge.update({
        where: { id: eventBadge.badgeId },
        data: {
          name,
          description: description.value,
          xpValue: xp.value,
          type: type.value,
          rarity: rarity.value,
          iconKey,
        },
      });

      return { ok: true as const };
    });

    if (!updated.ok) {
      if (updated.reason === "shared") {
        return {
          status: "error",
          message:
            "Esta insignia se usa en otros eventos. Crea una insignia nueva en lugar de editar la entrada del catálogo.",
        };
      }

      return { status: "error", message: UNEXPECTED_ERROR };
    }

    await logAudit({
      eventId: event.id,
      eventName: event.name,
      companyId: event.companyId,
      companyName: event.company?.name ?? null,
      actor: session.user,
      action: "badge.catalog_updated",
      entityType: "badge",
      entityId: eventBadge.badgeId,
      summary: `Actualizaste la insignia “${eventBadge.badge.name}” (ahora “${name}”).`,
      metadata: {
        type: type.value,
        rarity: rarity.value,
        xpValue: xp.value,
      },
    });
  } catch (error) {
    if (isUniqueViolation(error)) {
      return {
        status: "error",
        message: "Otra insignia ya usa ese nombre.",
      };
    }

    console.error(error);
    return { status: "error", message: UNEXPECTED_ERROR };
  }

  // The attendee collection payload carries the badge name and XP.
  updateTag(leaderboardTag(event.id));
  updateTag(globalLeaderboardTag());
  revalidateTag(configTag(), "max");

  redirect(`/admin/events/${event.id}/badges?saved=badge-updated`);
}

export async function removeEventBadge(
  _prevState: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  const { event, session } = await requireEventForAdmin(
    String(formData.get("eventId") ?? ""),
  );

  const eventBadgeId = String(formData.get("eventBadgeId") ?? "");
  const confirmation = trimmed(formData.get("confirmation"));

  const eventBadge = await prisma.eventBadge.findFirst({
    where: { id: eventBadgeId, eventId: event.id },
    select: {
      id: true,
      partnerId: true,
      badge: { select: { name: true } },
      _count: { select: { scans: true } },
    },
  });

  if (!eventBadge) {
    return {
      status: "error",
      message: "Esa insignia no pertenece a este evento.",
    };
  }

  if (confirmation !== eventBadge.badge.name) {
    return {
      status: "error",
      message: "Escribe el nombre de la insignia exactamente para confirmar.",
    };
  }

  const [prize, eventBadgeCount] = await Promise.all([
    prisma.prize.findUnique({
      where: { eventId: event.id },
      select: { requiredBadgesCount: true },
    }),
    prisma.eventBadge.count({ where: { eventId: event.id } }),
  ]);

  if (prize && prize.requiredBadgesCount > eventBadgeCount - 1) {
    return {
      status: "error",
      message: `El premio requiere ${prize.requiredBadgesCount} insignias y quedarían ${eventBadgeCount - 1}. Ajustalo antes de eliminar.`,
    };
  }

  if (!canRemoveEventBadge(eventBadge._count.scans)) {
    return {
      status: "error",
      message: `Esta insignia ya tiene ${eventBadge._count.scans} escaneo(s). Eliminarla borraría el historial de asistencia.`,
    };
  }

  try {
    const removal = await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT id FROM "EventBadge" WHERE id = ${eventBadge.id} FOR UPDATE`;

      const [remaining, scanCount, currentPrize] = await Promise.all([
        tx.eventBadge.count({ where: { eventId: event.id } }),
        tx.scan.count({ where: { eventBadgeId: eventBadge.id } }),
        tx.prize.findUnique({
          where: { eventId: event.id },
          select: { requiredBadgesCount: true },
        }),
      ]);

      if (!canRemoveEventBadge(scanCount)) {
        return { ok: false as const, scanCount };
      }

      if (
        currentPrize &&
        currentPrize.requiredBadgesCount > remaining - 1
      ) {
        return {
          ok: false as const,
          requiredBadgesCount: currentPrize.requiredBadgesCount,
          remaining: remaining - 1,
        };
      }

      await tx.eventBadge.delete({ where: { id: eventBadge.id } });
      return { ok: true as const };
    });

    if (!removal.ok) {
      if ("scanCount" in removal) {
        return {
          status: "error",
          message: `Esta insignia ya tiene ${removal.scanCount} escaneo(s). Eliminarla borraría el historial de asistencia.`,
        };
      }

      return {
        status: "error",
        message: `El premio requiere ${removal.requiredBadgesCount} insignias y quedarían ${removal.remaining}. Ajustalo antes de eliminar.`,
      };
    }

    if (eventBadge.partnerId) {
      try {
        await reconcileAdminRole(eventBadge.partnerId);
      } catch (error) {
        console.error("Could not reconcile partner role after badge removal", error);
      }
    }

    await logAudit({
      eventId: event.id,
      eventName: event.name,
      companyId: event.companyId,
      companyName: event.company?.name ?? null,
      actor: session.user,
      action: "badge.removed",
      entityType: "eventBadge",
      entityId: eventBadge.id,
      summary: `Eliminaste la insignia “${eventBadge.badge.name}” del evento.`,
    });
  } catch (error) {
    console.error(error);
    return { status: "error", message: UNEXPECTED_ERROR };
  }

  // The badge count changes every attendee's collection total.
  revalidateTag(configTag(), "max");

  redirect(`/admin/events/${event.id}/badges?saved=badge-removed`);
}

"use server";

import { revalidateTag } from "next/cache";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/db";
import { logAudit } from "@/lib/admin/audit";
import type { AdminFormState } from "@/lib/admin/forms";
import { requireEventForAdmin } from "@/lib/admin/guards";
import {
  parseOptionalText,
  parseRequiredBadges,
} from "@/lib/admin/validation";
import { configTag } from "@/lib/gamification/queries";

const UNEXPECTED_ERROR = "Ocurrió un error. Inténtalo de nuevo.";

function trimmed(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function isHttpUrl(value: string) {
  try {
    const url = new URL(value);

    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export async function savePrize(
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
      message: "El nombre del premio debe tener entre 2 y 120 caracteres.",
    };
  }

  const description = parseOptionalText(
    formData.get("description"),
    1000,
    "La descripción",
  );

  if (!description.ok) {
    return { status: "error", message: description.error };
  }

  const imageUrl = parseOptionalText(formData.get("imageUrl"), 500, "La URL de la imagen");

  if (!imageUrl.ok) {
    return { status: "error", message: imageUrl.error };
  }

  if (imageUrl.value && !isHttpUrl(imageUrl.value)) {
    return {
      status: "error",
      message: "La URL de la imagen debe comenzar con http:// o https://.",
    };
  }

  const [eventBadgeCount, existingPrize] = await Promise.all([
    prisma.eventBadge.count({ where: { eventId: event.id } }),
    prisma.prize.findUnique({
      where: { eventId: event.id },
      select: { revealedAt: true },
    }),
  ]);

  const requiredBadges = parseRequiredBadges(
    formData.get("requiredBadgesCount"),
    eventBadgeCount,
  );

  if (!requiredBadges.ok) {
    return { status: "error", message: requiredBadges.error };
  }

  const announce = trimmed(formData.get("announce")) === "on";
  const revealedAt = announce
    ? (existingPrize?.revealedAt ?? new Date())
    : null;

  try {
    await prisma.prize.upsert({
      where: { eventId: event.id },
      update: {
        name,
        description: description.value,
        imageUrl: imageUrl.value,
        requiredBadgesCount: requiredBadges.value,
        revealedAt,
      },
      create: {
        eventId: event.id,
        name,
        description: description.value,
        imageUrl: imageUrl.value,
        requiredBadgesCount: requiredBadges.value,
        revealedAt,
      },
    });
  } catch (error) {
    console.error(error);
    return { status: "error", message: UNEXPECTED_ERROR };
  }

  await logAudit({
    eventId: event.id,
    eventName: event.name,
    companyId: event.companyId,
    companyName: event.company?.name ?? null,
    actor: session.user,
    action: "prize.saved",
    entityType: "prize",
    entityId: event.id,
    summary: announce
      ? `Guardaste y anunciaste el premio “${name}”.`
      : `Guardaste el premio “${name}” sin anunciarlo.`,
    metadata: {
      requiredBadgesCount: requiredBadges.value,
      announced: announce,
    },
  });

  // Every attendee's collection payload carries the prize reveal state.
  revalidateTag(configTag(), "max");

  redirect(`/admin/events/${event.id}/prize?saved=1`);
}

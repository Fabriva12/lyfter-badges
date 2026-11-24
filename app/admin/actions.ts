"use server";

import { revalidateTag, updateTag } from "next/cache";
import { redirect } from "next/navigation";

import { Prisma } from "@/app/generated/prisma/client";
import { prisma } from "@/lib/db";
import { logAudit } from "@/lib/admin/audit";
import type { AdminFormState } from "@/lib/admin/forms";
import { slugify, withSuffix } from "@/lib/admin/slug";
import { joinLocalDateTime, parseEventInput } from "@/lib/admin/validation";
import { configTag, eventsTag } from "@/lib/gamification/queries";
import { requireRole } from "@/lib/session";

const UNEXPECTED_ERROR = "Ocurrió un error. Inténtalo de nuevo.";

function isUniqueViolation(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  );
}

export async function createEvent(
  _prevState: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  // Server Actions bypass proxy.ts, so the role is validated here too.
  const session = await requireRole("ADMIN");
  const companyId = String(formData.get("companyId") ?? "");

  const membership = await prisma.companyMember.findUnique({
    where: {
      companyId_userId: { companyId, userId: session.user.id },
    },
    select: { companyId: true, company: { select: { name: true } } },
  });

  if (!membership) {
    return {
      status: "error",
      message: "Elige una empresa que administres.",
    };
  }

  const parsed = parseEventInput({
    name: formData.get("name"),
    description: formData.get("description"),
    location: formData.get("location"),
    country: formData.get("country"),
    mode: formData.get("mode"),
    status: formData.get("status"),
    startsAt: joinLocalDateTime(
      formData.get("startsAtDate"),
      formData.get("startsAtTime"),
    ),
    endsAt: joinLocalDateTime(
      formData.get("endsAtDate"),
      formData.get("endsAtTime"),
    ),
  });

  if (!parsed.ok) {
    return { status: "error", message: parsed.error };
  }

  const baseSlug = slugify(parsed.value.name);
  let eventId: string | null = null;

  try {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const slug = attempt === 0 ? baseSlug : withSuffix(baseSlug, attempt + 1);

      try {
        const event = await prisma.event.create({
          data: {
            ...parsed.value,
            slug,
            organizerId: session.user.id,
            companyId: membership.companyId,
          },
          select: { id: true },
        });

        eventId = event.id;
        break;
      } catch (error) {
        if (!isUniqueViolation(error)) {
          throw error;
        }
        // The slug is taken: try the next numeric suffix.
      }
    }
  } catch (error) {
    console.error(error);
    return { status: "error", message: UNEXPECTED_ERROR };
  }

  if (!eventId) {
    return {
      status: "error",
      message: "No se pudo generar una URL única para este evento. Prueba con otro nombre.",
    };
  }

  await logAudit({
    eventId,
    eventName: parsed.value.name,
    companyId: membership.companyId,
    companyName: membership.company.name,
    actor: session.user,
    action: "event.created",
    entityType: "event",
    entityId: eventId,
    summary: `Creaste el evento “${parsed.value.name}”.`,
    metadata: { mode: parsed.value.mode, status: parsed.value.status },
  });

  updateTag(eventsTag());
  revalidateTag(configTag(), "max");

  redirect(`/admin/events/${eventId}?saved=1`);
}

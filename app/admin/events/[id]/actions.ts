"use server";

import { revalidateTag, updateTag } from "next/cache";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/db";
import { logAudit } from "@/lib/admin/audit";
import type { AdminFormState } from "@/lib/admin/forms";
import { moveItem, moveToFront } from "@/lib/admin/gallery";
import { requireEventForAdmin } from "@/lib/admin/guards";
import { reconcileAdminRole } from "@/lib/admin/roles";
import {
  joinLocalDateTime,
  parseEventInput,
  parseOptionalText,
} from "@/lib/admin/validation";
import {
  configTag,
  eventsTag,
  globalLeaderboardTag,
  leaderboardTag,
} from "@/lib/gamification/queries";

const UNEXPECTED_ERROR = "Ocurrió un error. Inténtalo de nuevo.";

function isHttpUrl(value: string) {
  try {
    const url = new URL(value);

    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export async function updateEvent(
  _prevState: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  // The id comes from the form, so it is untrusted: the guard reloads the
  // event and checks that this organizer owns it.
  const { event, session } = await requireEventForAdmin(
    String(formData.get("eventId") ?? ""),
  );

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

  try {
    await prisma.event.update({
      where: { id: event.id },
      data: parsed.value,
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
    action: "event.updated",
    entityType: "event",
    entityId: event.id,
    summary: `Actualizaste los detalles del evento (ahora “${parsed.value.name}”).`,
    metadata: { mode: parsed.value.mode, status: parsed.value.status },
  });

  updateTag(eventsTag());
  // The event name and dates appear in every attendee's collection payload.
  revalidateTag(configTag(), "max");

  redirect(`/admin/events/${event.id}?saved=1`);
}

export async function addEventImage(
  _prevState: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  const { event, session } = await requireEventForAdmin(
    String(formData.get("eventId") ?? ""),
  );

  const url = parseOptionalText(formData.get("url"), 500, "La URL de la imagen");

  if (!url.ok) {
    return { status: "error", message: url.error };
  }

  if (!url.value || !isHttpUrl(url.value)) {
    return {
      status: "error",
      message: "La URL de la imagen debe comenzar con http:// o https://.",
    };
  }

  const alt = parseOptionalText(formData.get("alt"), 160, "El texto alternativo");

  if (!alt.ok) {
    return { status: "error", message: alt.error };
  }

  try {
    const last = await prisma.eventImage.aggregate({
      where: { eventId: event.id },
      _max: { sortOrder: true },
    });

    const image = await prisma.eventImage.create({
      data: {
        eventId: event.id,
        url: url.value,
        alt: alt.value,
        sortOrder: (last._max.sortOrder ?? -1) + 1,
      },
      select: { id: true },
    });

    await logAudit({
      eventId: event.id,
      eventName: event.name,
      companyId: event.companyId,
      companyName: event.company?.name ?? null,
      actor: session.user,
      action: "gallery.image_added",
      entityType: "eventImage",
      entityId: image.id,
      summary: "Agregaste una imagen a la galería del evento.",
      metadata: { url: url.value },
    });
  } catch (error) {
    console.error(error);
    return { status: "error", message: UNEXPECTED_ERROR };
  }

  redirect(`/admin/events/${event.id}?saved=image`);
}

export async function removeEventImage(formData: FormData): Promise<void> {
  const { event, session } = await requireEventForAdmin(
    String(formData.get("eventId") ?? ""),
  );

  const imageId = String(formData.get("imageId") ?? "");

  try {
    const result = await prisma.eventImage.deleteMany({
      where: { id: imageId, eventId: event.id },
    });

    if (result.count > 0) {
      await logAudit({
        eventId: event.id,
        eventName: event.name,
        companyId: event.companyId,
        companyName: event.company?.name ?? null,
        actor: session.user,
        action: "gallery.image_removed",
        entityType: "eventImage",
        entityId: imageId,
        summary: "Eliminaste una imagen de la galería del evento.",
      });
    }
  } catch (error) {
    console.error(error);
  }

  redirect(`/admin/events/${event.id}?saved=image`);
}

/** Rewrites the dense 0..n `sortOrder` in one transaction. */
async function writeGalleryOrder(
  ordered: Array<{ id: string }>,
): Promise<void> {
  if (ordered.length === 0) {
    return;
  }

  await prisma.$transaction(
    ordered.map((image, sortOrder) =>
      prisma.eventImage.update({
        where: { id: image.id },
        data: { sortOrder },
      }),
    ),
  );
}

async function readGalleryOrder(eventId: string) {
  return prisma.eventImage.findMany({
    where: { eventId },
    orderBy: { sortOrder: "asc" },
    select: { id: true, alt: true },
  });
}

export async function moveEventImage(formData: FormData): Promise<void> {
  const { event, session } = await requireEventForAdmin(
    String(formData.get("eventId") ?? ""),
  );

  const imageId = String(formData.get("imageId") ?? "");
  const direction = String(formData.get("direction") ?? "");
  const images = await readGalleryOrder(event.id);
  const index = images.findIndex((image) => image.id === imageId);

  if (index === -1) {
    redirect(`/admin/events/${event.id}?saved=image`);
  }

  const target = direction === "up" ? index - 1 : index + 1;
  const ordered = moveItem(images, index, target);

  if (ordered.every((image, position) => image.id === images[position].id)) {
    redirect(`/admin/events/${event.id}?saved=image`);
  }

  try {
    await writeGalleryOrder(ordered);

    await logAudit({
      eventId: event.id,
      eventName: event.name,
      companyId: event.companyId,
      companyName: event.company?.name ?? null,
      actor: session.user,
      action: "gallery.image_moved",
      entityType: "eventImage",
      entityId: imageId,
      summary: `Moviste “${images[index].alt ?? "una imagen"}” ${direction === "up" ? "hacia arriba" : "hacia abajo"} en la galería.`,
    });
  } catch (error) {
    console.error(error);
  }

  redirect(`/admin/events/${event.id}?saved=image`);
}

export async function setEventImageCover(formData: FormData): Promise<void> {
  const { event, session } = await requireEventForAdmin(
    String(formData.get("eventId") ?? ""),
  );

  const imageId = String(formData.get("imageId") ?? "");
  const images = await readGalleryOrder(event.id);
  const index = images.findIndex((image) => image.id === imageId);

  if (index <= 0) {
    redirect(`/admin/events/${event.id}?saved=image`);
  }

  try {
    await writeGalleryOrder(moveToFront(images, index));

    await logAudit({
      eventId: event.id,
      eventName: event.name,
      companyId: event.companyId,
      companyName: event.company?.name ?? null,
      actor: session.user,
      action: "gallery.cover_set",
      entityType: "eventImage",
      entityId: imageId,
      summary: `Estableciste “${images[index].alt ?? "una imagen"}” como portada de la galería.`,
    });
  } catch (error) {
    console.error(error);
  }

  redirect(`/admin/events/${event.id}?saved=image`);
}

export async function deleteEvent(
  _prevState: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  const { event, session } = await requireEventForAdmin(
    String(formData.get("eventId") ?? ""),
  );

  const confirmation = String(formData.get("confirmation") ?? "").trim();

  if (confirmation !== event.name) {
    return {
      status: "error",
      message: "Escribe el nombre del evento exactamente para confirmar.",
    };
  }

  const [scans, attendees, badges, partners] = await Promise.all([
    prisma.scan.count({ where: { eventId: event.id } }),
    prisma.registration.count({ where: { eventId: event.id } }),
    prisma.eventBadge.count({ where: { eventId: event.id } }),
    prisma.eventBadge.findMany({
      where: { eventId: event.id, partnerId: { not: null } },
      select: { partnerId: true },
    }),
  ]);

  try {
    await prisma.event.delete({ where: { id: event.id } });

    // The delete is irreversible, so a failed role reconciliation must not
    // make the caller believe the event is still there.
    for (const partner of partners) {
      if (partner.partnerId) {
        try {
          await reconcileAdminRole(partner.partnerId);
        } catch (error) {
          console.error("Could not reconcile partner role after event deletion", error);
        }
      }
    }

    // Logged after the delete: the event FK is already gone, so the row keeps
    // the snapshot and does not point at a missing event.
    await logAudit({
      eventId: null,
      eventName: event.name,
      companyId: event.companyId,
      companyName: event.company?.name ?? null,
      actor: session.user,
      action: "event.deleted",
      entityType: "event",
      entityId: event.id,
      summary: `Eliminaste el evento “${event.name}”.`,
      metadata: { attendees, scans, badges },
    });
  } catch (error) {
    console.error(error);
    return { status: "error", message: UNEXPECTED_ERROR };
  }

  updateTag(eventsTag());
  updateTag(leaderboardTag(event.id));
  updateTag(globalLeaderboardTag());
  revalidateTag(configTag(), "max");

  redirect("/admin?deleted=1");
}

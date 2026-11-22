// Server-side admin guards. Role checks are not enough: every page and every
// Server Action must also verify that the actor belongs to the company that
// owns the object, or that the stand is assigned to them. A foreign id answers
// 404 on purpose — it must not reveal that the row exists.

import { notFound } from "next/navigation";

import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { canAccessStand, canManageEvent, type AdminActor } from "./access";

function toActor(
  session: {
    user: { id: string; role: string | null | undefined };
  },
  companyIds: string[] = [],
): AdminActor {
  return {
    id: session.user.id,
    role: session.user.role as AdminActor["role"],
    companyIds,
  };
}

async function readCompanyIds(userId: string): Promise<string[]> {
  const memberships = await prisma.companyMember.findMany({
    where: { userId },
    select: { companyId: true },
  });

  return memberships.map((membership) => membership.companyId);
}

/** Company admins and super admins only. Attendees go back to the homepage. */
export async function requireAdmin() {
  return requireRole("ADMIN", "SUPER_ADMIN");
}

/** Only the global administrator can open `/super-admin`. */
export async function requireSuperAdmin() {
  return requireRole("SUPER_ADMIN");
}

export async function requireEventForAdmin(eventId: string) {
  const session = await requireAdmin();

  const [event, companyIds] = await Promise.all([
    prisma.event.findUnique({
      where: { id: eventId },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        location: true,
        country: true,
        mode: true,
        status: true,
        startsAt: true,
        endsAt: true,
        organizerId: true,
        companyId: true,
        company: { select: { name: true } },
        images: {
          orderBy: { sortOrder: "asc" },
          select: { id: true, url: true, alt: true, sortOrder: true },
        },
      },
    }),
    readCompanyIds(session.user.id),
  ]);

  if (!event || !canManageEvent(toActor(session, companyIds), event)) {
    notFound();
  }

  return { session, event };
}

export async function requireStandForAdmin(eventBadgeId: string) {
  const session = await requireAdmin();

  const stand = await prisma.eventBadge.findUnique({
    where: { id: eventBadgeId },
    select: { id: true, eventId: true, partnerId: true },
  });

  if (!stand || !canAccessStand(toActor(session), stand)) {
    notFound();
  }

  return { session, stand };
}

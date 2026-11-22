// Pure admin authorization rules. No Prisma import: the guards in
// `lib/admin/guards.ts` load the row and delegate the decision here, so the
// rules stay testable without a database.

export type AdminRole = "ATTENDEE" | "ADMIN" | "SUPER_ADMIN";

export interface AdminActor {
  id: string;
  role: AdminRole | null | undefined;
  /** Companies this actor administers through `CompanyMember`. */
  companyIds: string[];
}

export interface EventOwnership {
  organizerId: string;
  companyId: string | null;
}

export interface StandOwnership {
  partnerId: string | null;
}

/** Admins and super admins can open the admin area. */
export function canOpenAdmin(actor: AdminActor): boolean {
  return actor.role === "ADMIN" || actor.role === "SUPER_ADMIN";
}

/**
 * Object-level check for an event. A super admin manages every event. A company
 * admin manages the events of every company they belong to. The organizerId
 * fallback keeps legacy events manageable before the company backfill.
 */
export function canManageEvent(
  actor: AdminActor,
  event: EventOwnership,
): boolean {
  if (actor.role === "SUPER_ADMIN") {
    return true;
  }

  if (actor.role !== "ADMIN") {
    return false;
  }

  if (event.companyId !== null) {
    return actor.companyIds.includes(event.companyId);
  }

  return actor.id === event.organizerId;
}

/**
 * Object-level check for a stand. A stand partner sees only the stand assigned
 * to their account. A super admin can inspect any stand.
 */
export function canAccessStand(
  actor: AdminActor,
  stand: StandOwnership,
): boolean {
  if (actor.role === "SUPER_ADMIN") {
    return true;
  }

  return (
    actor.role === "ADMIN" &&
    stand.partnerId !== null &&
    actor.id === stand.partnerId
  );
}

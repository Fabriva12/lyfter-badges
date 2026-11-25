import {
  evaluateEventWindow,
  type EventWindowReason,
  type EventWindowStatus,
} from "./event-window";

export type ScanTarget =
  | { status: "welcome"; token: string; eventName: string }
  | { status: "ready"; token: string; eventName: string }
  | { status: "needs_check_in"; token: string; eventName: string }
  | { status: "invalid" }
  | { status: "not_started" }
  | { status: "expired" }
  | { status: EventWindowReason };

export interface ScanQr {
  token: string;
  kind: "WELCOME" | "BADGE";
  active: boolean;
  startsAt: Date | null;
  expiresAt: Date | null;
  badgeStartsAt: Date | null;
  hasBadge: boolean;
  eventName: string;
  eventStatus: EventWindowStatus;
  eventStartsAt: Date;
  eventEndsAt: Date;
}

/** The QR shape returned by both the claim page and the scanner queries. */
export interface ScanQrSource {
  token: string;
  kind: "WELCOME" | "BADGE";
  active: boolean;
  startsAt: Date | null;
  expiresAt: Date | null;
  eventBadge: { startsAt: Date | null; badge: { id: string } | null } | null;
  event: {
    name: string;
    status: EventWindowStatus;
    startsAt: Date;
    endsAt: Date;
  };
}

/** Builds the pure scan projection once instead of duplicating it per caller. */
export function toScanQr(qr: ScanQrSource): ScanQr {
  return {
    token: qr.token,
    kind: qr.kind,
    active: qr.active,
    startsAt: qr.startsAt,
    expiresAt: qr.expiresAt,
    badgeStartsAt: qr.eventBadge?.startsAt ?? null,
    hasBadge: qr.eventBadge?.badge != null,
    eventName: qr.event.name,
    eventStatus: qr.event.status,
    eventStartsAt: qr.event.startsAt,
    eventEndsAt: qr.event.endsAt,
  };
}

export function resolveScanTarget(
  qr: ScanQr | null,
  isRegistered: boolean,
  now = new Date(),
  hasExistingClaim = false,
): ScanTarget {
  if (!qr || !qr.active) {
    return { status: "invalid" };
  }

  if (qr.kind === "WELCOME") {
    // A repeat check-in stays idempotent even after the event closes.
    if (hasExistingClaim) {
      return { status: "welcome", token: qr.token, eventName: qr.eventName };
    }

    const eventWindow = evaluateEventWindow(
      {
        status: qr.eventStatus,
        startsAt: qr.eventStartsAt,
        endsAt: qr.eventEndsAt,
      },
      now,
    );

    if (!eventWindow.ok) {
      return { status: eventWindow.reason };
    }

    return { status: "welcome", token: qr.token, eventName: qr.eventName };
  }

  if (!qr.hasBadge) {
    return { status: "invalid" };
  }

  // An already collected badge keeps resolving to the claim UI: the action
  // returns the stored result instead of writing a new scan.
  if (hasExistingClaim) {
    return { status: "ready", token: qr.token, eventName: qr.eventName };
  }

  const eventWindow = evaluateEventWindow(
    {
      status: qr.eventStatus,
      startsAt: qr.eventStartsAt,
      endsAt: qr.eventEndsAt,
    },
    now,
  );

  if (!eventWindow.ok) {
    return { status: eventWindow.reason };
  }

  if (qr.startsAt && now < qr.startsAt) {
    return { status: "not_started" };
  }

  if (qr.badgeStartsAt && now < qr.badgeStartsAt) {
    return { status: "not_started" };
  }

  if (qr.expiresAt && now > qr.expiresAt) {
    return { status: "expired" };
  }

  if (!isRegistered) {
    return {
      status: "needs_check_in",
      token: qr.token,
      eventName: qr.eventName,
    };
  }

  return { status: "ready", token: qr.token, eventName: qr.eventName };
}

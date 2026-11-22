export type ScanTarget =
  | { status: "welcome"; token: string; eventName: string }
  | { status: "ready"; token: string; eventName: string }
  | { status: "needs_check_in"; token: string; eventName: string }
  | { status: "invalid" }
  | { status: "not_started" }
  | { status: "expired" };

export interface ScanQr {
  token: string;
  kind: "WELCOME" | "BADGE";
  active: boolean;
  startsAt: Date | null;
  expiresAt: Date | null;
  badgeStartsAt: Date | null;
  hasBadge: boolean;
  eventName: string;
}

export function resolveScanTarget(
  qr: ScanQr | null,
  isRegistered: boolean,
  now = new Date(),
): ScanTarget {
  if (!qr || !qr.active) {
    return { status: "invalid" };
  }

  if (qr.kind === "WELCOME") {
    return { status: "welcome", token: qr.token, eventName: qr.eventName };
  }

  if (!qr.hasBadge) {
    return { status: "invalid" };
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

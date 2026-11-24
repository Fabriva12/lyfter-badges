export type EventWindowStatus = "DRAFT" | "ACTIVE" | "FINISHED";

export interface EventWindow {
  status: EventWindowStatus;
  startsAt: Date;
  endsAt: Date;
}

export type EventWindowReason =
  | "event_not_started"
  | "event_ended"
  | "event_not_active";

export type EventWindowResult =
  | { ok: true }
  | { ok: false; reason: EventWindowReason };

/**
 * Shared copy for the event window gate. The claim action and the scan preview
 * use the same messages so a blocked QR reads the same in both places.
 */
export const EVENT_WINDOW_MESSAGES: Record<EventWindowReason, string> = {
  event_not_started: "This event has not started yet.",
  event_ended: "This event has ended.",
  event_not_active: "This event is not open for check-ins or badge claims.",
};

/**
 * A scan is only allowed while the event is ACTIVE and the current time is
 * inside its schedule. Both boundaries are inclusive, matching the QR window
 * checks in `resolveScanTarget`.
 */
export function evaluateEventWindow(
  event: EventWindow,
  now: Date = new Date(),
): EventWindowResult {
  if (event.status !== "ACTIVE") {
    return { ok: false, reason: "event_not_active" };
  }

  if (now < event.startsAt) {
    return { ok: false, reason: "event_not_started" };
  }

  if (now > event.endsAt) {
    return { ok: false, reason: "event_ended" };
  }

  return { ok: true };
}

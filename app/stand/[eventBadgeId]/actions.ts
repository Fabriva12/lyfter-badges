"use server";

import { requireStandForAdmin } from "@/lib/admin/guards";
import { getOrRotateStandQr, type StandQrPayload } from "@/lib/stand/kiosk";

/**
 * Server Actions bypass the optimistic proxy, so the stand guard is the only
 * authorization check. Rotations are intentionally not written to the audit
 * log: a 60 s poll would flood it. Scans are recorded in the Scan table with
 * user, token, badge, event and XP.
 */
export async function rotateStandQr(
  eventBadgeId: string,
  force = false,
): Promise<StandQrPayload> {
  const { stand } = await requireStandForAdmin(eventBadgeId);

  return getOrRotateStandQr(eventBadgeId, stand.eventId, undefined, force);
}

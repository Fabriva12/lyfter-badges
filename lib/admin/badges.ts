// Pure guards for the badge catalog. `Badge` rows are global: every event that
// uses the same name shares one catalog entry. These predicates live here so
// the Server Actions and the UI cannot disagree about what is safe.

/** A catalog entry used by more than one event must not be edited. */
export function isCatalogBadgeShared(usageCount: number): boolean {
  return usageCount > 1;
}

/**
 * An event badge can only be detached while nobody collected it. Deleting the
 * EventBadge cascades to its scans, so this protects attendance history.
 */
export function canRemoveEventBadge(scanCount: number): boolean {
  return scanCount === 0;
}

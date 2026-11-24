// Pure slug helpers. No Prisma import: the uniqueness check lives in the
// action, this module only turns a name into a URL-safe base.

const MAX_SLUG_LENGTH = 60;

/**
 * Turn an event name into a URL-safe slug.
 *
 * Accents are decomposed and stripped, so "Reunión de Otoño" becomes
 * "reunion-de-otono". The result never starts or ends with a dash and is capped
 * at 60 characters; an empty result falls back to "event".
 */
export function slugify(value: string): string {
  const slug = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  if (!slug) {
    return "event";
  }

  if (slug.length <= MAX_SLUG_LENGTH) {
    return slug;
  }

  return slug.slice(0, MAX_SLUG_LENGTH).replace(/-+$/g, "");
}

/** Appends a numeric suffix without growing past the slug cap. */
export function withSuffix(slug: string, suffix: number): string {
  const tail = `-${suffix}`;
  const room = MAX_SLUG_LENGTH - tail.length;

  return `${slug.slice(0, room).replace(/-+$/g, "")}${tail}`;
}

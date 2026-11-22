import { parseLocalDateTime } from "../date";

export type ParseResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: string };

export const EVENT_MODES = ["IN_PERSON", "VIRTUAL", "HYBRID"] as const;
export type EventModeValue = (typeof EVENT_MODES)[number];

export const EVENT_STATUSES = ["DRAFT", "ACTIVE", "FINISHED"] as const;
export type EventStatusValue = (typeof EVENT_STATUSES)[number];

export const BADGE_TYPES = ["WELCOME", "TALK", "STAND", "SPECIAL"] as const;
export type BadgeTypeValue = (typeof BADGE_TYPES)[number];

export const BADGE_RARITIES = ["COMMON", "RARE", "LIMITED"] as const;
export type BadgeRarityValue = (typeof BADGE_RARITIES)[number];

export const USER_ROLES = ["ATTENDEE", "ADMIN", "SUPER_ADMIN"] as const;
export type UserRoleValue = (typeof USER_ROLES)[number];

export interface EventInput {
  name: string;
  description: string | null;
  location: string | null;
  country: string | null;
  mode: EventModeValue;
  status: EventStatusValue;
  startsAt: Date;
  endsAt: Date;
}

const MAX_NAME = 120;
const MAX_DESCRIPTION = 1000;
const MAX_LOCATION = 120;
const MAX_COUNTRY = 80;

function trimmed(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function parseMode(value: unknown): ParseResult<EventModeValue> {
  const raw = trimmed(value) || "IN_PERSON";

  if (!EVENT_MODES.includes(raw as EventModeValue)) {
    return { ok: false, error: "Selecciona un modo de evento válido." };
  }

  return { ok: true, value: raw as EventModeValue };
}

function parseStatus(value: unknown): ParseResult<EventStatusValue> {
  const raw = trimmed(value) || "DRAFT";

  if (!EVENT_STATUSES.includes(raw as EventStatusValue)) {
    return { ok: false, error: "Selecciona un estado de evento válido." };
  }

  return { ok: true, value: raw as EventStatusValue };
}

export function parseBadgeType(value: unknown): ParseResult<BadgeTypeValue> {
  const raw = trimmed(value) || "TALK";

  if (!BADGE_TYPES.includes(raw as BadgeTypeValue)) {
    return { ok: false, error: "Selecciona un tipo de insignia válido." };
  }

  return { ok: true, value: raw as BadgeTypeValue };
}

export function parseBadgeRarity(
  value: unknown,
): ParseResult<BadgeRarityValue> {
  const raw = trimmed(value) || "COMMON";

  if (!BADGE_RARITIES.includes(raw as BadgeRarityValue)) {
    return { ok: false, error: "Selecciona una rareza de insignia válida." };
  }

  return { ok: true, value: raw as BadgeRarityValue };
}

export function parseUserRole(value: unknown): ParseResult<UserRoleValue> {
  const raw = trimmed(value);

  if (!USER_ROLES.includes(raw as UserRoleValue)) {
    return { ok: false, error: "Selecciona un rol válido." };
  }

  return { ok: true, value: raw as UserRoleValue };
}

export function joinLocalDateTime(date: unknown, time: unknown): string {
  const datePart = trimmed(date);
  const timePart = trimmed(time);

  return datePart && timePart ? `${datePart}T${timePart}` : "";
}

export function parseEventInput(raw: {
  name?: unknown;
  description?: unknown;
  location?: unknown;
  country?: unknown;
  mode?: unknown;
  status?: unknown;
  startsAt?: unknown;
  endsAt?: unknown;
}): ParseResult<EventInput> {
  const name = trimmed(raw.name);

  if (name.length < 2) {
    return { ok: false, error: "Ingresa un nombre de evento de al menos 2 caracteres." };
  }

  if (name.length > MAX_NAME) {
    return {
      ok: false,
      error: `El nombre del evento debe tener como máximo ${MAX_NAME} caracteres.`,
    };
  }

  const description = trimmed(raw.description);
  const location = trimmed(raw.location);
  const country = trimmed(raw.country);

  if (description.length > MAX_DESCRIPTION) {
    return {
      ok: false,
      error: `La descripción debe tener como máximo ${MAX_DESCRIPTION} caracteres.`,
    };
  }

  if (location.length > MAX_LOCATION) {
    return {
      ok: false,
      error: `La ubicación debe tener como máximo ${MAX_LOCATION} caracteres.`,
    };
  }

  if (country.length > MAX_COUNTRY) {
    return {
      ok: false,
      error: `El país debe tener como máximo ${MAX_COUNTRY} caracteres.`,
    };
  }

  const mode = parseMode(raw.mode);

  if (!mode.ok) {
    return mode;
  }

  const status = parseStatus(raw.status);

  if (!status.ok) {
    return status;
  }

  const startsAt = parseLocalDateTime(raw.startsAt);
  const endsAt = parseLocalDateTime(raw.endsAt);

  if (!startsAt) {
    return { ok: false, error: "Ingresa una fecha y hora de inicio válidas." };
  }

  if (!endsAt) {
    return { ok: false, error: "Ingresa una fecha y hora de fin válidas." };
  }

  if (endsAt.getTime() <= startsAt.getTime()) {
    return { ok: false, error: "El evento debe terminar después de comenzar." };
  }

  return {
    ok: true,
    value: {
      name,
      description: description || null,
      location: location || null,
      country: country || null,
      mode: mode.value,
      status: status.value,
      startsAt,
      endsAt,
    },
  };
}

export function parseXpValue(value: unknown): ParseResult<number> {
  const raw = trimmed(value);
  const xp = Number(raw);

  if (!raw || !Number.isInteger(xp) || xp < 1 || xp > 10000) {
    return {
      ok: false,
      error: "XP debe ser un número entero entre 1 y 10000.",
    };
  }

  return { ok: true, value: xp };
}

/** Empty means unlimited scans, which is stored as `null`. */
export function parseMaxScans(value: unknown): ParseResult<number | null> {
  const raw = trimmed(value);

  if (!raw) {
    return { ok: true, value: null };
  }

  const max = Number(raw);

  if (!Number.isInteger(max) || max < 1 || max > 100000) {
    return {
      ok: false,
      error: "El límite de escaneos debe ser un número entero entre 1 y 100000.",
    };
  }

  return { ok: true, value: max };
}

/**
 * The prize requirement must fit the event: requiring more badges than the
 * event offers makes the prize impossible to earn.
 */
export function parseRequiredBadges(
  value: unknown,
  eventBadgeCount: number,
): ParseResult<number> {
  if (eventBadgeCount < 1) {
    return {
      ok: false,
      error: "Agrega al menos una insignia al evento antes de crear un premio.",
    };
  }

  const raw = trimmed(value);
  const required = Number(raw);

  if (!Number.isInteger(required) || required < 1) {
    return { ok: false, error: "El premio debe requerir al menos una insignia." };
  }

  if (required > eventBadgeCount) {
    return {
      ok: false,
      error: `Este evento solo tiene ${eventBadgeCount} ${eventBadgeCount === 1 ? "insignia" : "insignias"}.`,
    };
  }

  return { ok: true, value: required };
}

/** Generic optional text field with a length cap. */
export function parseOptionalText(
  value: unknown,
  max: number,
  label: string,
): ParseResult<string | null> {
  const raw = trimmed(value);

  if (raw.length > max) {
    return {
      ok: false,
      error: `${label} debe tener como máximo ${max} caracteres.`,
    };
  }

  return { ok: true, value: raw || null };
}

/** Normalizes an email typed by the organizer when assigning a partner. */
export function parseEmail(value: unknown): ParseResult<string> {
  const email = trimmed(value).toLowerCase();

  if (
    !email ||
    email.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  ) {
    return { ok: false, error: "Ingresa un correo electrónico válido." };
  }

  return { ok: true, value: email };
}

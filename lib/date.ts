export const EVENT_LOCALE = "es-CR";
export const EVENT_TIME_ZONE = "America/Costa_Rica";

const DATE_OPTIONS: Intl.DateTimeFormatOptions = {
  timeZone: EVENT_TIME_ZONE,
  year: "numeric",
  month: "short",
  day: "numeric",
};

const DATE_TIME_OPTIONS: Intl.DateTimeFormatOptions = {
  ...DATE_OPTIONS,
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
};

const INPUT_OPTIONS: Intl.DateTimeFormatOptions = {
  timeZone: EVENT_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
};

const INPUT_PATTERN = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/;

interface ZonedParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
}

function zonedParts(date: Date): ZonedParts {
  const values: Record<string, number> = {};

  for (const part of new Intl.DateTimeFormat("en-CA", INPUT_OPTIONS).formatToParts(date)) {
    if (part.type !== "literal") {
      values[part.type] = Number(part.value);
    }
  }

  return {
    year: values.year,
    month: values.month,
    day: values.day,
    hour: values.hour,
    minute: values.minute,
    second: values.second,
  };
}

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

export function hourInEventZone(date: Date): number {
  return zonedParts(date).hour;
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat(EVENT_LOCALE, DATE_OPTIONS).format(date);
}

export function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat(EVENT_LOCALE, DATE_TIME_OPTIONS).format(date);
}

export function formatEventRange(startsAt: Date, endsAt: Date): string {
  return `${formatDateTime(startsAt)} – ${formatDateTime(endsAt)}`;
}

export function parseLocalDateTime(value: unknown): Date | null {
  if (typeof value !== "string") {
    return null;
  }

  const match = INPUT_PATTERN.exec(value.trim());

  if (!match) {
    return null;
  }

  const desired = {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
    hour: Number(match[4]),
    minute: Number(match[5]),
    second: Number(match[6] ?? "00"),
  };

  const guessedUtc = Date.UTC(
    desired.year,
    desired.month - 1,
    desired.day,
    desired.hour,
    desired.minute,
    desired.second,
  );
  const parts = zonedParts(new Date(guessedUtc));
  const partsAsUtc = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second,
  );
  const result = new Date(guessedUtc - (partsAsUtc - guessedUtc));
  const actual = zonedParts(result);

  const matches =
    actual.year === desired.year &&
    actual.month === desired.month &&
    actual.day === desired.day &&
    actual.hour === desired.hour &&
    actual.minute === desired.minute &&
    actual.second === desired.second;

  return matches ? result : null;
}

export function toLocalInputValue(date: Date): string {
  const { year, month, day, hour, minute } = zonedParts(date);

  return `${year}-${pad(month)}-${pad(day)}T${pad(hour)}:${pad(minute)}`;
}

export function toLocalDateValue(date: Date): string {
  return toLocalInputValue(date).slice(0, 10);
}

export function toLocalTimeValue(date: Date): string {
  return toLocalInputValue(date).slice(11);
}

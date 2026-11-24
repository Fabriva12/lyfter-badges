import { createHmac, timingSafeEqual } from "node:crypto";

export interface ShareTokenPayload {
  userId: string;
  eventId: string;
}

const VERSION = 1;
const MAX_TOKEN_LENGTH = 512;

function getSecret(): string {
  const secret = process.env.BETTER_AUTH_SECRET;

  if (!secret) {
    throw new Error("BETTER_AUTH_SECRET is not set");
  }

  return secret;
}

function sign(payload: string, secret: string): string {
  return createHmac("sha256", secret)
    .update(`share:v${VERSION}:${payload}`)
    .digest("base64url");
}

export function createShareToken(
  input: ShareTokenPayload,
  secret = getSecret(),
): string {
  const payload = Buffer.from(
    JSON.stringify({ u: input.userId, e: input.eventId }),
  ).toString("base64url");

  return `${VERSION}.${payload}.${sign(payload, secret)}`;
}

export function parseShareToken(
  token: string,
  secret = getSecret(),
): ShareTokenPayload | null {
  if (!token || token.length === 0 || token.length > MAX_TOKEN_LENGTH) {
    return null;
  }

  const parts = token.split(".");
  if (parts.length !== 3) {
    return null;
  }

  const [version, payload, signature] = parts;
  if (version !== String(VERSION)) {
    return null;
  }

  const expected = sign(payload, secret);
  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);

  if (
    signatureBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(signatureBuffer, expectedBuffer)
  ) {
    return null;
  }

  try {
    const decoded = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8"),
    ) as unknown;

    if (!decoded || typeof decoded !== "object") {
      return null;
    }

    const { u, e } = decoded as { u?: unknown; e?: unknown };
    if (
      typeof u !== "string" ||
      typeof e !== "string" ||
      u.length === 0 ||
      e.length === 0 ||
      u.length > 128 ||
      e.length > 128
    ) {
      return null;
    }

    return { userId: u, eventId: e };
  } catch {
    return null;
  }
}

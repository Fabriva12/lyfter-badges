const TOKEN_PATTERN = /^[A-Za-z0-9_-]{8,200}$/;
const MAX_PAYLOAD_LENGTH = 2048;

function tokenFromPath(pathname: string): string | null {
  const match = pathname.match(/^\/s\/([^/]+)\/?$/);

  if (!match) {
    return null;
  }

  try {
    return decodeURIComponent(match[1]);
  } catch {
    return null;
  }
}

export function parseScanPayload(value: string): { token: string } | null {
  const trimmed = value.trim();

  if (trimmed.length === 0 || trimmed.length > MAX_PAYLOAD_LENGTH) {
    return null;
  }

  let token = trimmed;

  if (/^https?:\/\//i.test(trimmed)) {
    try {
      const url = new URL(trimmed);
      token = tokenFromPath(url.pathname) ?? "";
    } catch {
      return null;
    }
  } else if (trimmed.startsWith("/")) {
    token = tokenFromPath(trimmed.split(/[?#]/, 1)[0]) ?? "";
  }

  return TOKEN_PATTERN.test(token) ? { token } : null;
}

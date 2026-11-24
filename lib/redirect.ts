const LOCAL_ORIGIN = "http://localhost";

export function sanitizeNextPath(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  if (!value.startsWith("/") || value.startsWith("//")) {
    return null;
  }

  if (value.includes("\\")) {
    return null;
  }

  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index);

    if (code <= 0x1f || (code >= 0x7f && code <= 0x9f)) {
      return null;
    }
  }

  let url: URL;

  try {
    url = new URL(value, LOCAL_ORIGIN);
  } catch {
    return null;
  }

  if (url.origin !== LOCAL_ORIGIN) {
    return null;
  }

  return `${url.pathname}${url.search}${url.hash}`;
}

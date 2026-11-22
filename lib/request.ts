import { headers } from "next/headers";

export async function getRequestOrigin(): Promise<string> {
  const headerList = await headers();

  const forwardedHost = headerList.get("x-forwarded-host");
  const host = headerList.get("host");
  const resolvedHost = forwardedHost || host;

  if (!resolvedHost) {
    return "http://localhost:3000";
  }

  const forwardedProto = headerList.get("x-forwarded-proto");
  if (forwardedProto) {
    return `${forwardedProto}://${resolvedHost}`;
  }

  if (resolvedHost.includes("localhost") || resolvedHost.includes("127.0.0.1")) {
    return `http://${resolvedHost}`;
  }

  return `https://${resolvedHost}`;
}

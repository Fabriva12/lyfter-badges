import { getSessionCookie } from "better-auth/cookies";
import { NextResponse, type NextRequest } from "next/server";

// Optimistic, cookie-only guard. It is NOT a security boundary: a crafted
// cookie must never grant access. Every page, route handler and Server Action
// validates the real session on the server.
const PROTECTED_PREFIXES = [
  "/s",
  "/scan",
  "/collection",
  "/leaderboard",
  "/admin",
  "/super-admin",
];

function isProtected(pathname: string) {
  return PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (!isProtected(pathname)) {
    return NextResponse.next();
  }

  if (getSessionCookie(request)) {
    return NextResponse.next();
  }

  // `next` must survive the login round trip, otherwise the attendee has to
  // walk back and scan the physical QR again.
  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("next", `${pathname}${search}`);

  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};

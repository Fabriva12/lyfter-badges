import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";

import { auth } from "@/lib/auth";

export type SessionRole = "ATTENDEE" | "ADMIN" | "SUPER_ADMIN";

// Memoized per request: the admin layout and the page guards both need the
// session, and they must not pay for two identical database reads.
export const getSession = cache(async () => {
  return auth.api.getSession({
    headers: await headers(),
  });
});

export async function requireSession() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  return session;
}

export async function requireRole(...roles: SessionRole[]) {
  const session = await requireSession();
  const role = session.user.role;

  if (!role || !roles.includes(role)) {
    redirect("/");
  }

  return session;
}

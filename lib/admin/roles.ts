import { PrismaClient } from "@/app/generated/prisma/client";
import { prisma } from "@/lib/db";

type RoleClient = Pick<PrismaClient, "companyMember" | "eventBadge" | "user">;

/**
 * Admin access is capability-based: a user is an ADMIN when they administer at
 * least one company or one stand. When the last capability is removed, the
 * account goes back to ATTENDEE. SUPER_ADMIN is never downgraded here.
 */
export async function reconcileAdminRole(
  userId: string,
  client: RoleClient = prisma,
): Promise<void> {
  const user = await client.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  if (!user || user.role !== "ADMIN") {
    return;
  }

  const [memberships, stands] = await Promise.all([
    client.companyMember.count({ where: { userId } }),
    client.eventBadge.count({ where: { partnerId: userId } }),
  ]);

  if (memberships === 0 && stands === 0) {
    await client.user.update({
      where: { id: userId },
      data: { role: "ATTENDEE" },
    });
  }
}

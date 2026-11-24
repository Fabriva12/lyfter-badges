"use server";

import { revalidatePath } from "next/cache";

import { Prisma, type Role } from "@/app/generated/prisma/client";
import { logAudit } from "@/lib/admin/audit";
import type { AdminFormState } from "@/lib/admin/forms";
import { reconcileAdminRole } from "@/lib/admin/roles";
import { requireSuperAdmin } from "@/lib/admin/guards";
import { slugify, withSuffix } from "@/lib/admin/slug";
import { parseUserRole } from "@/lib/admin/validation";
import { prisma } from "@/lib/db";
import { ROLE_LABELS } from "@/lib/format";

const UNEXPECTED_ERROR = "Algo salió mal. Intenta de nuevo.";

function text(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function isUniqueViolation(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002"
  );
}

export async function createCompany(
  _prevState: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  const session = await requireSuperAdmin();
  const name = text(formData, "name");
  const description = text(formData, "description") || null;

  if (name.length < 2) {
    return {
      status: "error",
      message: "El nombre de la empresa es demasiado corto.",
    };
  }

  const baseSlug = slugify(name);
  let company: { id: string; name: string; slug: string } | null = null;

  try {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const slug =
        attempt === 0 ? baseSlug : withSuffix(baseSlug, attempt + 1);

      try {
        company = await prisma.company.create({
          data: { name, slug, description },
          select: { id: true, name: true, slug: true },
        });
        break;
      } catch (error) {
        if (!isUniqueViolation(error)) {
          throw error;
        }
      }
    }
  } catch (error) {
    console.error(error);
    return { status: "error", message: UNEXPECTED_ERROR };
  }

  if (!company) {
    return {
      status: "error",
      message: "No se pudo generar una URL única para esta empresa.",
    };
  }

  await logAudit({
    eventId: null,
    eventName: null,
    companyId: company.id,
    companyName: company.name,
    actor: session.user,
    action: "company.created",
    entityType: "company",
    entityId: company.id,
    summary: `Se creó la empresa «${company.name}».`,
  });

  revalidatePath("/super-admin");

  return {
    status: "success",
    message: `Se creó la empresa «${company.name}».`,
  };
}

export async function addCompanyAdmin(
  _prevState: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  const session = await requireSuperAdmin();
  const companyId = text(formData, "companyId");
  const email = text(formData, "email").toLowerCase();

  if (!email) {
    return { status: "error", message: "Ingresa el email de la cuenta." };
  }

  const [company, user] = await Promise.all([
    prisma.company.findUnique({
      where: { id: companyId },
      select: { id: true, name: true },
    }),
    prisma.user.findUnique({
      where: { email },
      select: { id: true, name: true, role: true },
    }),
  ]);

  if (!company) {
    return { status: "error", message: "Esa empresa ya no existe." };
  }

  if (!user) {
    return {
      status: "error",
      message:
        "Ninguna cuenta usa ese email. La persona debe registrarse primero.",
    };
  }

  const existing = await prisma.companyMember.findUnique({
    where: {
      companyId_userId: { companyId: company.id, userId: user.id },
    },
    select: { id: true },
  });

  if (existing) {
    return {
      status: "error",
      message: `${user.name} ya administra ${company.name}.`,
    };
  }

  try {
    if (user.role === "ATTENDEE") {
      await prisma.user.update({
        where: { id: user.id },
        data: { role: "ADMIN" },
      });
    }

    await prisma.companyMember.create({
      data: { companyId: company.id, userId: user.id },
    });

    await logAudit({
      eventId: null,
      eventName: null,
      companyId: company.id,
      companyName: company.name,
      actor: session.user,
      action: "company.admin_added",
      entityType: "companyMember",
      entityId: user.id,
      summary: `Se agregó a ${user.name} como admin de ${company.name}.`,
    });
  } catch (error) {
    console.error(error);
    return { status: "error", message: UNEXPECTED_ERROR };
  }

  revalidatePath("/super-admin");

  return {
    status: "success",
    message: `${user.name} ahora administra ${company.name}.`,
  };
}

export async function removeCompanyAdmin(
  _prevState: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  const session = await requireSuperAdmin();
  const companyId = text(formData, "companyId");
  const userId = text(formData, "userId");

  const [company, user, membership] = await Promise.all([
    prisma.company.findUnique({
      where: { id: companyId },
      select: { id: true, name: true },
    }),
    prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true },
    }),
    prisma.companyMember.findUnique({
      where: { companyId_userId: { companyId, userId } },
      select: { id: true },
    }),
  ]);

  if (!company || !user || !membership) {
    return {
      status: "error",
      message: "Esa membresía ya no existe.",
    };
  }

  try {
    await prisma.companyMember.delete({ where: { id: membership.id } });
    await reconcileAdminRole(user.id);

    await logAudit({
      eventId: null,
      eventName: null,
      companyId: company.id,
      companyName: company.name,
      actor: session.user,
      action: "company.admin_removed",
      entityType: "companyMember",
      entityId: user.id,
      summary: `Se quitó a ${user.name} como admin de ${company.name}.`,
    });
  } catch (error) {
    console.error(error);
    return { status: "error", message: UNEXPECTED_ERROR };
  }

  revalidatePath("/super-admin");

  return {
    status: "success",
    message: `${user.name} ya no administra ${company.name}.`,
  };
}

export async function updateUserRole(
  _prevState: AdminFormState,
  formData: FormData,
): Promise<AdminFormState> {
  const session = await requireSuperAdmin();
  const userId = text(formData, "userId");
  const parsed = parseUserRole(formData.get("role"));

  if (!parsed.ok) {
    return { status: "error", message: parsed.error };
  }

  const role = parsed.value;

  const target = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, role: true },
  });

  if (!target) {
    return { status: "error", message: "Esa cuenta ya no existe." };
  }

  if (target.id === session.user.id) {
    return {
      status: "error",
      message: "No puedes cambiar tu propio rol desde aquí.",
    };
  }

  if (target.role === role) {
    return {
      status: "error",
      message: `${target.name} ya tiene el rol ${ROLE_LABELS[role] ?? role}.`,
    };
  }

  if (target.role === "SUPER_ADMIN" && role !== "SUPER_ADMIN") {
    const superAdmins = await prisma.user.count({
      where: { role: "SUPER_ADMIN" },
    });

    if (superAdmins <= 1) {
      return {
        status: "error",
        message: "No puedes quitar el rol al último super admin.",
      };
    }
  }

  if (role === "ATTENDEE") {
    const [memberships, stands] = await Promise.all([
      prisma.companyMember.count({ where: { userId: target.id } }),
      prisma.eventBadge.count({ where: { partnerId: target.id } }),
    ]);

    if (memberships > 0 || stands > 0) {
      return {
        status: "error",
        message: `Primero quita las asignaciones de empresa y stands de ${target.name}.`,
      };
    }
  }

  try {
    await prisma.user.update({
      where: { id: target.id },
      data: { role: role as Role },
    });

    await logAudit({
      eventId: null,
      eventName: null,
      actor: session.user,
      action: "user.role_changed",
      entityType: "user",
      entityId: target.id,
      summary: `Se cambió el rol de ${target.name} de ${ROLE_LABELS[target.role] ?? target.role} a ${ROLE_LABELS[role] ?? role}.`,
      metadata: { from: target.role, to: role },
    });
  } catch (error) {
    console.error(error);
    return { status: "error", message: UNEXPECTED_ERROR };
  }

  revalidatePath("/super-admin");
  revalidatePath("/super-admin/users");

  return {
    status: "success",
    message: `${target.name} ahora es ${ROLE_LABELS[role] ?? role}.`,
  };
}

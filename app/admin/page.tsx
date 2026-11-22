import type { Metadata } from "next";
import { redirect } from "next/navigation";

import OrganizerDashboard from "@/components/admin/OrganizerDashboard";
import Notice from "@/components/admin/Notice";
import PartnerDashboard from "@/components/admin/PartnerDashboard";
import { requireAdmin } from "@/lib/admin/guards";
import {
  getAdminCompanies,
  getCompanyEventSummaries,
  getStandSummaries,
} from "@/lib/admin/queries";

export const metadata: Metadata = {
  title: "Admin · Lyfter Badges",
};

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ deleted?: string }>;
}) {
  const session = await requireAdmin();
  const { deleted } = await searchParams;

  if (session.user.role === "SUPER_ADMIN") {
    redirect("/super-admin");
  }

  const [companies, stands] = await Promise.all([
    getAdminCompanies(session.user.id),
    getStandSummaries(session.user.id),
  ]);

  if (companies.length === 0 && stands.length === 0) {
    return (
      <p className="rounded-xl border border-[#39424f] bg-[#252c35] px-4 py-8 text-center text-sm text-[#9ca3af]">
        Tu cuenta todavía no tiene una empresa ni un stand asignados. Pide a un
        super admin que te otorgue acceso.
      </p>
    );
  }

  const events = await getCompanyEventSummaries(
    companies.map((company) => company.id),
  );

  return (
    <div className="space-y-14">
      {deleted === "1" ? (
        <Notice tone="success">Evento eliminado. Se conservó su registro de auditoría.</Notice>
      ) : null}

      {companies.length > 0 ? (
        <OrganizerDashboard events={events} companies={companies} />
      ) : null}

      {stands.length > 0 ? <PartnerDashboard stands={stands} /> : null}
    </div>
  );
}

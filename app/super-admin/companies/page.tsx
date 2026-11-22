import type { Metadata } from "next";

import { cardClassName } from "@/components/admin/formStyles";
import AddCompanyAdminForm from "@/components/admin/super-admin/AddCompanyAdminForm";
import CreateCompanyForm from "@/components/admin/super-admin/CreateCompanyForm";
import RemoveCompanyAdminButton from "@/components/admin/super-admin/RemoveCompanyAdminButton";
import { requireSuperAdmin } from "@/lib/admin/guards";
import { getAllCompanies } from "@/lib/admin/queries";
import { ROLE_LABELS } from "@/lib/format";

export const metadata: Metadata = {
  title: "Empresas · Super admin · Lyfter Badges",
};

export default async function SuperAdminCompaniesPage() {
  await requireSuperAdmin();
  const companies = await getAllCompanies();

  return (
    <div className="space-y-8">
      <header>
        <p className="text-xs font-semibold uppercase tracking-widest text-[#36bde9]">
          Super admin
        </p>
        <h1 className="mt-2 text-2xl font-bold sm:text-3xl">Empresas</h1>
        <p className="mt-2 text-sm text-[#9ca3af]">
          Cada empresa de la plataforma y los admins que gestionan sus eventos.
        </p>
      </header>

      <section className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
        <CreateCompanyForm />

        <div className={cardClassName}>
          <h2 className="text-lg font-bold text-[#f1f1ed]">Empresas</h2>
          <p className="mt-1 text-sm text-[#9ca3af]">
            Agrega una cuenta existente por email. Los asistentes se promueven
            a admin automáticamente.
          </p>

          {companies.length === 0 ? (
            <p className="mt-4 rounded-lg border border-[#39424f] bg-[#1f252d] px-4 py-8 text-center text-sm text-[#9ca3af]">
              Todavía no hay empresas creadas.
            </p>
          ) : (
            <ul className="mt-4 space-y-4">
              {companies.map((company) => (
                <li
                  key={company.id}
                  className="rounded-lg border border-[#39424f] bg-[#1f252d] p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <h3 className="font-bold text-[#f1f1ed]">
                        {company.name}
                      </h3>
                      <p className="text-xs text-[#9ca3af]">
                        /{company.slug} · {company.events}{" "}
                        {company.events === 1 ? "evento" : "eventos"}
                      </p>
                    </div>
                  </div>

                  {company.members.length > 0 ? (
                    <ul className="mt-3 divide-y divide-[#303743] text-sm">
                      {company.members.map((member) => (
                        <li
                          key={member.id}
                          className="flex flex-wrap items-center justify-between gap-2 py-2"
                        >
                          <div>
                            <span className="text-[#f1f1ed]">
                              {member.name}
                            </span>
                            <span className="ml-2 text-xs text-[#9ca3af]">
                              {member.email}
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-xs font-semibold text-[#7fd8f5]">
                              {ROLE_LABELS[member.role] ?? member.role}
                            </span>
                            <RemoveCompanyAdminButton
                              companyId={company.id}
                              userId={member.id}
                              userName={member.name}
                            />
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-2 text-xs text-[#9ca3af]">
                      Todavía no hay admins.
                    </p>
                  )}

                  <AddCompanyAdminForm companyId={company.id} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}

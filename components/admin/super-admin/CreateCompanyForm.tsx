"use client";

import { useActionState } from "react";

import { createCompany } from "@/app/super-admin/actions";
import {
  cardClassName,
  inputClassName,
  labelClassName,
  primaryButtonClassName,
} from "@/components/admin/formStyles";
import { initialAdminFormState } from "@/lib/admin/forms";

export default function CreateCompanyForm() {
  const [state, formAction, isPending] = useActionState(
    createCompany,
    initialAdminFormState,
  );

  return (
    <form action={formAction} className={cardClassName}>
      <h2 className="text-lg font-bold text-[#f1f1ed]">Crear una empresa</h2>
      <p className="mt-1 text-sm text-[#9ca3af]">
        Las empresas agrupan eventos y los admins que los gestionan.
      </p>

      <div className="mt-5 space-y-4">
        <div>
          <label htmlFor="company-name" className={labelClassName}>
            Nombre
          </label>
          <input
            id="company-name"
            name="name"
            required
            minLength={2}
            maxLength={120}
            className={inputClassName}
            placeholder="Acme Eventos"
          />
        </div>

        <div>
          <label htmlFor="company-description" className={labelClassName}>
            Descripción (opcional)
          </label>
          <input
            id="company-description"
            name="description"
            maxLength={280}
            className={inputClassName}
            placeholder="Qué organiza esta empresa"
          />
        </div>
      </div>

      {state.status !== "idle" ? (
        <p
          role={state.status === "error" ? "alert" : "status"}
          className={`mt-3 text-xs ${
            state.status === "error" ? "text-[#ffb3ba]" : "text-[#a8d889]"
          }`}
        >
          {state.message}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isPending}
        className={`${primaryButtonClassName} mt-5`}
      >
        {isPending ? "Creando…" : "Crear empresa"}
      </button>
    </form>
  );
}

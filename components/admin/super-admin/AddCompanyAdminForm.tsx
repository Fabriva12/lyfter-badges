"use client";

import { useActionState } from "react";

import { addCompanyAdmin } from "@/app/super-admin/actions";
import {
  inputClassName,
  secondaryButtonClassName,
} from "@/components/admin/formStyles";
import { initialAdminFormState } from "@/lib/admin/forms";

interface AddCompanyAdminFormProps {
  companyId: string;
}

export default function AddCompanyAdminForm({
  companyId,
}: AddCompanyAdminFormProps) {
  const [state, formAction, isPending] = useActionState(
    addCompanyAdmin,
    initialAdminFormState,
  );

  return (
    <form action={formAction} className="mt-4 space-y-2">
      <input type="hidden" name="companyId" value={companyId} />

      <div className="flex flex-wrap gap-2">
        <input
          name="email"
          type="email"
          required
          placeholder="admin@example.com"
          aria-label="Email del admin"
          className={`${inputClassName} max-w-xs`}
        />
        <button
          type="submit"
          disabled={isPending}
          className={`${secondaryButtonClassName} px-4 py-2 text-xs`}
        >
          {isPending ? "Agregando…" : "Agregar admin"}
        </button>
      </div>

      {state.status !== "idle" ? (
        <p
          role={state.status === "error" ? "alert" : "status"}
          className={`text-xs ${
            state.status === "error" ? "text-[#ffb3ba]" : "text-[#a8d889]"
          }`}
        >
          {state.message}
        </p>
      ) : null}
    </form>
  );
}

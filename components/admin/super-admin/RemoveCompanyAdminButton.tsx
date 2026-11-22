"use client";

import { useActionState } from "react";

import { removeCompanyAdmin } from "@/app/super-admin/actions";
import { initialAdminFormState } from "@/lib/admin/forms";

interface RemoveCompanyAdminButtonProps {
  companyId: string;
  userId: string;
  userName: string;
}

export default function RemoveCompanyAdminButton({
  companyId,
  userId,
  userName,
}: RemoveCompanyAdminButtonProps) {
  const [state, formAction, isPending] = useActionState(
    removeCompanyAdmin,
    initialAdminFormState,
  );

  return (
    <form action={formAction} className="inline">
      <input type="hidden" name="companyId" value={companyId} />
      <input type="hidden" name="userId" value={userId} />
      <button
        type="submit"
        disabled={isPending}
        aria-label={`Quitar a ${userName} de esta empresa`}
        className="text-xs font-semibold text-[#ffb3ba] transition hover:text-[#ffd1d6] disabled:opacity-60"
      >
        {isPending ? "Quitando…" : "Quitar"}
      </button>
      {state.status === "error" ? (
        <span role="alert" className="ml-2 text-xs text-[#ffb3ba]">
          {state.message}
        </span>
      ) : null}
    </form>
  );
}

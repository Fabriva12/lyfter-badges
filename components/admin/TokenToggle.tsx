"use client";

import { useActionState } from "react";

import { setQrTokenActive } from "@/app/admin/events/[id]/badges/actions";
import { secondaryButtonClassName } from "@/components/admin/formStyles";
import { initialAdminFormState } from "@/lib/admin/forms";

interface TokenToggleProps {
  eventId: string;
  tokenId: string;
  active: boolean;
}

export default function TokenToggle({
  eventId,
  tokenId,
  active,
}: TokenToggleProps) {
  const [state, formAction, isPending] = useActionState(
    setQrTokenActive,
    initialAdminFormState,
  );

  return (
    <form action={formAction} className="inline-flex flex-col items-start gap-2">
      <input type="hidden" name="eventId" value={eventId} />
      <input type="hidden" name="tokenId" value={tokenId} />
      <input type="hidden" name="active" value={active ? "false" : "true"} />

      <button
        type="submit"
        disabled={isPending}
        className={`${secondaryButtonClassName} px-3 py-2 text-xs`}
      >
        {isPending ? "Guardando…" : active ? "Desactivar" : "Reactivar"}
      </button>

      {state.status === "error" ? (
        <span role="alert" className="text-xs text-[#ffb3ba]">
          {state.message}
        </span>
      ) : null}
    </form>
  );
}

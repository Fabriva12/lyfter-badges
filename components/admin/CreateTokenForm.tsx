"use client";

import { useActionState } from "react";

import { createQrToken } from "@/app/admin/events/[id]/badges/actions";
import {
  inputClassName,
  labelClassName,
  primaryButtonClassName,
} from "@/components/admin/formStyles";
import { initialAdminFormState } from "@/lib/admin/forms";

interface CreateTokenFormProps {
  eventId: string;
  kind: "BADGE" | "WELCOME";
  eventBadgeId?: string;
}

export default function CreateTokenForm({
  eventId,
  kind,
  eventBadgeId,
}: CreateTokenFormProps) {
  const [state, formAction, isPending] = useActionState(
    createQrToken,
    initialAdminFormState,
  );

  return (
    <form
      action={formAction}
      className="mt-4 flex flex-col items-stretch gap-3 sm:flex-row sm:flex-wrap sm:items-end"
    >
      <input type="hidden" name="eventId" value={eventId} />
      <input type="hidden" name="kind" value={kind} />
      {eventBadgeId ? (
        <input type="hidden" name="eventBadgeId" value={eventBadgeId} />
      ) : null}

      <div>
        <label htmlFor={`max-scans-${eventBadgeId ?? kind}`} className={labelClassName}>
          Límite de escaneos
        </label>
        <input
          id={`max-scans-${eventBadgeId ?? kind}`}
          name="maxScans"
          type="number"
          min={1}
          step={1}
          placeholder="Sin límite"
          className={`${inputClassName} w-full sm:w-40`}
        />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className={`${primaryButtonClassName} w-full px-4 py-3 text-xs sm:w-auto`}
      >
        {isPending ? "Creando…" : "Crear token QR"}
      </button>

      {state.status === "error" ? (
        <p role="alert" className="w-full text-xs text-[#ffb3ba]">
          {state.message}
        </p>
      ) : null}
    </form>
  );
}

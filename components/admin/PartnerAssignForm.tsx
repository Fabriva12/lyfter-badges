"use client";

import { useActionState } from "react";

import { assignStandPartner } from "@/app/admin/events/[id]/badges/actions";
import {
  inputClassName,
  labelClassName,
  secondaryButtonClassName,
} from "@/components/admin/formStyles";
import { initialAdminFormState } from "@/lib/admin/forms";

interface PartnerAssignFormProps {
  eventId: string;
  eventBadgeId: string;
  partners: Array<{ id: string; name: string; email: string }>;
  currentPartnerId: string | null;
}

export default function PartnerAssignForm({
  eventId,
  eventBadgeId,
  partners,
  currentPartnerId,
}: PartnerAssignFormProps) {
  const [state, formAction, isPending] = useActionState(
    assignStandPartner,
    initialAdminFormState,
  );

  return (
    <form action={formAction} className="space-y-2">
      <input type="hidden" name="eventId" value={eventId} />
      <input type="hidden" name="eventBadgeId" value={eventBadgeId} />

      <label htmlFor={`partner-${eventBadgeId}`} className={labelClassName}>
        Socio del stand
      </label>

      <div className="flex flex-wrap gap-2">
        <select
          id={`partner-${eventBadgeId}`}
          name="partnerId"
          defaultValue={currentPartnerId ?? ""}
          className={`${inputClassName} max-w-xs`}
        >
          <option value="">Sin socio</option>
          {partners.map((partner) => (
            <option key={partner.id} value={partner.id}>
              {partner.name} ({partner.email})
            </option>
          ))}
        </select>

        <button
          type="submit"
          disabled={isPending}
          className={`${secondaryButtonClassName} px-4 py-2 text-xs`}
        >
          {isPending ? "Guardando…" : "Guardar socio"}
        </button>
      </div>

      {state.status === "error" ? (
        <p role="alert" className="text-xs text-[#ffb3ba]">
          {state.message}
        </p>
      ) : null}
    </form>
  );
}

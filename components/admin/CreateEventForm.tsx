"use client";

import { useActionState } from "react";

import { createEvent } from "@/app/admin/actions";
import {
  cardClassName,
  inputClassName,
  labelClassName,
  primaryButtonClassName,
} from "@/components/admin/formStyles";
import { initialAdminFormState } from "@/lib/admin/forms";
import type { AdminCompany } from "@/lib/admin/queries";
import { EVENT_MODES, EVENT_STATUSES } from "@/lib/admin/validation";
import { EVENT_MODE_LABELS, EVENT_STATUS_LABELS } from "@/lib/format";

interface CreateEventFormProps {
  companies: AdminCompany[];
}

export default function CreateEventForm({ companies }: CreateEventFormProps) {
  const [state, formAction, isPending] = useActionState(
    createEvent,
    initialAdminFormState,
  );

  return (
    <form action={formAction} className={cardClassName}>
      <h2 className="text-lg font-bold text-[#f1f1ed]">Crear un evento</h2>
      <p className="mt-1 text-sm text-[#9ca3af]">
        La URL del evento se genera a partir del nombre y no se puede cambiar
        después.
      </p>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor="new-company" className={labelClassName}>
            Empresa
          </label>
          <select
            id="new-company"
            name="companyId"
            required
            defaultValue={companies[0]?.id ?? ""}
            className={inputClassName}
          >
            {companies.map((company) => (
              <option key={company.id} value={company.id}>
                {company.name}
              </option>
            ))}
          </select>
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="new-name" className={labelClassName}>
            Nombre
          </label>
          <input
            id="new-name"
            name="name"
            required
            maxLength={120}
            placeholder="Lyfter Meetup 2027"
            className={inputClassName}
          />
        </div>

        <div>
          <label htmlFor="new-location" className={labelClassName}>
            Ubicación
          </label>
          <input
            id="new-location"
            name="location"
            maxLength={120}
            placeholder="San José"
            className={inputClassName}
          />
        </div>

        <div>
          <label htmlFor="new-country" className={labelClassName}>
            País
          </label>
          <input
            id="new-country"
            name="country"
            maxLength={80}
            placeholder="Costa Rica"
            className={inputClassName}
          />
        </div>

        <div>
          <label htmlFor="new-mode" className={labelClassName}>
            Modalidad
          </label>
          <select
            id="new-mode"
            name="mode"
            defaultValue="IN_PERSON"
            className={inputClassName}
          >
            {EVENT_MODES.map((mode) => (
              <option key={mode} value={mode}>
                {EVENT_MODE_LABELS[mode]}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="new-status" className={labelClassName}>
            Estado
          </label>
          <select
            id="new-status"
            name="status"
            defaultValue="DRAFT"
            className={inputClassName}
          >
            {EVENT_STATUSES.map((status) => (
              <option key={status} value={status}>
                {EVENT_STATUS_LABELS[status]}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="new-starts-at-date" className={labelClassName}>
              Fecha de inicio
            </label>
            <input
              id="new-starts-at-date"
              name="startsAtDate"
              type="date"
              required
              className={inputClassName}
            />
          </div>

          <div>
            <label htmlFor="new-starts-at-time" className={labelClassName}>
              Hora de inicio (Costa Rica)
            </label>
            <input
              id="new-starts-at-time"
              name="startsAtTime"
              type="time"
              required
              className={inputClassName}
            />
          </div>

          <div>
            <label htmlFor="new-ends-at-date" className={labelClassName}>
              Fecha de fin
            </label>
            <input
              id="new-ends-at-date"
              name="endsAtDate"
              type="date"
              required
              className={inputClassName}
            />
          </div>

          <div>
            <label htmlFor="new-ends-at-time" className={labelClassName}>
              Hora de fin (Costa Rica)
            </label>
            <input
              id="new-ends-at-time"
              name="endsAtTime"
              type="time"
              required
              className={inputClassName}
            />
          </div>
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="new-description" className={labelClassName}>
            Descripción
          </label>
          <textarea
            id="new-description"
            name="description"
            rows={3}
            maxLength={1000}
            className={inputClassName}
          />
        </div>
      </div>

      {state.status === "error" ? (
        <p
          role="alert"
          className="mt-4 rounded-lg border border-[#f47f8a]/40 bg-[#f47f8a]/10 px-4 py-3 text-sm font-medium text-[#ffb3ba]"
        >
          {state.message}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isPending}
        className={`mt-5 ${primaryButtonClassName}`}
      >
        {isPending ? "Creando…" : "Crear evento"}
      </button>
    </form>
  );
}

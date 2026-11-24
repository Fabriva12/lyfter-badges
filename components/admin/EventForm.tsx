"use client";

import { useActionState } from "react";

import { updateEvent } from "@/app/admin/events/[id]/actions";
import {
  cardClassName,
  inputClassName,
  labelClassName,
  primaryButtonClassName,
} from "@/components/admin/formStyles";
import { initialAdminFormState } from "@/lib/admin/forms";
import { EVENT_MODES, EVENT_STATUSES } from "@/lib/admin/validation";
import { toLocalDateValue, toLocalTimeValue } from "@/lib/date";
import { EVENT_MODE_LABELS, EVENT_STATUS_LABELS } from "@/lib/format";

interface EventFormProps {
  event: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    location: string | null;
    country: string | null;
    mode: string;
    status: string;
    startsAt: Date;
    endsAt: Date;
  };
}

export default function EventForm({ event }: EventFormProps) {
  const [state, formAction, isPending] = useActionState(
    updateEvent,
    initialAdminFormState,
  );

  return (
    <form action={formAction} className={cardClassName}>
      <h2 className="text-lg font-bold text-foreground">Detalles del evento</h2>
      <p className="mt-1 text-sm text-muted">
        La URL pública es <code>{`/leaderboard?event=${event.slug}`}</code> y no
        cambia con el nombre.
      </p>

      <input type="hidden" name="eventId" value={event.id} />

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor="event-name" className={labelClassName}>
            Nombre
          </label>
          <input
            id="event-name"
            name="name"
            required
            maxLength={120}
            defaultValue={event.name}
            className={inputClassName}
          />
        </div>

        <div>
          <label htmlFor="event-location" className={labelClassName}>
            Ubicación
          </label>
          <input
            id="event-location"
            name="location"
            maxLength={120}
            defaultValue={event.location ?? ""}
            className={inputClassName}
          />
        </div>

        <div>
          <label htmlFor="event-country" className={labelClassName}>
            País
          </label>
          <input
            id="event-country"
            name="country"
            maxLength={80}
            defaultValue={event.country ?? ""}
            placeholder="Costa Rica"
            className={inputClassName}
          />
        </div>

        <div>
          <label htmlFor="event-mode" className={labelClassName}>
            Modalidad
          </label>
          <select
            id="event-mode"
            name="mode"
            defaultValue={event.mode}
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
          <label htmlFor="event-status" className={labelClassName}>
            Estado
          </label>
          <select
            id="event-status"
            name="status"
            defaultValue={event.status}
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
            <label htmlFor="event-starts-at-date" className={labelClassName}>
              Fecha de inicio
            </label>
            <input
              id="event-starts-at-date"
              name="startsAtDate"
              type="date"
              required
              defaultValue={toLocalDateValue(event.startsAt)}
              className={inputClassName}
            />
          </div>

          <div>
            <label htmlFor="event-starts-at-time" className={labelClassName}>
              Hora de inicio (Costa Rica)
            </label>
            <input
              id="event-starts-at-time"
              name="startsAtTime"
              type="time"
              required
              defaultValue={toLocalTimeValue(event.startsAt)}
              className={inputClassName}
            />
          </div>

          <div>
            <label htmlFor="event-ends-at-date" className={labelClassName}>
              Fecha de fin
            </label>
            <input
              id="event-ends-at-date"
              name="endsAtDate"
              type="date"
              required
              defaultValue={toLocalDateValue(event.endsAt)}
              className={inputClassName}
            />
          </div>

          <div>
            <label htmlFor="event-ends-at-time" className={labelClassName}>
              Hora de fin (Costa Rica)
            </label>
            <input
              id="event-ends-at-time"
              name="endsAtTime"
              type="time"
              required
              defaultValue={toLocalTimeValue(event.endsAt)}
              className={inputClassName}
            />
          </div>
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="event-description" className={labelClassName}>
            Descripción
          </label>
          <textarea
            id="event-description"
            name="description"
            rows={3}
            maxLength={1000}
            defaultValue={event.description ?? ""}
            className={inputClassName}
          />
        </div>
      </div>

      {state.status === "error" ? (
        <p
          role="alert"
          className="mt-4 rounded-lg border border-coral/40 bg-coral/10 px-4 py-3 text-sm font-medium text-coral-soft"
        >
          {state.message}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isPending}
        className={`mt-5 ${primaryButtonClassName}`}
      >
        {isPending ? "Guardando…" : "Guardar cambios"}
      </button>
    </form>
  );
}

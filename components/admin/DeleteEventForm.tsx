"use client";

import { useActionState, useState } from "react";

import { deleteEvent } from "@/app/admin/events/[id]/actions";
import {
  inputClassName,
  labelClassName,
} from "@/components/admin/formStyles";
import { initialAdminFormState } from "@/lib/admin/forms";

interface DeleteEventFormProps {
  eventId: string;
  eventName: string;
  attendees: number;
  scans: number;
  badges: number;
}

export default function DeleteEventForm({
  eventId,
  eventName,
  attendees,
  scans,
  badges,
}: DeleteEventFormProps) {
  const [state, formAction, isPending] = useActionState(
    deleteEvent,
    initialAdminFormState,
  );
  const [confirmation, setConfirmation] = useState("");
  const matches = confirmation.trim() === eventName;

  return (
    <section className="rounded-xl border border-[#f47f8a]/40 bg-[#2a2228] p-5 shadow-2xl shadow-black/30 sm:p-7">
      <h2 className="text-lg font-bold text-[#ffb3ba]">Zona de peligro</h2>
      <p className="mt-1 text-sm text-[#d7c3c6]">
        Eliminar el evento también borra sus insignias, premio, galería, tokens
        QR e historial de asistencia. No se puede deshacer.
      </p>
      <p className="mt-2 text-sm text-[#9ca3af]">
        Este evento tiene {attendees}{" "}
        {attendees === 1 ? "asistente" : "asistentes"}, {scans}{" "}
        {scans === 1 ? "escaneo" : "escaneos"} y {badges}{" "}
        {badges === 1 ? "insignia" : "insignias"}.
      </p>

      <form action={formAction} className="mt-5">
        <input type="hidden" name="eventId" value={eventId} />

        <label htmlFor={`delete-event-${eventId}`} className={labelClassName}>
          Escribí “{eventName}” para confirmar
        </label>
        <input
          id={`delete-event-${eventId}`}
          name="confirmation"
          autoComplete="off"
          required
          value={confirmation}
          onChange={(event) => setConfirmation(event.target.value)}
          className={inputClassName}
        />

        {state.status === "error" ? (
          <p
            role="alert"
            className="mt-3 rounded-lg border border-[#f47f8a]/40 bg-[#f47f8a]/10 px-4 py-3 text-sm font-medium text-[#ffb3ba]"
          >
            {state.message}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={!matches || isPending}
          className="mt-4 rounded-lg bg-[#f47f8a] px-6 py-3 text-sm font-bold text-[#2a1417] transition hover:bg-[#ff9aa3] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPending ? "Eliminando…" : "Eliminar evento permanentemente"}
        </button>
      </form>
    </section>
  );
}

"use client";

import { useActionState } from "react";

import { savePrize } from "@/app/admin/events/[id]/prize/actions";
import {
  cardClassName,
  inputClassName,
  labelClassName,
  primaryButtonClassName,
} from "@/components/admin/formStyles";
import { initialAdminFormState } from "@/lib/admin/forms";

interface PrizeFormProps {
  eventId: string;
  badgeCount: number;
  prize: {
    name: string;
    description: string | null;
    imageUrl: string | null;
    requiredBadgesCount: number;
    revealedAt: Date | null;
  } | null;
}

export default function PrizeForm({
  eventId,
  badgeCount,
  prize,
}: PrizeFormProps) {
  const [state, formAction, isPending] = useActionState(
    savePrize,
    initialAdminFormState,
  );

  const canSave = badgeCount > 0;

  return (
    <form action={formAction} className={cardClassName}>
      <input type="hidden" name="eventId" value={eventId} />

      <h2 className="text-lg font-bold text-[#f1f1ed]">
        {prize ? "Editar premio" : "Crear premio"}
      </h2>
      <p className="mt-1 text-sm text-[#9ca3af]">
        El premio permanece secreto para los asistentes hasta que completen la
        cantidad de insignias requerida. Anunciarlo revela los detalles a todos
        sin otorgarlo.
      </p>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor="prize-name" className={labelClassName}>
            Nombre
          </label>
          <input
            id="prize-name"
            name="name"
            required
            maxLength={120}
            defaultValue={prize?.name ?? ""}
            placeholder="Kit de Lyfter"
            className={inputClassName}
            disabled={!canSave}
          />
        </div>

        <div>
          <label htmlFor="prize-required" className={labelClassName}>
            Insignias requeridas
          </label>
          <input
            id="prize-required"
            name="requiredBadgesCount"
            type="number"
            min={1}
            max={Math.max(badgeCount, 1)}
            step={1}
            required
            defaultValue={prize?.requiredBadgesCount ?? badgeCount}
            className={inputClassName}
            disabled={!canSave}
          />
          <p className="mt-1 text-xs text-[#9ca3af]">
            Este evento tiene {badgeCount}{" "}
            {badgeCount === 1 ? "insignia" : "insignias"}.
          </p>
        </div>

        <div>
          <label htmlFor="prize-image" className={labelClassName}>
            URL de imagen (opcional)
          </label>
          <input
            id="prize-image"
            name="imageUrl"
            type="url"
            maxLength={500}
            defaultValue={prize?.imageUrl ?? ""}
            placeholder="https://…"
            className={inputClassName}
            disabled={!canSave}
          />
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="prize-description" className={labelClassName}>
            Descripción
          </label>
          <textarea
            id="prize-description"
            name="description"
            rows={3}
            maxLength={1000}
            defaultValue={prize?.description ?? ""}
            className={inputClassName}
            disabled={!canSave}
          />
        </div>

        <label className="flex items-center gap-3 text-sm font-semibold text-[#d7dce3] sm:col-span-2">
          <input
            type="checkbox"
            name="announce"
            defaultChecked={Boolean(prize?.revealedAt)}
            disabled={!canSave}
            className="h-4 w-4 rounded border-[#39424f] bg-[#171b21]"
          />
          Anunciar el premio a todos los asistentes ahora
        </label>
      </div>

      {!canSave ? (
        <p className="mt-4 rounded-lg border border-[#ffc875]/40 bg-[#ffc875]/10 px-4 py-3 text-sm font-medium text-[#ffe0b2]">
          Agregá al menos una insignia al evento antes de crear un premio.
        </p>
      ) : null}

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
        disabled={isPending || !canSave}
        className={`mt-5 ${primaryButtonClassName}`}
      >
        {isPending ? "Guardando…" : prize ? "Guardar premio" : "Crear premio"}
      </button>
    </form>
  );
}

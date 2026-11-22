"use client";

import { useActionState } from "react";

import { addEventBadge } from "@/app/admin/events/[id]/badges/actions";
import {
  inputClassName,
  labelClassName,
  primaryButtonClassName,
} from "@/components/admin/formStyles";
import { initialAdminFormState } from "@/lib/admin/forms";
import {
  BADGE_RARITIES,
  BADGE_TYPES,
} from "@/lib/admin/validation";
import {
  BADGE_ICON_KEYS,
  BADGE_ICON_LABELS,
  BadgeIcon,
} from "@/lib/badges/icons";
import { BADGE_RARITY_LABELS, BADGE_TYPE_LABELS } from "@/lib/format";

interface AddBadgeFormProps {
  eventId: string;
  catalog: Array<{ name: string; xpValue: number }>;
}

export default function AddBadgeForm({
  eventId,
  catalog,
}: AddBadgeFormProps) {
  const [state, formAction, isPending] = useActionState(
    addEventBadge,
    initialAdminFormState,
  );

  return (
    <form action={formAction}>
      <input type="hidden" name="eventId" value={eventId} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <label htmlFor="badge-name" className={labelClassName}>
            Nombre de la insignia
          </label>
          <input
            id="badge-name"
            name="name"
            required
            maxLength={120}
            list="badge-catalog"
            placeholder="Charla inaugural"
            className={inputClassName}
          />
          <datalist id="badge-catalog">
            {catalog.map((item) => (
              <option key={item.name} value={item.name}>
                {item.xpValue} XP
              </option>
            ))}
          </datalist>
        </div>

        <div>
          <label htmlFor="badge-xp" className={labelClassName}>
            XP (solo para insignias nuevas)
          </label>
          <input
            id="badge-xp"
            name="xpValue"
            type="number"
            min={1}
            step={1}
            required
            defaultValue={50}
            className={inputClassName}
          />
        </div>

        <div>
          <label htmlFor="badge-type" className={labelClassName}>
            Tipo
          </label>
          <select
            id="badge-type"
            name="type"
            defaultValue="TALK"
            className={inputClassName}
          >
            {BADGE_TYPES.map((type) => (
              <option key={type} value={type}>
                {BADGE_TYPE_LABELS[type]}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="badge-rarity" className={labelClassName}>
            Rareza
          </label>
          <select
            id="badge-rarity"
            name="rarity"
            defaultValue="COMMON"
            className={inputClassName}
          >
            {BADGE_RARITIES.map((rarity) => (
              <option key={rarity} value={rarity}>
                {BADGE_RARITY_LABELS[rarity]}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="badge-room" className={labelClassName}>
            Sala / stand
          </label>
          <input
            id="badge-room"
            name="room"
            maxLength={120}
            placeholder="Escenario principal"
            className={inputClassName}
          />
        </div>

        <div>
          <label htmlFor="badge-starts-at" className={labelClassName}>
            Inicio (hora Costa Rica, opcional)
          </label>
          <input
            id="badge-starts-at"
            name="startsAt"
            type="datetime-local"
            className={inputClassName}
          />
        </div>

        <div className="sm:col-span-2 lg:col-span-4">
          <label htmlFor="badge-description" className={labelClassName}>
            Descripción
          </label>
          <textarea
            id="badge-description"
            name="description"
            rows={2}
            maxLength={1000}
            placeholder="¿Qué representa esta insignia?"
            className={inputClassName}
          />
        </div>

        <fieldset className="sm:col-span-2 lg:col-span-4">
          <legend className={labelClassName}>Ícono</legend>
          <div className="mt-2 grid grid-cols-5 gap-2 sm:grid-cols-10">
            {BADGE_ICON_KEYS.map((key) => (
              <label
                key={key}
                className="flex cursor-pointer flex-col items-center gap-1 rounded-lg border border-[#39424f] bg-[#1f252d] px-2 py-3 text-center text-[11px] font-semibold text-[#9ca3af] transition has-[:checked]:border-[#36bde9] has-[:checked]:bg-[#36bde9]/15 has-[:checked]:text-[#7fd8f5]"
              >
                <input
                  type="radio"
                  name="iconKey"
                  value={key}
                  defaultChecked={key === "star"}
                  className="sr-only"
                />
                <BadgeIcon name={key} className="h-5 w-5" />
                {BADGE_ICON_LABELS[key]}
              </label>
            ))}
          </div>
        </fieldset>
      </div>

      <p className="mt-3 text-xs text-[#9ca3af]">
        Reutilizar un nombre del catálogo conserva el XP, la descripción, el
        tipo, la rareza y el ícono actuales de esa insignia.
      </p>

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
        disabled={isPending}
        className={`mt-4 ${primaryButtonClassName}`}
      >
        {isPending ? "Agregando…" : "Agregar insignia al evento"}
      </button>
    </form>
  );
}

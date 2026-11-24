"use client";

import { useActionState } from "react";

import {
  removeEventBadge,
  updateCatalogBadge,
  updateEventBadge,
} from "@/app/admin/events/[id]/badges/actions";
import {
  inputClassName,
  labelClassName,
  secondaryButtonClassName,
} from "@/components/admin/formStyles";
import { initialAdminFormState } from "@/lib/admin/forms";
import { isCatalogBadgeShared } from "@/lib/admin/badges";
import { BADGE_RARITIES, BADGE_TYPES } from "@/lib/admin/validation";
import {
  BADGE_ICON_KEYS,
  BADGE_ICON_LABELS,
  BadgeIcon,
} from "@/lib/badges/icons";
import { BADGE_RARITY_LABELS, BADGE_TYPE_LABELS } from "@/lib/format";

interface BadgeEditFormProps {
  eventId: string;
  eventBadgeId: string;
  name: string;
  description: string | null;
  xpValue: number;
  type: string;
  rarity: string;
  iconKey: string | null;
  room: string | null;
  startsAtValue: string;
  catalogUsage: number;
  scans: number;
}

function ErrorMessage({ message }: { message?: string }) {
  if (!message) {
    return null;
  }

  return (
    <p role="alert" className="mt-2 text-xs text-[#ffb3ba]">
      {message}
    </p>
  );
}

export default function BadgeEditForm({
  eventId,
  eventBadgeId,
  name,
  description,
  xpValue,
  type,
  rarity,
  iconKey,
  room,
  startsAtValue,
  catalogUsage,
  scans,
}: BadgeEditFormProps) {
  const [eventState, eventAction, eventPending] = useActionState(
    updateEventBadge,
    initialAdminFormState,
  );
  const [catalogState, catalogAction, catalogPending] = useActionState(
    updateCatalogBadge,
    initialAdminFormState,
  );
  const [removeState, removeAction, removePending] = useActionState(
    removeEventBadge,
    initialAdminFormState,
  );

  const shared = isCatalogBadgeShared(catalogUsage);

  return (
    <details className="mt-4 rounded-lg border border-[#303743] bg-[#1f252d] px-4 py-3">
      <summary className="cursor-pointer text-sm font-semibold text-[#d7dce3]">
        Editar o quitar insignia
      </summary>

      <div className="mt-4 space-y-6">
        <form action={eventAction}>
          <input type="hidden" name="eventId" value={eventId} />
          <input type="hidden" name="eventBadgeId" value={eventBadgeId} />

          <h4 className="text-sm font-bold text-[#f1f1ed]">
            Programación del evento
          </h4>
          <p className="mt-1 text-xs text-[#9ca3af]">
            La sala y la hora de inicio son propias de este evento.
          </p>

          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div>
              <label
                htmlFor={`badge-room-${eventBadgeId}`}
                className={labelClassName}
              >
                Sala / stand
              </label>
              <input
                id={`badge-room-${eventBadgeId}`}
                name="room"
                maxLength={120}
                defaultValue={room ?? ""}
                placeholder="Escenario principal"
                className={inputClassName}
              />
            </div>

            <div>
              <label
                htmlFor={`badge-starts-${eventBadgeId}`}
                className={labelClassName}
              >
                Inicio (hora Costa Rica, opcional)
              </label>
              <input
                id={`badge-starts-${eventBadgeId}`}
                name="startsAt"
                type="datetime-local"
                defaultValue={startsAtValue}
                className={inputClassName}
              />
            </div>
          </div>

          <ErrorMessage
            message={eventState.status === "error" ? eventState.message : ""}
          />

          <button
            type="submit"
            disabled={eventPending}
            className={`mt-3 ${secondaryButtonClassName} px-4 py-2 text-xs`}
          >
            {eventPending ? "Guardando…" : "Guardar programación"}
          </button>
        </form>

        <div className="border-t border-[#303743] pt-5">
          {shared ? (
            <p className="rounded-lg border border-[#ffc875]/40 bg-[#ffc875]/10 px-4 py-3 text-xs text-[#ffe0b2]">
              Esta insignia se usa en {catalogUsage} eventos. Editar la entrada
              del catálogo cambiaría el nombre, el XP y el ícono en todos
              lados, por eso acá es de solo lectura. Agregá una insignia con
              otro nombre si necesitás una variante.
            </p>
          ) : (
            <form action={catalogAction}>
              <input type="hidden" name="eventId" value={eventId} />
              <input type="hidden" name="eventBadgeId" value={eventBadgeId} />

              <h4 className="text-sm font-bold text-[#f1f1ed]">
                Catálogo de insignias
              </h4>
              <p className="mt-1 text-xs text-[#9ca3af]">
                Solo este evento usa esta insignia, así que todavía se pueden
                cambiar su nombre, XP e ícono.
              </p>

              <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <label
                    htmlFor={`badge-name-${eventBadgeId}`}
                    className={labelClassName}
                  >
                    Nombre de la insignia
                  </label>
                  <input
                    id={`badge-name-${eventBadgeId}`}
                    name="name"
                    required
                    maxLength={120}
                    defaultValue={name}
                    className={inputClassName}
                  />
                </div>

                <div>
                  <label
                    htmlFor={`badge-xp-${eventBadgeId}`}
                    className={labelClassName}
                  >
                    XP
                  </label>
                  <input
                    id={`badge-xp-${eventBadgeId}`}
                    name="xpValue"
                    type="number"
                    min={1}
                    step={1}
                    required
                    defaultValue={xpValue}
                    className={inputClassName}
                  />
                </div>

                <div>
                  <label
                    htmlFor={`badge-type-${eventBadgeId}`}
                    className={labelClassName}
                  >
                    Tipo
                  </label>
                  <select
                    id={`badge-type-${eventBadgeId}`}
                    name="type"
                    defaultValue={type}
                    className={inputClassName}
                  >
                    {BADGE_TYPES.map((option) => (
                      <option key={option} value={option}>
                        {BADGE_TYPE_LABELS[option]}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor={`badge-rarity-${eventBadgeId}`}
                    className={labelClassName}
                  >
                    Rareza
                  </label>
                  <select
                    id={`badge-rarity-${eventBadgeId}`}
                    name="rarity"
                    defaultValue={rarity}
                    className={inputClassName}
                  >
                    {BADGE_RARITIES.map((option) => (
                      <option key={option} value={option}>
                        {BADGE_RARITY_LABELS[option]}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2 lg:col-span-4">
                  <label
                    htmlFor={`badge-description-${eventBadgeId}`}
                    className={labelClassName}
                  >
                    Descripción
                  </label>
                  <textarea
                    id={`badge-description-${eventBadgeId}`}
                    name="description"
                    rows={2}
                    maxLength={1000}
                    defaultValue={description ?? ""}
                    className={inputClassName}
                  />
                </div>

                <fieldset className="sm:col-span-2 lg:col-span-4">
                  <legend className={labelClassName}>Ícono</legend>
                  <div className="mt-2 grid grid-cols-5 gap-2 sm:grid-cols-10">
                    {BADGE_ICON_KEYS.map((key) => (
                      <label
                        key={key}
                        className="flex cursor-pointer flex-col items-center gap-1 rounded-lg border border-[#39424f] bg-[#171b21] px-2 py-3 text-center text-[11px] font-semibold text-[#9ca3af] transition has-[:checked]:border-[#36bde9] has-[:checked]:bg-[#36bde9]/15 has-[:checked]:text-[#7fd8f5]"
                      >
                        <input
                          type="radio"
                          name="iconKey"
                          value={key}
                          defaultChecked={key === iconKey}
                          className="sr-only"
                        />
                        <BadgeIcon name={key} className="h-5 w-5" />
                        {BADGE_ICON_LABELS[key]}
                      </label>
                    ))}
                  </div>
                </fieldset>
              </div>

              <ErrorMessage
                message={
                  catalogState.status === "error" ? catalogState.message : ""
                }
              />

              <button
                type="submit"
                disabled={catalogPending}
                className={`mt-3 ${secondaryButtonClassName} px-4 py-2 text-xs`}
              >
                {catalogPending ? "Guardando…" : "Guardar cambios del catálogo"}
              </button>
            </form>
          )}
        </div>

        <form
          action={removeAction}
          className="border-t border-[#303743] pt-5"
        >
          <input type="hidden" name="eventId" value={eventId} />
          <input type="hidden" name="eventBadgeId" value={eventBadgeId} />

          <h4 className="text-sm font-bold text-[#f1f1ed]">
            Quitar insignia
          </h4>
          <p className="mt-1 text-xs text-[#9ca3af]">
            {scans > 0
              ? `Esta insignia ya tiene ${scans} ${
                  scans === 1 ? "escaneo" : "escaneos"
                }, así que no se puede quitar sin borrar el historial de asistencia.`
              : "La desprende de este evento. La entrada del catálogo sigue disponible para otros eventos."}
          </p>

          <div className="mt-3 flex flex-wrap items-end gap-3">
            <div className="min-w-48">
              <label
                htmlFor={`badge-confirm-${eventBadgeId}`}
                className={labelClassName}
              >
                Escribí “{name}” para confirmar
              </label>
              <input
                id={`badge-confirm-${eventBadgeId}`}
                name="confirmation"
                autoComplete="off"
                required
                className={inputClassName}
              />
            </div>

            <button
              type="submit"
              disabled={removePending || scans > 0}
              className="rounded-lg border border-[#f47f8a]/50 px-4 py-2 text-xs font-semibold text-[#ffb3ba] transition hover:bg-[#f47f8a]/10 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {removePending ? "Quitando…" : "Quitar del evento"}
            </button>
          </div>

          <ErrorMessage
            message={removeState.status === "error" ? removeState.message : ""}
          />
        </form>
      </div>
    </details>
  );
}

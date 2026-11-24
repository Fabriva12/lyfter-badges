"use client";

import { useActionState } from "react";

import {
  addEventImage,
  moveEventImage,
  removeEventImage,
  setEventImageCover,
} from "@/app/admin/events/[id]/actions";
import {
  cardClassName,
  inputClassName,
  labelClassName,
  primaryButtonClassName,
} from "@/components/admin/formStyles";
import { initialAdminFormState } from "@/lib/admin/forms";

interface EventGalleryProps {
  eventId: string;
  images: Array<{ id: string; url: string; alt: string | null }>;
}

export default function EventGallery({ eventId, images }: EventGalleryProps) {
  const [state, formAction, isPending] = useActionState(
    addEventImage,
    initialAdminFormState,
  );

  return (
    <section className={cardClassName}>
      <h2 className="text-lg font-bold text-[#f1f1ed]">Galería</h2>
      <p className="mt-1 text-sm text-[#9ca3af]">
        Fotos del evento. Pegá una URL pública de imagen; usá las flechas para
        reordenar y la primera imagen se usa como portada en el listado público.
      </p>

      <form action={formAction} className="mt-5">
        <input type="hidden" name="eventId" value={eventId} />

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="gallery-url" className={labelClassName}>
              URL de la imagen
            </label>
            <input
              id="gallery-url"
              name="url"
              type="url"
              required
              maxLength={500}
              placeholder="https://…"
              className={inputClassName}
            />
          </div>

          <div>
            <label htmlFor="gallery-alt" className={labelClassName}>
              Texto alternativo (opcional)
            </label>
            <input
              id="gallery-alt"
              name="alt"
              maxLength={160}
              placeholder="Charla inaugural en el escenario principal"
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
          className={`mt-4 ${primaryButtonClassName}`}
        >
          {isPending ? "Agregando…" : "Agregar imagen"}
        </button>
      </form>

      {images.length === 0 ? (
        <p className="mt-6 rounded-lg border border-[#39424f] bg-[#1f252d] px-4 py-6 text-center text-sm text-[#9ca3af]">
          Todavía no hay imágenes.
        </p>
      ) : (
        <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {images.map((image, index) => (
            <li
              key={image.id}
              className="overflow-hidden rounded-lg border border-[#39424f] bg-[#1f252d]"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={image.url}
                alt={image.alt ?? "Foto del evento"}
                className="h-40 w-full object-cover"
              />
              <div className="space-y-3 p-3">
                <div className="flex items-start justify-between gap-3">
                  <p className="min-w-0 truncate text-xs text-[#9ca3af]">
                    {image.alt ?? image.url}
                  </p>
                  {index === 0 ? (
                    <span className="shrink-0 rounded-full bg-[#a8d889]/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#d8f0c4]">
                      Portada
                    </span>
                  ) : null}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <form action={moveEventImage}>
                    <input type="hidden" name="eventId" value={eventId} />
                    <input type="hidden" name="imageId" value={image.id} />
                    <input type="hidden" name="direction" value="up" />
                    <button
                      type="submit"
                      disabled={index === 0}
                      aria-label={`Subir ${image.alt ?? "imagen"}`}
                      className="rounded border border-[#394351] px-2 py-1 text-xs font-semibold text-[#d7dce3] transition hover:bg-[#272d36] disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      ↑
                    </button>
                  </form>

                  <form action={moveEventImage}>
                    <input type="hidden" name="eventId" value={eventId} />
                    <input type="hidden" name="imageId" value={image.id} />
                    <input type="hidden" name="direction" value="down" />
                    <button
                      type="submit"
                      disabled={index === images.length - 1}
                      aria-label={`Bajar ${image.alt ?? "imagen"}`}
                      className="rounded border border-[#394351] px-2 py-1 text-xs font-semibold text-[#d7dce3] transition hover:bg-[#272d36] disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      ↓
                    </button>
                  </form>

                  {index === 0 ? null : (
                    <form action={setEventImageCover}>
                      <input type="hidden" name="eventId" value={eventId} />
                      <input type="hidden" name="imageId" value={image.id} />
                      <button
                        type="submit"
                        className="text-xs font-semibold text-[#7fd8f5] transition hover:text-[#c9effb]"
                      >
                        Definir portada
                      </button>
                    </form>
                  )}

                  <form action={removeEventImage}>
                    <input type="hidden" name="eventId" value={eventId} />
                    <input type="hidden" name="imageId" value={image.id} />
                    <button
                      type="submit"
                      className="ml-auto text-xs font-semibold text-[#f47f8a] transition hover:text-[#ffb3ba]"
                    >
                      Quitar
                    </button>
                  </form>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

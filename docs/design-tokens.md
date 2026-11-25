# Design tokens

Los colores de la marca se definen una sola vez en `app/globals.css` y se consumen de dos
maneras: como clases de Tailwind (`text-sage`, `bg-celeste/10`) en componentes y páginas, y
como constantes de TypeScript en `lib/theme/colors.ts` para imágenes OG y cualquier otro código que
no pueda usar clases. `lib/theme/colors.test.ts` verifica que ambas fuentes sigan iguales.

## Paleta oficial

Fuente: paleta oficial de Lyfter. Estos seis valores no son aproximaciones.

| Token | Hex | Uso |
| --- | --- | --- |
| `sage` | `#add195` | Color primario: botones, acentos de marca, logros |
| `celeste` | `#71ceff` | Acento tecnológico: enlaces, elementos interactivos |
| `coral` | `#e88f95` | Énfasis y alertas |
| `lilac` | `#d798e7` | Acento creativo, secundario |
| `peach` | `#ffcc8b` | Acento cálido, fondos suaves |
| `ink` | `#2d323d` | Superficies oscuras (no texto principal sobre fondo oscuro) |

## Tintas derivadas y neutros de utilidad

Estos valores son estados de UI, no reemplazos de la paleta oficial.

| Token | Hex | Uso |
| --- | --- | --- |
| `celeste-soft` | `#7fd8f5` | Hover y estados suaves de celeste |
| `coral-soft` | `#ffb3ba` | Hover y estados suaves de coral |
| `sage-soft` | `#b8e39a` | Hover y estados suaves de sage |
| `muted` | `#9ca3af` | Texto secundario y placeholders |
| `subtle` | `#d7dce3` | Texto de apoyo sobre superficies oscuras |
| `stroke` | `#39424f` | Bordes y divisores |
| `surface` | `#252c35` | Superficies elevadas |
| `surface-low` | `#1f252d` | Superficies de nivel inferior |
| `background` | `#171b21` | Fondo general de la aplicación |
| `foreground` | `#f1f1ed` | Texto principal sobre fondo oscuro |

`background` y `foreground` siguen declarados en `:root` como `--background` y
`--foreground`; el bloque `@theme inline` existente los expone como `--color-background` y
`--color-foreground` mediante `var(...)`. No se duplican sus hex en el bloque `@theme` de la
paleta.

## Mapeo token → clase → constante

| Clase Tailwind | Constante TS | Hex anterior migrado |
| --- | --- | --- |
| `text-sage`, `bg-sage/10` | `BRAND_COLORS.sage` | `#a8d889` |
| `text-celeste` | `BRAND_COLORS.celeste` | `#36bde9` |
| `text-coral` | `BRAND_COLORS.coral` | `#f47f8a` |
| `text-lilac` | `BRAND_COLORS.lilac` | `#d77bdb` |
| `text-peach` | `BRAND_COLORS.peach` | `#ffc875`, `#ffdca8` |
| `text-ink`, `bg-ink` | `BRAND_COLORS.ink` | `#272d36`, `#303743` como superficie |
| `text-celeste-soft` | `UI_COLORS["celeste-soft"]` | `#7fd8f5`, `#bfe9f8`, `#c9effb` |
| `text-coral-soft` | `UI_COLORS["coral-soft"]` | `#ffb3ba`, `#ffd1d6`, `#ff9aa3` |
| `text-sage-soft` | `UI_COLORS["sage-soft"]` | `#b8e39a`, `#c9eab2`, `#d8f0c4` |
| `text-muted` | `UI_COLORS.muted` | `#9ca3af`, `#89919e`, `#6b7280` |
| `text-subtle` | `UI_COLORS.subtle` | `#d7dce3` |
| `border-stroke`, `divide-stroke` | `UI_COLORS.stroke` | `#39424f`, `#394351`, `#303743` como borde |
| `bg-surface` | `UI_COLORS.surface` | `#252c35` |
| `bg-surface-low` | `UI_COLORS["surface-low"]` | `#1f252d` |
| `bg-background` | `UI_COLORS.background` | `#171b21` |
| `text-foreground` | `UI_COLORS.foreground` | `#f1f1ed` |

Los colores puntuales que no aparecen en esta tabla (por ejemplo `#f6c86a`, `#c98a5b`,
`#1c222a`, `#0f1317`, `#6e7683`, `#7d8794`, `#2a323c`, `#263021`/`#243020` como texto sobre
sage, o los pares de primer plano de las tarjetas OG) se mantienen literales: no son tokens de
diseño.

## Decisiones de nomenclatura y contraste

- **`sky` → `celeste`.** Tailwind ya incluye `sky-50` a `sky-950`. Crear un `sky` de marca
  dejaría dos significados distintos bajo el mismo nombre, así que el acento tecnológico se
  llama `celeste`.
- **`ink` vs `foreground`.** `ink` (`#2d323d`) es una superficie oscura; no debe usarse para
  texto sobre fondos oscuros. El texto principal sobre fondo oscuro es `foreground`
  (`#f1f1ed`). Las transiciones `hover:bg-ink` son fondos, no texto.

## Imágenes OG y prueba de deriva

`next/og` no interpreta clases de Tailwind: recibe cadenas de color en propiedades como
`color`, `backgroundColor` y `borderColor`. Esos archivos importan `BRAND_COLORS` y
`UI_COLORS` desde `lib/theme/colors.ts`. La tinta de sage al 15 % usada en las píldoras de XP
se expone como `SAGE_TINT_RGBA`, derivada de `BRAND_COLORS.sage`.

`lib/theme/colors.test.ts` lee `app/globals.css`, extrae las declaraciones
`--color-*: #hex` del bloque `@theme`, lee `--background` y `--foreground` de `:root`, y
comprueba que cada entrada de `BRAND_COLORS` y `UI_COLORS` coincida. También verifica que
`SAGE_TINT_RGBA` siga derivando de `sage`. Así, cambiar un color en CSS sin actualizar las
constantes (o al revés) rompe el test.

## Procedimiento para cambiar un color

1. Editar el hex en `app/globals.css`: el de la paleta en el bloque `@theme` plano, o el de
   `background`/`foreground` en `:root`. No tocar el bloque `@theme inline`.
2. Editar el mismo valor en `lib/theme/colors.ts` (`BRAND_COLORS` o `UI_COLORS`).
3. Si el color tiene una tinta derivada, actualizar también la definición correspondiente.
4. Ejecutar `npm test`: la prueba de deriva debe pasar antes de continuar.
5. No hace falta tocar los componentes: usan nombres de token, no hex.

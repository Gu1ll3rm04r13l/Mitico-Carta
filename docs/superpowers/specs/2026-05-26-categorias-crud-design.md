# CRUD de categorías — Diseño

**Fecha:** 2026-05-26
**Estado:** Aprobado, pendiente plan de implementación

## Problema

Las categorías de la carta están hardcodeadas en 3 lugares (`src/lib/categories.ts`,
`src/hooks/useMenu.ts` → `CATEGORY_META`, `api/_lib/menuCache.ts` → `CATEGORY_LABELS`/`CATEGORY_ORDER`)
y el tipo `MenuCategoryId` es un union cerrado. La columna `menu_items.category` es texto libre
(sin CHECK constraint), pero el panel admin solo ofrece un `<select>` cerrado. No se puede
agregar ni editar una categoría sin tocar código en múltiples archivos.

Objetivo: CRUD completo de categorías desde el panel admin (agregar, editar, borrar),
con una única fuente de verdad.

## Decisiones de comportamiento

1. **Borrar categoría con items:** flujo de reasignación. Un modal lista los productos de la
   categoría con checkboxes y un select de categoría destino. Los marcados se reasignan al
   destino; los NO marcados se eliminan; luego se borra la fila de la categoría.
2. **Editar categoría:** solo `label` + `icon`. El `key` (identidad) es inmutable.
3. **Icono:** picker predefinido (grilla curada de emojis de comida/bebida).
4. **Key al crear:** auto-derivado del label vía `toSlug()` (mismo patrón que items). Read-only.
5. Se elimina el quirk `sin-alcohol` → `bebidas`. La tabla pasa a ser fuente única;
   `MenuCategoryId` se reemplaza por `string`.

## Arquitectura

Fuente única de verdad: nueva tabla `categories` en Supabase. Frontend (público + admin) y
server (bot) la leen. Escrituras solo desde el panel admin (RLS authenticated).

### Base de datos

Nueva tabla `public.categories`:

| columna | tipo | notas |
|---|---|---|
| `key` | text | PK (slug) |
| `label` | text | NOT NULL |
| `icon` | text | NOT NULL (emoji) |
| `sort_order` | int | NOT NULL DEFAULT 0 |
| `created_at` | timestamptz | DEFAULT now() |
| `updated_at` | timestamptz | DEFAULT now() |

- **RLS:** anon `SELECT`; authenticated acceso total. Espeja las políticas de `menu_items`.
- **Seed:** insertar las 11 categorías actuales con su `sort_order` (orden de `CATEGORY_META`):
  entradas, cervezas, cocteles, vinos, sin-alcohol, pizzas, postres, sandwiches, panchos,
  empanadas, ensaladas. Labels e iconos desde `CATEGORY_META`.
- **FK:** `menu_items.category` → `categories.key`, `ON DELETE RESTRICT ON UPDATE CASCADE`.
  Garantiza integridad: no se puede borrar una categoría con items referenciándola hasta
  reasignar/eliminar (complementa el flujo de UI). Requiere que todos los `category` actuales
  existan en la tabla seed (se cumple).

### Frontend

- **`useCategories()`** (nuevo hook, lectura pública): fetch de `categories` ordenado por
  `sort_order`. Reemplaza el `CATEGORY_META` hardcodeado.
- **`useMenu()`**: lee `categories` + `menu_items`, agrupa por el orden de la tabla. Sin hardcode.
- **`useAdminMenu()`**: agrega operaciones de categoría:
  - `insertCategory(label, icon)` — key auto-slug, sort_order = max+1
  - `updateCategory(key, { label, icon })` — solo label/icono
  - `deleteCategoryWithReassign(key, { reassignIds, targetKey })` — UPDATE category de los
    reasignados al `targetKey`, DELETE de los items no reasignados, luego DELETE de la categoría.
  - Se reemplaza el `deleteCategory` actual (que borra todo sin preguntar).
- **`src/lib/categories.ts`**: pasa de labels hardcodeados a un set curado de emojis para el
  picker (`CATEGORY_ICON_CHOICES`).
- **Tipos** (`src/types/index.ts`): `MenuCategoryId` → `string`. Ajustar `MenuCategory.id`.
- **UI admin:**
  - Sección "Categorías" en `AdminPanel`: lista (icono, label, # items) con botones agregar /
    editar / borrar.
  - **`CategoryFormModal.tsx`** (nuevo): crear/editar. Input label + emoji picker. Al crear,
    muestra el key derivado (read-only). Al editar, key bloqueado.
  - **`DeleteCategoryModal.tsx`** (nuevo): lista items de la categoría con checkboxes
    (marcado = reasignar), select de categoría destino. Aviso de que los no marcados se borran.
  - **`ItemFormModal`**: el `<select>` de categoría se llena dinámico desde `useCategories`
    (no más lista fija).

### Server

- **`api/_lib/menuCache.ts`**: `getMenu()` además de `menu_items` lee la tabla `categories`
  para obtener label + orden. Saca el hardcode `CATEGORY_LABELS` / `CATEGORY_ORDER`. El bot ve
  categorías nuevas dentro del TTL de 60s.
- **`api/_lib/buildPrompt.ts`**: sin cambios estructurales (ya consume `ServerMenuCategory` con
  label provisto por `menuCache`).

## Flujo de datos

- **Lectura:** tabla `categories` → `useMenu` / `useCategories` (front) y `getMenu` (server bot).
- **Escritura:** solo panel admin → `useAdminMenu` → tabla `categories` (+ `menu_items` en el
  flujo de borrado con reasignación).

## Manejo de errores

- Crear con key duplicado (slug colisiona): el PK lo rechaza; mostrar error legible
  ("Ya existe una categoría con ese nombre").
- Borrar: el orden de operaciones (reasignar → borrar items → borrar categoría) respeta el FK
  RESTRICT. Si algún paso falla, se aborta y se refetchea estado real (patrón actual de
  `useAdminMenu`).
- Label/icono vacíos: validación en el form modal antes de enviar.

## Testing

No hay tests configurados en el repo. Verificación manual:
1. Crear categoría nueva → aparece en tabs del menú público y en el `<select>` de items.
2. Asignar un item a la categoría nueva → se ve en la carta.
3. Editar label/icono → se refleja en front y (tras 60s) en el bot.
4. Borrar categoría con items → reasignar unos, eliminar otros, categoría desaparece.
5. Bot (`/api/chat`): mencionar productos de la categoría nueva → los reconoce.

## Fuera de alcance (YAGNI)

- Reordenar categorías por drag-and-drop (el `sort_order` existe; UI de reorden queda para después).
- Editar el `key` de una categoría existente.
- Picker de emojis libre / búsqueda de emojis (solo set curado).

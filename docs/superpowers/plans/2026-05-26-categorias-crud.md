# CRUD de Categorías — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Permitir agregar, editar y borrar categorías de la carta desde el panel admin, con la tabla `categories` de Supabase como fuente única de verdad.

**Architecture:** Nueva tabla `public.categories` (key, label, icon, sort_order) con RLS y FK desde `menu_items.category`. Frontend público (`useMenu`), server del bot (`menuCache`) y panel admin (`useAdminMenu`) leen categorías de la DB en vez de listas hardcodeadas. El admin hace CRUD contra la tabla; borrar usa un flujo de reasignación de items.

**Tech Stack:** React 19 + TypeScript, Supabase (PostgreSQL + RLS), Tailwind v4, Vite. Sin test runner configurado — la verificación es `npm run build` (type-check), `npm run lint`, checks SQL vía Supabase, y prueba manual en `npm run dev:all`.

**Nota de proceso:** No hay framework de tests en el repo (CLAUDE.md: "There are no tests configured yet"). Los pasos de verificación usan build/lint + checks manuales en lugar de tests unitarios. Commits frecuentes por tarea.

---

## File Structure

**Crear:**
- `src/components/admin/CategoryFormModal.tsx` — modal crear/editar categoría (label + emoji picker)
- `src/components/admin/CategoryDeleteModal.tsx` — modal borrar con reasignación de items

**Modificar:**
- `src/types/index.ts` — agregar `Category`, reemplazar `MenuCategoryId` por `string`
- `src/lib/categories.ts` — pasa de labels hardcodeados a set de emojis del picker
- `src/hooks/useMenu.ts` — lee categorías de la DB (saca `CATEGORY_META`)
- `src/hooks/useAdminMenu.ts` — fetch de categorías + ops CRUD de categoría
- `src/components/admin/ItemFormModal.tsx` — `<select>` dinámico vía prop
- `src/components/admin/BulkPriceModal.tsx` — recibe categorías por prop
- `src/components/admin/ImportExportBar.tsx` — pasa keys de categoría a Excel
- `src/lib/menuExcel.ts` — `toXlsx` recibe `categoryKeys` por parámetro
- `src/components/admin/AdminPanel.tsx` — cablea sección categorías + modales
- `api/_lib/menuCache.ts` — lee labels/orden de la tabla `categories`
- `docs` (CLAUDE.md, README.md) — documentar tabla `categories`

**Borrar (código muerto al final):** referencias a `CATEGORY_LABELS` y `MenuCategoryId`.

---

## Task 1: Migración DB — tabla `categories`, RLS, seed, FK

**Files:**
- Ejecutar SQL vía Supabase (MCP `apply_migration` con name `create_categories_table`, o SQL editor del proyecto `ltusdzhggabmbilrjuju`).

- [ ] **Step 1: Aplicar la migración**

```sql
-- Tabla categorías
create table public.categories (
  key         text primary key,
  label       text not null,
  icon        text not null,
  sort_order  int  not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table public.categories enable row level security;

-- RLS: espeja menu_items (anon lee todo, authenticated full)
create policy "public_read" on public.categories
  for select to anon using (true);

create policy "owner_full_access" on public.categories
  for all to authenticated using (true) with check (true);

-- Seed: 11 categorías actuales en orden
insert into public.categories (key, label, icon, sort_order) values
  ('entradas',    'Entradas',    '🧀', 0),
  ('cervezas',    'Cervezas',    '🍺', 1),
  ('cocteles',    'Cócteles',    '🍸', 2),
  ('vinos',       'Vinos',       '🍷', 3),
  ('sin-alcohol', 'Sin Alcohol', '🥤', 4),
  ('pizzas',      'Pizzas',      '🍕', 5),
  ('postres',     'Postres',     '🍮', 6),
  ('sandwiches',  'Sandwiches',  '🥪', 7),
  ('panchos',     'Panchos',     '🌭', 8),
  ('empanadas',   'Empanadas',   '🥟', 9),
  ('ensaladas',   'Ensaladas',   '🥗', 10);

-- FK de integridad: no borrar categoría con items
alter table public.menu_items
  add constraint menu_items_category_fkey
  foreign key (category) references public.categories(key)
  on update cascade on delete restrict;
```

- [ ] **Step 2: Verificar tabla + seed + FK**

Ejecutar:
```sql
select count(*) as cats from public.categories;
select conname from pg_constraint where conname = 'menu_items_category_fkey';
select count(*) as items_huerfanos from public.menu_items m
  left join public.categories c on c.key = m.category where c.key is null;
```
Esperado: `cats = 11`, una fila `menu_items_category_fkey`, `items_huerfanos = 0`.

- [ ] **Step 3: Commit (no aplica — cambio solo en DB)**

La migración vive en Supabase. Anotar en el commit de la Task 2 que la DB ya fue migrada. Continuar.

---

## Task 2: Tipos — `Category` + `MenuCategoryId` → `string`

**Files:**
- Modify: `src/types/index.ts`

- [ ] **Step 1: Reemplazar el union `MenuCategoryId` y agregar `Category`**

En `src/types/index.ts`, borrar el bloque `export type MenuCategoryId = ...` (líneas 17-28) y reemplazar por:

```ts
/** key de categoría (slug). Antes era un union cerrado; ahora la fuente es la tabla `categories`. */
export type MenuCategoryId = string

/** Fila de la tabla `categories` (fuente única de las categorías de la carta). */
export interface Category {
  key: string
  label: string
  icon: string
  sort_order: number
}
```

`MenuCategory` (que usa `id: MenuCategoryId`) queda igual — ahora `id` es `string`.

- [ ] **Step 2: Type-check**

Run: `npm run build`
Esperado: compila sin errores nuevos de tipos en `types/index.ts`. (Pueden quedar errores en consumidores que tocamos en tareas siguientes; si aparecen solo por `MenuCategoryId`, son esperados y se resuelven luego. Los errores preexistentes de `*.MP4` se ignoran.)

- [ ] **Step 3: Commit**

```bash
git add src/types/index.ts
git commit -m "feat(types): Category type + MenuCategoryId pasa a string (DB-IZA categorias)"
```

---

## Task 3: `categories.ts` → set de emojis del picker

**Files:**
- Modify: `src/lib/categories.ts`

`CATEGORY_LABELS` deja de ser fuente de labels (ahora viene de la DB). El archivo pasa a exportar el set de emojis para el picker y un icono fallback.

- [ ] **Step 1: Reescribir `src/lib/categories.ts`**

```ts
// Set de emojis para el picker de categorías del panel admin.
// Las categorías reales (label/icon/orden) viven en la tabla `categories` de Supabase.

/** Emojis sugeridos para iconos de categoría (comida/bebida). */
export const CATEGORY_ICON_CHOICES: string[] = [
  '🧀', '🍕', '🥪', '🌭', '🥟', '🥗', '🍔', '🍟', '🌮', '🌯',
  '🍝', '🍜', '🍲', '🥘', '🍤', '🍣', '🥩', '🍗', '🥓', '🍳',
  '🍮', '🍰', '🍦', '🍩', '🍪', '🍫', '🧁', '🥧',
  '🍺', '🍷', '🍸', '🍹', '🍻', '🥂', '🥃', '🍾', '🥤', '🧃',
  '☕', '🧉', '🫖', '💧',
]

/** Icono por defecto cuando una categoría no tiene uno o es desconocida. */
export const FALLBACK_CATEGORY_ICON = '🍽️'
```

- [ ] **Step 2: Type-check**

Run: `npm run build`
Esperado: errores SOLO en archivos que aún importan `CATEGORY_LABELS` (useMenu, AdminPanel, BulkPriceModal, menuExcel). Son esperados; se resuelven en sus tareas. No debe haber error dentro de `categories.ts`.

- [ ] **Step 3: Commit**

```bash
git add src/lib/categories.ts
git commit -m "feat(admin): categories.ts pasa a set de emojis del picker"
```

---

## Task 4: `useMenu` lee categorías de la DB

**Files:**
- Modify: `src/hooks/useMenu.ts`

- [ ] **Step 1: Reescribir `src/hooks/useMenu.ts`**

```ts
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { MenuCategory, DietaryTag } from '../types'

interface SupabaseRow {
  id: string
  slug: string
  name: string
  description: string | null
  price: number
  category: string
  sort_order: number
  is_signature: boolean
  tags: string[]
}

interface CategoryRow {
  key: string
  label: string
  icon: string
  sort_order: number
}

export function useMenu() {
  const [categories, setCategories] = useState<MenuCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchMenu() {
      const [catRes, itemRes] = await Promise.all([
        supabase
          .from('categories')
          .select('key, label, icon, sort_order')
          .order('sort_order'),
        supabase
          .from('menu_items')
          .select('id, slug, name, description, price, category, sort_order, is_signature, tags')
          .eq('available', true)
          .order('sort_order'),
      ])

      if (catRes.error) { setError(catRes.error.message); setLoading(false); return }
      if (itemRes.error) { setError(itemRes.error.message); setLoading(false); return }

      const grouped = new Map<string, SupabaseRow[]>()
      for (const row of itemRes.data as SupabaseRow[]) {
        const list = grouped.get(row.category) ?? []
        list.push(row)
        grouped.set(row.category, list)
      }

      const result: MenuCategory[] = (catRes.data as CategoryRow[])
        .filter(cat => grouped.has(cat.key))
        .map(cat => ({
          id: cat.key,
          label: cat.label,
          icon: cat.icon,
          items: (grouped.get(cat.key) ?? []).map(row => ({
            id: row.slug,
            name: row.name,
            description: row.description ?? '',
            price: row.price,
            isSignature: row.is_signature,
            tags: row.tags as DietaryTag[],
          })),
        }))

      setCategories(result)
      setLoading(false)
    }

    fetchMenu()
  }, [])

  return { categories, loading, error }
}
```

- [ ] **Step 2: Type-check**

Run: `npm run build`
Esperado: `useMenu.ts` compila. `Menu.tsx` (consumidor) ya usa `categories[].id/label/icon/items` dinámico — no requiere cambios.

- [ ] **Step 3: Verificación manual (carta pública)**

Run: `npm run dev:all` y abrir http://localhost:5173 → sección menú.
Esperado: tabs y productos se ven igual que antes (mismas 11 categorías, mismo orden).

- [ ] **Step 4: Commit**

```bash
git add src/hooks/useMenu.ts
git commit -m "feat(menu): useMenu lee categorias desde la tabla categories"
```

---

## Task 5: Server `menuCache` lee labels/orden de la DB

**Files:**
- Modify: `api/_lib/menuCache.ts`

- [ ] **Step 1: Reescribir `fetchMenuFromDb` para usar la tabla `categories`**

Reemplazar en `api/_lib/menuCache.ts` el bloque `CATEGORY_LABELS` + `CATEGORY_ORDER` (líneas 16-30) y la función `fetchMenuFromDb` (líneas 38-66) por:

```ts
async function fetchMenuFromDb(): Promise<ServerMenuCategory[]> {
  const [catRes, itemRes] = await Promise.all([
    supabaseServer
      .from('categories')
      .select('key, label, sort_order')
      .order('sort_order'),
    supabaseServer
      .from('menu_items')
      .select('name, description, price, category, sort_order, is_signature')
      .eq('available', true)
      .order('sort_order'),
  ])

  if (catRes.error) throw new Error(`[menuCache] Supabase categories: ${catRes.error.message}`)
  if (itemRes.error) throw new Error(`[menuCache] Supabase items: ${itemRes.error.message}`)

  const grouped = new Map<string, ServerMenuItem[]>()
  for (const row of itemRes.data ?? []) {
    const list = grouped.get(row.category) ?? []
    list.push({
      name: row.name,
      description: row.description,
      price: row.price,
      is_signature: row.is_signature,
    })
    grouped.set(row.category, list)
  }

  return (catRes.data ?? [])
    .filter(cat => grouped.has(cat.key))
    .map(cat => ({
      key: cat.key,
      label: cat.label,
      items: grouped.get(cat.key) ?? [],
    }))
}
```

Dejar intactos: las interfaces `ServerMenuItem`/`ServerMenuCategory`, el cache TTL, `getMenu()`, `invalidateMenuCache()`.

- [ ] **Step 2: Verificar resolución de módulos (server)**

Run: `npx tsx -e "import('./api/_lib/menuCache.ts').then(()=>console.log('menuCache OK')).catch(e=>console.log('FAIL', e.message))"`
Esperado: imprime `menuCache OK` (el error de env vars de supabase NO aparece acá porque el import de menuCache no instancia el cliente hasta llamarse; si apareciera el throw de supabase, es por falta de dotenv en `-e` y es benigno — basta con que no haya error de sintaxis/import).

- [ ] **Step 3: Verificación manual (bot)**

Con `npm run dev:all` corriendo, abrir el chat en la landing y preguntar "qué pizzas tienen". 
Esperado: responde con pizzas reales y precios. (El bot lee categorías de la DB.)

- [ ] **Step 4: Commit**

```bash
git add api/_lib/menuCache.ts
git commit -m "feat(api): menuCache lee labels/orden desde tabla categories"
```

---

## Task 6: `useAdminMenu` — fetch de categorías + CRUD

**Files:**
- Modify: `src/hooks/useAdminMenu.ts`

- [ ] **Step 1: Agregar import de `Category` y estado de categorías**

En `src/hooks/useAdminMenu.ts` línea 3, cambiar el import de tipos:

```ts
import type { AdminMenuItem, AdminMenuItemInput, Category } from '../types'
```

Dentro de `useAdminMenu()`, junto a los otros `useState` (después de línea 36), agregar:

```ts
  const [categories, setCategories] = useState<Category[]>([])
```

- [ ] **Step 2: Que `fetchAll` traiga también categorías**

Reemplazar la función `fetchAll` (líneas 48-63) por:

```ts
  async function fetchAll() {
    setLoading(true)
    setError(null)
    const [catRes, itemRes] = await Promise.all([
      supabase
        .from('categories')
        .select('key, label, icon, sort_order')
        .order('sort_order'),
      supabase
        .from('menu_items')
        .select('id, slug, name, description, price, category, sort_order, available, is_signature, tags, image_url')
        .order('category')
        .order('sort_order'),
    ])

    if (catRes.error) setError(catRes.error.message)
    else setCategories(catRes.data as Category[])

    if (itemRes.error) setError(itemRes.error.message)
    else setItems(itemRes.data as AdminMenuItem[])

    setLoading(false)
  }
```

- [ ] **Step 3: Reemplazar `deleteCategory` por las 3 ops de categoría**

Reemplazar la función `deleteCategory` (líneas 142-152) por:

```ts
  /** Crea una categoría nueva. key auto-derivado del label; sort_order = max+1. */
  async function insertCategory(label: string, icon: string): Promise<void> {
    setMutating(true)
    try {
      const key = toSlug(label)
      if (!key) throw new Error('El nombre de la categoría no es válido.')
      const maxOrder = categories.reduce((m, c) => Math.max(m, c.sort_order), -1)
      const { error } = await supabase
        .from('categories')
        .insert({ key, label, icon, sort_order: maxOrder + 1 })
      if (error) {
        throw new Error(error.code === '23505'
          ? 'Ya existe una categoría con ese nombre.'
          : error.message)
      }
      await fetchAll()
    } finally {
      setMutating(false)
    }
  }

  /** Edita label e icono de una categoría (el key es inmutable). */
  async function updateCategory(key: string, patch: { label: string; icon: string }): Promise<void> {
    setMutating(true)
    try {
      const { error } = await supabase
        .from('categories')
        .update({ ...patch, updated_at: new Date().toISOString() })
        .eq('key', key)
      if (error) throw new Error(error.message)
      await fetchAll()
    } finally {
      setMutating(false)
    }
  }

  /**
   * Borra una categoría. Los items en `reassignIds` se mueven a `targetKey`;
   * el resto de items de la categoría se eliminan; luego se borra la fila de la categoría.
   * El orden respeta el FK ON DELETE RESTRICT.
   */
  async function deleteCategoryWithReassign(
    key: string,
    opts: { reassignIds: string[]; targetKey: string | null },
  ): Promise<void> {
    setMutating(true)
    try {
      const { reassignIds, targetKey } = opts
      if (reassignIds.length > 0) {
        if (!targetKey) throw new Error('Elegí una categoría destino para los productos a conservar.')
        await runInChunks(reassignIds, 20, id =>
          supabase
            .from('menu_items')
            .update({ category: targetKey, updated_at: new Date().toISOString() })
            .eq('id', id),
        )
      }
      // Borra los items que quedaron en esta categoría (los no reasignados).
      const { error: delItemsErr } = await supabase.from('menu_items').delete().eq('category', key)
      if (delItemsErr) throw new Error(delItemsErr.message)
      // Ahora sí, borra la categoría (FK satisfecho).
      const { error: delCatErr } = await supabase.from('categories').delete().eq('key', key)
      if (delCatErr) throw new Error(delCatErr.message)
      await fetchAll()
    } finally {
      setMutating(false)
    }
  }
```

- [ ] **Step 4: Exportar lo nuevo y quitar `deleteCategory`**

En el `return` del hook (líneas 195-209), reemplazar `categories`/ops:

```ts
  return {
    grouped,
    categories,
    allItems: items,
    loading,
    mutating,
    error,
    toggleAvailable,
    insertItem,
    updateItem,
    deleteItem,
    insertCategory,
    updateCategory,
    deleteCategoryWithReassign,
    bulkUpdatePrices,
    bulkImport,
    refetch: fetchAll,
  }
```

- [ ] **Step 5: Type-check**

Run: `npm run build`
Esperado: `useAdminMenu.ts` compila. Error esperado en `AdminPanel.tsx` (usa el viejo `deleteCategory`) — se arregla en Task 11.

- [ ] **Step 6: Commit**

```bash
git add src/hooks/useAdminMenu.ts
git commit -m "feat(admin): useAdminMenu trae categorias + insert/update/deleteWithReassign"
```

---

## Task 7: `ItemFormModal` — `<select>` dinámico

**Files:**
- Modify: `src/components/admin/ItemFormModal.tsx`

- [ ] **Step 1: Borrar la lista hardcodeada `CATEGORIES` y recibir categorías por prop**

En `src/components/admin/ItemFormModal.tsx`:

Borrar el bloque `const CATEGORIES = [...]` (líneas 5-17).

Cambiar el import de tipos (línea 3):
```ts
import type { AdminMenuItem, AdminMenuItemInput, Category } from '../../types'
```

Cambiar `EMPTY_FORM` (líneas 19-29) para no fijar categoría (se setea desde props):
```ts
const EMPTY_FORM: Omit<AdminMenuItemInput, 'category'> = {
  name: '',
  description: null,
  price: 0,
  sort_order: 0,
  available: true,
  is_signature: false,
  tags: [],
  image_url: null,
}
```

- [ ] **Step 2: Extender Props y usar la primera categoría como default al crear**

Reemplazar la interface `Props` (líneas 45-50) y el inicio del componente / `useState` del form (líneas 52-67) por:

```ts
interface Props {
  item?: AdminMenuItem | null
  categories: Category[]
  saving: boolean
  onSave: (input: AdminMenuItemInput, imageFile?: File) => Promise<void>
  onClose: () => void
}

export default function ItemFormModal({ item, categories, saving, onSave, onClose }: Props) {
  const [form, setForm] = useState<AdminMenuItemInput>(
    item
      ? {
          name: item.name,
          description: item.description,
          price: item.price,
          category: item.category,
          sort_order: item.sort_order,
          available: item.available,
          is_signature: item.is_signature,
          tags: item.tags ?? [],
          image_url: item.image_url,
        }
      : { ...EMPTY_FORM, category: categories[0]?.key ?? '' },
  )
```

- [ ] **Step 3: Poblar el `<select>` desde `categories`**

Reemplazar el `.map` del `<select>` (líneas 198-202) por:

```tsx
                {categories.map(c => (
                  <option key={c.key} value={c.key} className="bg-[#1A1A1A]">
                    {c.icon} {c.label}
                  </option>
                ))}
```

- [ ] **Step 4: Type-check**

Run: `npm run build`
Esperado: `ItemFormModal.tsx` compila. Error esperado en `AdminPanel.tsx` (todavía no pasa la prop `categories`) — se arregla en Task 11.

- [ ] **Step 5: Commit**

```bash
git add src/components/admin/ItemFormModal.tsx
git commit -m "feat(admin): ItemFormModal usa categorias dinamicas por prop"
```

---

## Task 8: `CategoryFormModal` (crear/editar)

**Files:**
- Create: `src/components/admin/CategoryFormModal.tsx`

- [ ] **Step 1: Crear el modal**

```tsx
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { CATEGORY_ICON_CHOICES } from '../../lib/categories'
import { toSlug } from '../../lib/slug'
import type { Category } from '../../types'

interface Props {
  /** null = crear, Category = editar */
  category: Category | null
  saving: boolean
  onSave: (label: string, icon: string) => Promise<void>
  onClose: () => void
}

export default function CategoryFormModal({ category, saving, onSave, onClose }: Props) {
  const isEdit = Boolean(category)
  const [label, setLabel] = useState(category?.label ?? '')
  const [icon, setIcon] = useState(category?.icon ?? CATEGORY_ICON_CHOICES[0])
  const [formError, setFormError] = useState<string | null>(null)
  const overlayRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const derivedKey = isEdit ? category!.key : toSlug(label)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFormError(null)
    if (!label.trim()) {
      setFormError('El nombre es obligatorio.')
      return
    }
    if (!isEdit && !derivedKey) {
      setFormError('El nombre no genera un identificador válido.')
      return
    }
    try {
      await onSave(label.trim(), icon)
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Error al guardar.')
    }
  }

  return createPortal(
    <div
      ref={overlayRef}
      onClick={e => { if (e.target === overlayRef.current) onClose() }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
    >
      <div className="w-full max-w-md bg-bg-card rounded-2xl border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[90dvh]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/8 shrink-0">
          <h2 className="font-heading text-2xl text-cream tracking-wider">
            {isEdit ? 'Editar categoría' : 'Nueva categoría'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-muted hover:text-cream transition-colors p-1 rounded-lg hover:bg-white/5"
            aria-label="Cerrar"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 px-5 py-5 flex flex-col gap-4">
          {/* Nombre */}
          <div>
            <label className="block text-muted text-xs font-body mb-1.5 uppercase tracking-wider">Nombre *</label>
            <input
              type="text"
              value={label}
              onChange={e => setLabel(e.target.value)}
              placeholder="Ej: Tragos sin alcohol"
              autoFocus
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-cream text-sm font-body placeholder:text-muted focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/30 transition-colors"
            />
            {!isEdit && (
              <p className="text-muted text-xs mt-1.5">
                Identificador: <span className="text-cream font-mono">{derivedKey || '—'}</span>
              </p>
            )}
          </div>

          {/* Picker de icono */}
          <div>
            <label className="block text-muted text-xs font-body mb-1.5 uppercase tracking-wider">Icono</label>
            <div className="grid grid-cols-8 gap-1.5">
              {CATEGORY_ICON_CHOICES.map(choice => (
                <button
                  key={choice}
                  type="button"
                  onClick={() => setIcon(choice)}
                  className={[
                    'aspect-square rounded-lg text-lg flex items-center justify-center transition-colors border',
                    icon === choice
                      ? 'bg-accent/15 border-accent/60'
                      : 'bg-white/5 border-white/10 hover:bg-white/10',
                  ].join(' ')}
                  aria-label={`Icono ${choice}`}
                  aria-pressed={icon === choice}
                >
                  {choice}
                </button>
              ))}
            </div>
          </div>

          {formError && (
            <p className="text-red-400 text-sm font-body">{formError}</p>
          )}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="flex-1 px-4 py-2.5 rounded-xl border border-white/10 text-muted hover:text-cream text-sm font-body transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-2.5 rounded-xl bg-accent hover:bg-accent/90 text-white text-sm font-body transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <span className="inline-block w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Guardando…
                </>
              ) : (
                isEdit ? 'Guardar' : 'Crear categoría'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  )
}
```

- [ ] **Step 2: Extraer `toSlug` a un módulo compartido `src/lib/slug.ts`**

`toSlug` hoy es privado en `useAdminMenu.ts`. Para reusarlo en el modal, crear `src/lib/slug.ts`:

```ts
/** Convierte un texto a slug ASCII: minúsculas, sin acentos, guiones. */
export function toSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .trim()
}
```

Luego en `src/hooks/useAdminMenu.ts`: borrar la función local `toSlug` (líneas 21-30) y agregar el import arriba:
```ts
import { toSlug } from '../lib/slug'
```

- [ ] **Step 3: Type-check**

Run: `npm run build`
Esperado: `CategoryFormModal.tsx`, `slug.ts`, `useAdminMenu.ts` compilan. Error esperado solo en `AdminPanel.tsx` (aún no monta el modal).

- [ ] **Step 4: Commit**

```bash
git add src/components/admin/CategoryFormModal.tsx src/lib/slug.ts src/hooks/useAdminMenu.ts
git commit -m "feat(admin): CategoryFormModal (crear/editar) + extrae toSlug a lib/slug"
```

---

## Task 9: `CategoryDeleteModal` (reasignar + borrar)

**Files:**
- Create: `src/components/admin/CategoryDeleteModal.tsx`

- [ ] **Step 1: Crear el modal de borrado con reasignación**

```tsx
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { AdminMenuItem, Category } from '../../types'

interface Props {
  category: Category
  items: AdminMenuItem[]
  /** Otras categorías a las que se puede reasignar (excluye la actual). */
  otherCategories: Category[]
  deleting: boolean
  onConfirm: (reassignIds: string[], targetKey: string | null) => Promise<void>
  onCancel: () => void
}

export default function CategoryDeleteModal({
  category,
  items,
  otherCategories,
  deleting,
  onConfirm,
  onCancel,
}: Props) {
  // Por defecto: ningún item marcado → todos se borran. El usuario marca los que quiere conservar.
  const [reassignIds, setReassignIds] = useState<string[]>([])
  const [targetKey, setTargetKey] = useState<string>(otherCategories[0]?.key ?? '')
  const [formError, setFormError] = useState<string | null>(null)
  const overlayRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onCancel()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onCancel])

  function toggle(id: string) {
    setReassignIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id],
    )
  }

  const reassignCount = reassignIds.length
  const deleteCount = items.length - reassignCount
  const needsTarget = reassignCount > 0

  async function handleConfirm() {
    setFormError(null)
    if (needsTarget && !targetKey) {
      setFormError('Elegí una categoría destino para los productos marcados.')
      return
    }
    try {
      await onConfirm(reassignIds, needsTarget ? targetKey : null)
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Error al borrar.')
    }
  }

  return createPortal(
    <div
      ref={overlayRef}
      onClick={e => { if (e.target === overlayRef.current) onCancel() }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
    >
      <div className="w-full max-w-md bg-bg-card rounded-2xl border border-white/10 shadow-2xl flex flex-col max-h-[90dvh]">
        <div className="p-6 pb-4 border-b border-white/5">
          <h3 className="font-heading text-2xl text-cream tracking-wide mb-1">
            Eliminar categoría {category.icon} {category.label}
          </h3>
          <p className="text-muted text-sm font-body leading-relaxed">
            Marcá los productos que querés <span className="text-cream">conservar</span> (se mueven a otra categoría).
            Los no marcados se <span className="text-red-400">eliminan</span>.
          </p>
        </div>

        {items.length === 0 ? (
          <div className="px-6 py-4">
            <p className="text-muted text-sm">Esta categoría no tiene productos. Se eliminará directamente.</p>
          </div>
        ) : (
          <div className="px-6 py-3 overflow-y-auto">
            {/* Destino */}
            <div className="flex items-center gap-2 mb-3">
              <span className="text-muted text-xs uppercase tracking-wider">Mover marcados a:</span>
              <select
                value={targetKey}
                onChange={e => setTargetKey(e.target.value)}
                disabled={otherCategories.length === 0}
                className="flex-1 bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-cream text-sm font-body focus:outline-none focus:border-accent/50 cursor-pointer disabled:opacity-50"
              >
                {otherCategories.length === 0 ? (
                  <option value="">No hay otras categorías</option>
                ) : (
                  otherCategories.map(c => (
                    <option key={c.key} value={c.key} className="bg-[#1A1A1A]">
                      {c.icon} {c.label}
                    </option>
                  ))
                )}
              </select>
            </div>

            {/* Lista de items */}
            <div className="bg-white/5 rounded-xl border border-white/10 max-h-56 overflow-y-auto divide-y divide-white/5">
              {items.map(item => {
                const keep = reassignIds.includes(item.id)
                return (
                  <label
                    key={item.id}
                    className="flex items-center gap-3 px-3 py-2 text-sm cursor-pointer hover:bg-white/5"
                  >
                    <input
                      type="checkbox"
                      checked={keep}
                      onChange={() => toggle(item.id)}
                      className="accent-accent w-4 h-4"
                    />
                    <span className="text-cream truncate flex-1">{item.name}</span>
                    <span className={keep ? 'text-accent text-xs shrink-0' : 'text-red-400 text-xs shrink-0'}>
                      {keep ? 'conservar' : 'borrar'}
                    </span>
                  </label>
                )
              })}
            </div>

            <p className="text-muted text-xs mt-3">
              {reassignCount} a conservar · <span className="text-red-400">{deleteCount} a borrar</span>
            </p>
          </div>
        )}

        {formError && (
          <p className="px-6 text-red-400 text-sm font-body">{formError}</p>
        )}

        <div className="p-6 pt-4 border-t border-white/5 flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={deleting}
            className="flex-1 px-4 py-2.5 rounded-xl border border-white/10 text-muted hover:text-cream text-sm font-body transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={deleting || (needsTarget && otherCategories.length === 0)}
            className="flex-1 px-4 py-2.5 rounded-xl bg-red-500/80 hover:bg-red-500 text-white text-sm font-body transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {deleting ? (
              <>
                <span className="inline-block w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Eliminando…
              </>
            ) : (
              'Eliminar categoría'
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
```

- [ ] **Step 2: Type-check**

Run: `npm run build`
Esperado: `CategoryDeleteModal.tsx` compila. Error esperado solo en `AdminPanel.tsx`.

- [ ] **Step 3: Commit**

```bash
git add src/components/admin/CategoryDeleteModal.tsx
git commit -m "feat(admin): CategoryDeleteModal con reasignacion de items"
```

---

## Task 10: `BulkPriceModal` + `menuExcel` sin hardcode

**Files:**
- Modify: `src/components/admin/BulkPriceModal.tsx`
- Modify: `src/lib/menuExcel.ts`
- Modify: `src/components/admin/ImportExportBar.tsx`

- [ ] **Step 1: `BulkPriceModal` recibe `categories` por prop**

En `src/components/admin/BulkPriceModal.tsx`:

Borrar el import `import { CATEGORY_LABELS } from '../../lib/categories'` (línea 2) y cambiar el import de tipos (línea 4):
```ts
import type { AdminMenuItem, Category } from '../../types'
```

Extender props del componente (líneas 12-22):
```ts
export default function BulkPriceModal({
  items,
  categories,
  saving,
  onApply,
  onClose,
}: {
  items: AdminMenuItem[]
  categories: Category[]
  saving: boolean
  onApply: (updates: { id: string; price: number }[]) => Promise<void>
  onClose: () => void
}) {
```

Reemplazar `presentCategories` (líneas 27-30) por una versión basada en la prop:
```ts
  // Categorías presentes en la carta, en el orden de la tabla.
  const presentCategories = useMemo(
    () => categories.filter(c => items.some(i => i.category === c.key)).map(c => c.key),
    [categories, items],
  )
  const catMeta = useMemo(
    () => Object.fromEntries(categories.map(c => [c.key, c])) as Record<string, Category>,
    [categories],
  )
```

Reemplazar el uso de `CATEGORY_LABELS[cat]` en el render (líneas 134-151) — cambiar `const meta = CATEGORY_LABELS[cat]` por `const meta = catMeta[cat]`. El resto (`meta?.icon`, `meta?.label`) queda igual (Category tiene `icon` y `label`).

- [ ] **Step 2: `menuExcel.toXlsx` recibe `categoryKeys`**

En `src/lib/menuExcel.ts`:

Borrar `import { CATEGORY_LABELS } from './categories'` (línea 7) y la línea `const CATEGORY_KEYS = Object.keys(CATEGORY_LABELS)` (línea 15).

Cambiar la firma de `toXlsx` (línea 42):
```ts
export async function toXlsx(items: AdminMenuItem[], categoryKeys: string[]): Promise<Blob> {
```

Dentro de `toXlsx`, en la data validation de categoría (línea 98), usar el parámetro:
```ts
      formulae: [`"${categoryKeys.join(',')}"`],
```

- [ ] **Step 3: `ImportExportBar` pasa los keys a `toXlsx`**

En `src/components/admin/ImportExportBar.tsx`:

Cambiar el import de tipos (línea 4):
```ts
import type { AdminMenuItem, AdminMenuItemInput, Category } from '../../types'
```

Extender props (líneas 6-14):
```ts
export default function ImportExportBar({
  items,
  categories,
  saving,
  onImport,
}: {
  items: AdminMenuItem[]
  categories: Category[]
  saving: boolean
  onImport: (rows: { id: string; input: Partial<AdminMenuItemInput> }[]) => Promise<void>
}) {
```

En `handleExport`, pasar los keys (línea 23):
```ts
      const blob = await toXlsx(items, categories.map(c => c.key))
```

- [ ] **Step 4: Type-check**

Run: `npm run build`
Esperado: estos 3 archivos compilan. Error esperado solo en `AdminPanel.tsx` (aún no pasa las props nuevas) — Task 11.

- [ ] **Step 5: Commit**

```bash
git add src/components/admin/BulkPriceModal.tsx src/lib/menuExcel.ts src/components/admin/ImportExportBar.tsx
git commit -m "feat(admin): BulkPrice/Excel usan categorias dinamicas (sin CATEGORY_LABELS)"
```

---

## Task 11: `AdminPanel` — cablear sección categorías + modales

**Files:**
- Modify: `src/components/admin/AdminPanel.tsx`

- [ ] **Step 1: Actualizar imports y borrar modal de categoría viejo**

En `src/components/admin/AdminPanel.tsx`:

Cambiar imports (líneas 1-8):
```ts
import { useTransition, useState, useMemo } from 'react'
import { supabase } from '../../lib/supabase'
import { useAdminMenu } from '../../hooks/useAdminMenu'
import { FALLBACK_CATEGORY_ICON } from '../../lib/categories'
import ItemFormModal from './ItemFormModal'
import CategoryFormModal from './CategoryFormModal'
import CategoryDeleteModal from './CategoryDeleteModal'
import BulkPriceModal from './BulkPriceModal'
import ImportExportBar from './ImportExportBar'
import type { AdminMenuItem, AdminMenuItemInput, Category } from '../../types'
```

Borrar el componente `CategoryDeleteConfirmModal` completo (líneas 256-309), que se reemplaza por `CategoryDeleteModal`.

- [ ] **Step 2: `MenuItemRow` recibe el icono por prop (no más `CATEGORY_LABELS`)**

En `MenuItemRow`, cambiar la firma y el fallback de icono. Reemplazar la prop list (líneas 49-59) agregando `icon`:
```tsx
function MenuItemRow({
  item,
  icon,
  onToggle,
  onEdit,
  onDelete,
}: {
  item: AdminMenuItem
  icon: string
  onToggle: (id: string, current: boolean) => Promise<void>
  onEdit: (item: AdminMenuItem) => void
  onDelete: (item: AdminMenuItem) => void
}) {
```

Reemplazar el placeholder de imagen (línea 76):
```tsx
          {icon}
```

- [ ] **Step 3: `CategorySection` recibe `category` (Category) + handlers de editar/borrar**

Reemplazar el componente `CategorySection` (líneas 127-203) por:

```tsx
function CategorySection({
  category,
  items,
  onToggle,
  onEdit,
  onDelete,
  onEditCategory,
  onDeleteCategory,
}: {
  category: Category
  items: AdminMenuItem[]
  onToggle: (id: string, current: boolean) => Promise<void>
  onEdit: (item: AdminMenuItem) => void
  onDelete: (item: AdminMenuItem) => void
  onEditCategory: (category: Category) => void
  onDeleteCategory: (category: Category) => void
}) {
  const [open, setOpen] = useState(true)
  const activeCount = items.filter(i => i.available).length

  return (
    <section>
      <div className="flex items-center justify-between mb-2 px-1">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => onEditCategory(category)}
            aria-label={`Editar categoría ${category.label}`}
            title="Editar categoría (nombre / icono)"
            className="p-1.5 rounded-lg text-muted hover:text-cream hover:bg-white/8 transition-colors shrink-0"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => onDeleteCategory(category)}
            aria-label={`Eliminar categoría ${category.label}`}
            title="Eliminar categoría"
            className="p-1.5 rounded-lg text-muted hover:text-red-400 hover:bg-red-400/10 transition-colors shrink-0"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
              <path d="M10 11v6M14 11v6" />
              <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => setOpen(prev => !prev)}
            className="flex items-center gap-2 group"
          >
            <span className="text-lg">{category.icon}</span>
            <h2 className="text-cream font-heading text-xl tracking-wider">{category.label}</h2>
            <span
              className={[
                'text-muted transition-transform duration-200 text-base ml-1',
                open ? 'rotate-0' : '-rotate-90',
              ].join(' ')}
            >
              ▾
            </span>
          </button>
        </div>
        <span className="text-muted text-xs">
          {activeCount}/{items.length} activos
        </span>
      </div>

      {open && (
        items.length === 0 ? (
          <div className="bg-bg-card rounded-2xl border border-white/5 px-4 py-6 text-center">
            <p className="text-muted text-xs">Sin productos. Agregá uno con "Nuevo producto".</p>
          </div>
        ) : (
          <div className="bg-bg-card rounded-2xl overflow-hidden border border-white/5 divide-y divide-white/5">
            {items.map(item => (
              <MenuItemRow
                key={item.id}
                item={item}
                icon={category.icon || FALLBACK_CATEGORY_ICON}
                onToggle={onToggle}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
          </div>
        )
      )}
    </section>
  )
}
```

- [ ] **Step 4: Reescribir el cuerpo de `AdminPanel`**

Reemplazar desde `export default function AdminPanel()` hasta el final del archivo por:

```tsx
export default function AdminPanel() {
  const {
    grouped, categories, allItems, loading, mutating, error,
    toggleAvailable, insertItem, updateItem, deleteItem,
    insertCategory, updateCategory, deleteCategoryWithReassign,
    bulkUpdatePrices, bulkImport, refetch,
  } = useAdminMenu()

  const [formItem, setFormItem] = useState<AdminMenuItem | null | 'new'>(null)
  const [deleteTarget, setDeleteTarget] = useState<AdminMenuItem | null>(null)
  const [catForm, setCatForm] = useState<Category | null | 'new'>(null)
  const [catDeleteTarget, setCatDeleteTarget] = useState<Category | null>(null)
  const [bulkOpen, setBulkOpen] = useState(false)

  const otherCategories = useMemo(
    () => (catDeleteTarget ? categories.filter(c => c.key !== catDeleteTarget.key) : []),
    [categories, catDeleteTarget],
  )

  async function handleLogout() {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  async function handleSave(input: AdminMenuItemInput, imageFile?: File) {
    if (formItem === 'new') {
      await insertItem(input, imageFile)
    } else if (formItem) {
      await updateItem(formItem.id, input, imageFile)
    }
    setFormItem(null)
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) return
    await deleteItem(deleteTarget.id)
    setDeleteTarget(null)
  }

  async function handleCategorySave(label: string, icon: string) {
    if (catForm === 'new') {
      await insertCategory(label, icon)
    } else if (catForm) {
      await updateCategory(catForm.key, { label, icon })
    }
    setCatForm(null)
  }

  async function handleCategoryDelete(reassignIds: string[], targetKey: string | null) {
    if (!catDeleteTarget) return
    await deleteCategoryWithReassign(catDeleteTarget.key, { reassignIds, targetKey })
    setCatDeleteTarget(null)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-deep flex items-center justify-center">
        <p className="text-muted font-body text-sm animate-pulse">Cargando carta…</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-bg-deep flex flex-col items-center justify-center gap-4">
        <p className="text-red-400 font-body text-sm">Error: {error}</p>
        <button onClick={refetch} className="text-accent text-sm font-body underline underline-offset-2">
          Reintentar
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg-deep font-body">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-bg-deep/95 backdrop-blur border-b border-white/5 px-4 py-4 flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <a
              href="/"
              className="font-heading text-3xl text-cream tracking-widest leading-none hover:text-accent transition-colors"
            >
              MÍTICO
            </a>
            <p className="text-muted text-xs mt-0.5">Gestión de carta</p>
          </div>
          <button
            onClick={handleLogout}
            className="text-muted hover:text-cream text-xs transition-colors px-3 py-2 rounded-lg hover:bg-white/5 shrink-0"
          >
            Salir
          </button>
        </div>
        {/* Acciones — se apilan/envuelven en mobile (375px) */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setFormItem('new')}
            className="flex items-center gap-1.5 bg-accent hover:bg-accent/90 text-white text-xs font-body font-medium px-3 py-2 rounded-xl transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Nuevo producto
          </button>
          <button
            onClick={() => setCatForm('new')}
            className="flex items-center gap-1.5 bg-white/5 hover:bg-white/10 text-cream text-xs font-body font-medium px-3 py-2 rounded-xl transition-colors border border-white/10"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Nueva categoría
          </button>
          <button
            onClick={() => setBulkOpen(true)}
            className="flex items-center gap-1.5 bg-white/5 hover:bg-white/10 text-cream text-xs font-body font-medium px-3 py-2 rounded-xl transition-colors border border-white/10"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="19" y1="5" x2="5" y2="19" />
              <circle cx="6.5" cy="6.5" r="2.5" />
              <circle cx="17.5" cy="17.5" r="2.5" />
            </svg>
            Aumentar precios %
          </button>
          <ImportExportBar items={allItems} categories={categories} saving={mutating} onImport={bulkImport} />
        </div>
      </header>

      {/* Hint */}
      <div className="px-4 pt-5 pb-2">
        <p className="text-muted text-xs leading-relaxed">
          Activá o desactivá ítems según disponibilidad. Los cambios se reflejan en la carta al instante.
          Para editar precios en masa usá <span className="text-cream">Aumentar precios %</span> o exportá/importá un <span className="text-cream">Excel (.xlsx)</span>.
        </p>
      </div>

      {/* Categories */}
      <div className="px-4 pb-12 flex flex-col gap-6 mt-2">
        {categories.map(category => (
          <CategorySection
            key={category.key}
            category={category}
            items={grouped[category.key] ?? []}
            onToggle={toggleAvailable}
            onEdit={item => setFormItem(item)}
            onDelete={item => setDeleteTarget(item)}
            onEditCategory={cat => setCatForm(cat)}
            onDeleteCategory={cat => setCatDeleteTarget(cat)}
          />
        ))}
      </div>

      {/* Form modal (new or edit) */}
      {formItem !== null && (
        <ItemFormModal
          item={formItem === 'new' ? null : formItem}
          categories={categories}
          saving={mutating}
          onSave={handleSave}
          onClose={() => setFormItem(null)}
        />
      )}

      {/* Delete item confirmation */}
      {deleteTarget && (
        <DeleteConfirmModal
          item={deleteTarget}
          deleting={mutating}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      {/* Category form (new or edit) */}
      {catForm !== null && (
        <CategoryFormModal
          category={catForm === 'new' ? null : catForm}
          saving={mutating}
          onSave={handleCategorySave}
          onClose={() => setCatForm(null)}
        />
      )}

      {/* Category delete (reassign) */}
      {catDeleteTarget && (
        <CategoryDeleteModal
          category={catDeleteTarget}
          items={grouped[catDeleteTarget.key] ?? []}
          otherCategories={otherCategories}
          deleting={mutating}
          onConfirm={handleCategoryDelete}
          onCancel={() => setCatDeleteTarget(null)}
        />
      )}

      {/* Bulk price editor */}
      {bulkOpen && (
        <BulkPriceModal
          items={allItems}
          categories={categories}
          saving={mutating}
          onApply={bulkUpdatePrices}
          onClose={() => setBulkOpen(false)}
        />
      )}
    </div>
  )
}
```

- [ ] **Step 5: Type-check + lint**

Run: `npm run build` y luego `npm run lint`
Esperado: build sin errores nuevos (salvo los preexistentes de `*.MP4`). Lint limpio.

- [ ] **Step 6: Commit**

```bash
git add src/components/admin/AdminPanel.tsx
git commit -m "feat(admin): panel con CRUD de categorias (agregar/editar/borrar con reasignacion)"
```

---

## Task 12: Verificación end-to-end + docs + cleanup

**Files:**
- Modify: `CLAUDE.md`, `README.md`

- [ ] **Step 1: Verificar que no queda código muerto**

Run: `npx tsc --noEmit -p tsconfig.json` (ignorar errores `*.MP4`)
Run: buscar referencias colgadas — `grep -rn "CATEGORY_LABELS\|MenuCategoryId\b" src/`
Esperado: `CATEGORY_LABELS` sin resultados. `MenuCategoryId` solo en `types/index.ts` (la definición `= string`).

- [ ] **Step 2: Prueba manual e2e**

Con `npm run dev:all`, en el panel admin (`?access=<VITE_ADMIN_TOKEN>` → login):
1. Crear categoría "Cafetería" con icono ☕ → aparece en la lista (vacía) y en el `<select>` de nuevo producto.
2. Crear un producto en "Cafetería" → se ve en la sección y en la carta pública.
3. Editar la categoría: cambiar icono → se refleja en panel y carta.
4. Borrar "Cafetería": marcar el producto para reasignar a otra categoría → confirmar. La categoría desaparece, el producto quedó en la categoría destino.
5. Borrar una categoría marcando ningún item → se borran sus productos y la categoría.
6. Esperar 60s y preguntar al bot por la categoría nueva → la reconoce.

- [ ] **Step 3: Actualizar docs**

En `CLAUDE.md`, sección Supabase, agregar bajo la lista de tablas:
```markdown
- **Tabla:** `categories` — columnas: `key` (PK, slug), `label`, `icon` (emoji), `sort_order`, `created_at`, `updated_at`. Fuente única de las categorías de la carta. RLS: anon lee, authenticated full. `menu_items.category` es FK → `categories.key` (`ON DELETE RESTRICT`).
```
Y reemplazar la línea que dice que las categorías están hardcodeadas: ahora el CRUD es desde el panel admin (`useAdminMenu`), `src/lib/categories.ts` solo tiene el set de emojis del picker.

En `README.md`, mencionar el CRUD de categorías en la lista de features del panel admin.

- [ ] **Step 4: Commit final**

```bash
git add CLAUDE.md README.md
git commit -m "docs: tabla categories + CRUD de categorias en el panel"
git push
```

---

## Self-Review (completado por el autor del plan)

- **Cobertura del spec:** tabla+RLS+seed+FK (T1), useCategories→integrado en useMenu/useAdminMenu (T4/T6, desviación documentada: no se crea hook separado para evitar doble fetch — los consumidores son hijos de AdminPanel y reciben categorías por prop), CRUD ops (T6), ItemFormModal dinámico (T7), CategoryFormModal con emoji picker (T8), DeleteModal reasignación (T9), BulkPrice/Excel (T10), server menuCache (T5), tipos (T2). Cubierto.
- **Placeholders:** ninguno; todo el código está completo.
- **Consistencia de tipos:** `Category {key,label,icon,sort_order}` usado igual en todas las tareas. `deleteCategoryWithReassign(key, {reassignIds, targetKey})` firma consistente entre T6 (hook), T9 (modal `onConfirm(reassignIds, targetKey)`) y T11 (`handleCategoryDelete`). `toSlug` movido a `lib/slug.ts` y reusado en T8.
- **Desviación del spec:** el spec listaba `useCategories()` como hook separado; se integra el fetch en `useMenu` (público) y `useAdminMenu` (admin) para no duplicar requests ni prop-drillear un hook extra. Mismo resultado (tabla = fuente única).

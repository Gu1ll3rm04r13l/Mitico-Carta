import { useEffect, useState, useOptimistic, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { toSlug } from '../lib/slug'
import type { AdminMenuItem, AdminMenuItemInput, Category } from '../types'

type ToggleAction = { id: string; available: boolean }

/** Ejecuta una operación async sobre items en lotes secuenciales. Lanza si alguno falla. */
async function runInChunks<T>(
  items: T[],
  size: number,
  op: (item: T) => PromiseLike<{ error: { message: string } | null }>,
): Promise<void> {
  for (let i = 0; i < items.length; i += size) {
    const chunk = items.slice(i, i + size)
    const results = await Promise.all(chunk.map(op))
    const failed = results.find(r => r.error)
    if (failed?.error) throw new Error(failed.error.message)
  }
}

export function useAdminMenu() {
  const [items, setItems] = useState<AdminMenuItem[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [mutating, setMutating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [optimisticItems, applyOptimistic] = useOptimistic(
    items,
    (current: AdminMenuItem[], { id, available }: ToggleAction) =>
      current.map(item => (item.id === id ? { ...item, available } : item)),
  )

  useEffect(() => {
    fetchAll()
  }, [])

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

  async function uploadImage(file: File): Promise<string> {
    const ext = file.name.split('.').pop() ?? 'jpg'
    const fileName = `${Date.now()}-${toSlug(file.name.replace(/\.[^.]+$/, ''))}.${ext}`
    const { error } = await supabase.storage
      .from('menu-images')
      .upload(fileName, file, { upsert: false })
    if (error) throw new Error(error.message)
    const { data } = supabase.storage.from('menu-images').getPublicUrl(fileName)
    return data.publicUrl
  }

  const toggleAvailable = useCallback(async (id: string, current: boolean) => {
    const next = !current
    applyOptimistic({ id, available: next })

    const { error } = await supabase
      .from('menu_items')
      .update({ available: next, updated_at: new Date().toISOString() })
      .eq('id', id)

    if (error) {
      await fetchAll()
    } else {
      setItems(prev =>
        prev.map(item => (item.id === id ? { ...item, available: next } : item)),
      )
    }
  }, [applyOptimistic])

  async function insertItem(input: AdminMenuItemInput, imageFile?: File): Promise<void> {
    setMutating(true)
    try {
      let image_url = input.image_url ?? null
      if (imageFile) image_url = await uploadImage(imageFile)

      const slug = toSlug(input.name)

      const { error } = await supabase.from('menu_items').insert({
        ...input,
        slug,
        image_url,
      })
      if (error) throw new Error(error.message)
      await fetchAll()
    } finally {
      setMutating(false)
    }
  }

  async function updateItem(id: string, input: AdminMenuItemInput, imageFile?: File): Promise<void> {
    setMutating(true)
    try {
      let image_url = input.image_url ?? null
      if (imageFile) image_url = await uploadImage(imageFile)

      const { error } = await supabase
        .from('menu_items')
        .update({ ...input, image_url, updated_at: new Date().toISOString() })
        .eq('id', id)
      if (error) throw new Error(error.message)
      await fetchAll()
    } finally {
      setMutating(false)
    }
  }

  async function deleteItem(id: string): Promise<void> {
    setMutating(true)
    try {
      const { error } = await supabase.from('menu_items').delete().eq('id', id)
      if (error) throw new Error(error.message)
      await fetchAll()
    } finally {
      setMutating(false)
    }
  }

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

  /** Actualiza precios en masa (un UPDATE por id, en lotes para no saturar). */
  async function bulkUpdatePrices(updates: { id: string; price: number }[]): Promise<void> {
    if (updates.length === 0) return
    setMutating(true)
    try {
      await runInChunks(updates, 20, ({ id, price }) =>
        supabase
          .from('menu_items')
          .update({ price, updated_at: new Date().toISOString() })
          .eq('id', id),
      )
      await fetchAll()
    } finally {
      setMutating(false)
    }
  }

  /** Aplica un import CSV: update por id de los campos provistos. */
  async function bulkImport(rows: { id: string; input: Partial<AdminMenuItemInput> }[]): Promise<void> {
    if (rows.length === 0) return
    setMutating(true)
    try {
      await runInChunks(rows, 20, ({ id, input }) =>
        supabase
          .from('menu_items')
          .update({ ...input, updated_at: new Date().toISOString() })
          .eq('id', id),
      )
      await fetchAll()
    } finally {
      setMutating(false)
    }
  }

  const grouped = optimisticItems.reduce<Record<string, AdminMenuItem[]>>((acc, item) => {
    const list = acc[item.category] ?? []
    list.push(item)
    acc[item.category] = list
    return acc
  }, {})

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
}

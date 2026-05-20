import { useEffect, useState, useOptimistic, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { AdminMenuItem, AdminMenuItemInput } from '../types'

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

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .trim()
}

export function useAdminMenu() {
  const [items, setItems] = useState<AdminMenuItem[]>([])
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
    const { data, error } = await supabase
      .from('menu_items')
      .select('id, slug, name, description, price, category, sort_order, available, is_signature, tags, image_url')
      .order('category')
      .order('sort_order')

    if (error) {
      setError(error.message)
    } else {
      setItems(data as AdminMenuItem[])
    }
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

  /** Borra TODOS los productos de una categoría. Acción destructiva. */
  async function deleteCategory(category: string): Promise<void> {
    setMutating(true)
    try {
      const { error } = await supabase.from('menu_items').delete().eq('category', category)
      if (error) throw new Error(error.message)
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
    allItems: items,
    loading,
    mutating,
    error,
    toggleAvailable,
    insertItem,
    updateItem,
    deleteItem,
    deleteCategory,
    bulkUpdatePrices,
    bulkImport,
    refetch: fetchAll,
  }
}

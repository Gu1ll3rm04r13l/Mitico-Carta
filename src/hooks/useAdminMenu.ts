import { useEffect, useState, useOptimistic, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { AdminMenuItem } from '../types'

type ToggleAction = { id: string; available: boolean }

export function useAdminMenu() {
  const [items, setItems] = useState<AdminMenuItem[]>([])
  const [loading, setLoading] = useState(true)
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

  const toggleAvailable = useCallback(async (id: string, current: boolean) => {
    const next = !current
    applyOptimistic({ id, available: next })

    const { error } = await supabase
      .from('menu_items')
      .update({ available: next, updated_at: new Date().toISOString() })
      .eq('id', id)

    if (error) {
      // Revert: refetch to sync real state
      await fetchAll()
    } else {
      setItems(prev =>
        prev.map(item => (item.id === id ? { ...item, available: next } : item)),
      )
    }
  }, [applyOptimistic])

  const grouped = optimisticItems.reduce<Record<string, AdminMenuItem[]>>((acc, item) => {
    const list = acc[item.category] ?? []
    list.push(item)
    acc[item.category] = list
    return acc
  }, {})

  return { grouped, loading, error, toggleAvailable, refetch: fetchAll }
}

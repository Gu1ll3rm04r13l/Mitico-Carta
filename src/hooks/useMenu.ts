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

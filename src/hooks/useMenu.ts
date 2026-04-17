import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { MenuCategory, MenuCategoryId, DietaryTag } from '../types'

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

// Orden y metadata de display — el slug de Supabase puede diferir del id del tipo
const CATEGORY_META: { key: string; id: MenuCategoryId; label: string; icon: string }[] = [
  { key: 'entradas',    id: 'entradas',    label: 'Entradas',    icon: '🧀' },
  { key: 'cervezas',   id: 'cervezas',    label: 'Cervezas',    icon: '🍺' },
  { key: 'cocteles',   id: 'cocteles',    label: 'Cócteles',    icon: '🍸' },
  { key: 'vinos',      id: 'vinos',       label: 'Vinos',       icon: '🍷' },
  { key: 'sin-alcohol',id: 'bebidas',     label: 'Sin Alcohol', icon: '🥤' },
  { key: 'pizzas',     id: 'pizzas',      label: 'Pizzas',      icon: '🍕' },
  { key: 'postres',    id: 'postres',     label: 'Postres',     icon: '🍮' },
  { key: 'sandwiches', id: 'sandwiches',  label: 'Sandwiches',  icon: '🥪' },
  { key: 'panchos',    id: 'panchos',     label: 'Panchos',     icon: '🌭' },
  { key: 'empanadas',  id: 'empanadas',   label: 'Empanadas',   icon: '🥟' },
  { key: 'ensaladas',  id: 'ensaladas',   label: 'Ensaladas',   icon: '🥗' },
]

export function useMenu() {
  const [categories, setCategories] = useState<MenuCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchMenu() {
      const { data, error } = await supabase
        .from('menu_items')
        .select('id, slug, name, description, price, category, sort_order, is_signature, tags')
        .eq('available', true)
        .order('sort_order')

      if (error) {
        setError(error.message)
        setLoading(false)
        return
      }

      const grouped = new Map<string, SupabaseRow[]>()
      for (const row of data as SupabaseRow[]) {
        const list = grouped.get(row.category) ?? []
        list.push(row)
        grouped.set(row.category, list)
      }

      const result: MenuCategory[] = CATEGORY_META
        .filter(meta => grouped.has(meta.key))
        .map(meta => ({
          id: meta.id,
          label: meta.label,
          icon: meta.icon,
          items: (grouped.get(meta.key) ?? []).map(row => ({
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

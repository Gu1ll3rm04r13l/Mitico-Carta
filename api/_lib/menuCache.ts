import { supabaseServer } from './supabase.js'

export interface ServerMenuItem {
  name: string
  description: string | null
  price: number
  is_signature: boolean
}

export interface ServerMenuCategory {
  key: string
  label: string
  items: ServerMenuItem[]
}

// Cache module-scope. En Vercel se reusa entre invocaciones warm (~10-15min).
// En Express dev persiste mientras el proceso vive.
const TTL_MS = 60_000
let cache: { data: ServerMenuCategory[]; expiresAt: number } | null = null
let inflight: Promise<ServerMenuCategory[]> | null = null

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

export async function getMenu(): Promise<ServerMenuCategory[]> {
  const now = Date.now()
  if (cache && cache.expiresAt > now) return cache.data
  if (inflight) return inflight

  inflight = fetchMenuFromDb()
    .then(data => {
      cache = { data, expiresAt: Date.now() + TTL_MS }
      return data
    })
    .finally(() => {
      inflight = null
    })

  return inflight
}

/** Invalida cache manualmente (útil para tests o si se quiere forzar refresh) */
export function invalidateMenuCache(): void {
  cache = null
}

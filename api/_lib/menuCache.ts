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

const CATEGORY_LABELS: Record<string, string> = {
  entradas: 'Entradas',
  cervezas: 'Cervezas',
  cocteles: 'Cócteles',
  vinos: 'Vinos',
  'sin-alcohol': 'Sin Alcohol',
  pizzas: 'Pizzas',
  postres: 'Postres',
  sandwiches: 'Sandwiches',
  panchos: 'Panchos',
  empanadas: 'Empanadas',
  ensaladas: 'Ensaladas',
}

const CATEGORY_ORDER = Object.keys(CATEGORY_LABELS)

// Cache module-scope. En Vercel se reusa entre invocaciones warm (~10-15min).
// En Express dev persiste mientras el proceso vive.
const TTL_MS = 60_000
let cache: { data: ServerMenuCategory[]; expiresAt: number } | null = null
let inflight: Promise<ServerMenuCategory[]> | null = null

async function fetchMenuFromDb(): Promise<ServerMenuCategory[]> {
  const { data, error } = await supabaseServer
    .from('menu_items')
    .select('name, description, price, category, sort_order, is_signature')
    .eq('available', true)
    .order('sort_order')

  if (error) throw new Error(`[menuCache] Supabase: ${error.message}`)

  const grouped = new Map<string, ServerMenuItem[]>()
  for (const row of data ?? []) {
    const list = grouped.get(row.category) ?? []
    list.push({
      name: row.name,
      description: row.description,
      price: row.price,
      is_signature: row.is_signature,
    })
    grouped.set(row.category, list)
  }

  return CATEGORY_ORDER
    .filter(key => grouped.has(key))
    .map(key => ({
      key,
      label: CATEGORY_LABELS[key],
      items: grouped.get(key) ?? [],
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

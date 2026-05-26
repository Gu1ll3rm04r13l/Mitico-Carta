// ─── Menu ──────────────────────────────────────────────────────────────────

export type DietaryTag = 'vegetariano' | 'vegano' | 'sin-tacc' | 'picante'

export interface MenuItem {
  id: string
  name: string
  description: string
  /** Precio en ARS (entera o unidad) */
  price: number
  /** Precio media pizza (solo pizzas) */
  priceMedia?: number
  tags?: DietaryTag[]
  isSignature?: boolean
}

/** key de categoría (slug). Antes era un union cerrado; ahora la fuente es la tabla `categories`. */
export type MenuCategoryId = string

/** Fila de la tabla `categories` (fuente única de las categorías de la carta). */
export interface Category {
  key: string
  label: string
  icon: string
  sort_order: number
}

export interface MenuCategory {
  id: MenuCategoryId
  label: string
  icon: string
  items: MenuItem[]
}

// ─── Reservation ───────────────────────────────────────────────────────────

export interface ReservationFormData {
  name: string
  guests: number
  date: string
  time: string
  notes: string
}

export type ReservationErrors = Partial<Record<keyof ReservationFormData, string>>

export type ReservationStatus = 'idle' | 'submitting' | 'success' | 'error'

// ─── Cancel Reservation ────────────────────────────────────────────────────

export interface CancelFormData {
  name: string
  date: string
  /** Horario original de la reserva (opcional pero recomendado) */
  time: string
  notes: string
}

export type CancelErrors = Partial<Record<keyof CancelFormData, string>>

// ─── Chat ──────────────────────────────────────────────────────────────────

export type ChatRole = 'user' | 'assistant'

export interface ChatMessage {
  id: string
  role: ChatRole
  content: string
  timestamp: number
}

/** Intent inicial que puede recibir el chat para pre-cargar un flujo */
export type ChatIntent = 'order' | null

// ─── Admin ─────────────────────────────────────────────────────────────────

export interface AdminMenuItem {
  id: string
  slug: string
  name: string
  description: string | null
  price: number
  category: string
  sort_order: number
  available: boolean
  is_signature: boolean
  tags: string[]
  image_url: string | null
}

export interface AdminMenuItemInput {
  name: string
  description: string | null
  price: number
  category: string
  sort_order: number
  available: boolean
  is_signature: boolean
  tags: string[]
  image_url?: string | null
}

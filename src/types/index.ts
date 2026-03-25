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

export type MenuCategoryId =
  | 'pizzas'
  | 'sandwiches'
  | 'entradas'
  | 'panchos'
  | 'empanadas'
  | 'postres'
  | 'cocteles'
  | 'cervezas'
  | 'vinos'
  | 'bebidas'
  | 'ensaladas'

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

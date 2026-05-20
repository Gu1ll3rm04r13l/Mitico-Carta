// Utilidades puras para edición masiva de precios.
// Precios en ARS enteros (ej. 10100). Redondeo siempre a centena (múltiplos de 100).

export type RoundMode = 'up' | 'down' | 'nearest'

/** Piso absoluto: ningún precio puede quedar por debajo de esto. */
export const PRICE_FLOOR = 100

/**
 * Redondea a la centena más cercana según el modo.
 * - up:      ceil  → 10090 → 10100
 * - down:    floor → 10090 → 10000
 * - nearest: round → 10090 → 10100
 */
export function roundToHundred(value: number, mode: RoundMode): number {
  const hundreds = value / 100
  switch (mode) {
    case 'up':
      return Math.ceil(hundreds) * 100
    case 'down':
      return Math.floor(hundreds) * 100
    case 'nearest':
      return Math.round(hundreds) * 100
  }
}

/**
 * Aplica un porcentaje a un precio y redondea a centena.
 * Acepta porcentajes negativos (bajar precios).
 * Garantiza piso absoluto de PRICE_FLOOR para no devolver 0.
 */
export function applyPercent(price: number, percent: number, mode: RoundMode): number {
  const raw = price * (1 + percent / 100)
  const rounded = roundToHundred(raw, mode)
  return Math.max(rounded, PRICE_FLOOR)
}

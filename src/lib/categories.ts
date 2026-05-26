// Set de emojis para el picker de categorías del panel admin.
// Las categorías reales (label/icon/orden) viven en la tabla `categories` de Supabase.

/** Emojis sugeridos para iconos de categoría (comida/bebida). */
export const CATEGORY_ICON_CHOICES: string[] = [
  '🧀', '🍕', '🥪', '🌭', '🥟', '🥗', '🍔', '🍟', '🌮', '🌯',
  '🍝', '🍜', '🍲', '🥘', '🍤', '🍣', '🥩', '🍗', '🥓', '🍳',
  '🍮', '🍰', '🍦', '🍩', '🍪', '🍫', '🧁', '🥧',
  '🍺', '🍷', '🍸', '🍹', '🍻', '🥂', '🥃', '🍾', '🥤', '🧃',
  '☕', '🧉', '🫖', '💧',
]

/** Icono por defecto cuando una categoría no tiene uno o es desconocida. */
export const FALLBACK_CATEGORY_ICON = '🍽️'

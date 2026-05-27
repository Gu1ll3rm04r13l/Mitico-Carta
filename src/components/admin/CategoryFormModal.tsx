import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { CATEGORY_ICON_CHOICES } from '../../lib/categories'
import { toSlug } from '../../lib/slug'
import type { Category } from '../../types'

interface Props {
  /** null = crear, Category = editar */
  category: Category | null
  saving: boolean
  onSave: (label: string, icon: string) => Promise<void>
  onClose: () => void
}

export default function CategoryFormModal({ category, saving, onSave, onClose }: Props) {
  const isEdit = Boolean(category)
  const [label, setLabel] = useState(category?.label ?? '')
  const [icon, setIcon] = useState(category?.icon ?? CATEGORY_ICON_CHOICES[0])
  const [formError, setFormError] = useState<string | null>(null)
  const labelRef = useRef<HTMLInputElement>(null)

  // Autofocus solo en desktop (pointer fino). En touch dispara el
  // teclado y tapa el modal (mobile-first).
  useEffect(() => {
    if (window.matchMedia('(pointer: fine)').matches) labelRef.current?.focus()
  }, [])
  // Cierre solo via Cancelar o la cruz: evita perder datos por click fuera/Escape.

  const derivedKey = isEdit ? category!.key : toSlug(label)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFormError(null)
    if (!label.trim()) {
      setFormError('El nombre es obligatorio.')
      return
    }
    if (!isEdit && !derivedKey) {
      setFormError('El nombre no genera un identificador válido.')
      return
    }
    try {
      await onSave(label.trim(), icon)
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Error al guardar.')
    }
  }

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
    >
      <div className="w-full max-w-md bg-bg-card rounded-2xl border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[90dvh]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/8 shrink-0">
          <h2 className="font-heading text-2xl text-cream tracking-wider">
            {isEdit ? 'Editar categoría' : 'Nueva categoría'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-muted hover:text-cream transition-colors p-1 rounded-lg hover:bg-white/5"
            aria-label="Cerrar"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 px-5 py-5 flex flex-col gap-4">
          {/* Nombre */}
          <div>
            <label className="block text-muted text-xs font-body mb-1.5 uppercase tracking-wider">Nombre *</label>
            <input
              ref={labelRef}
              type="text"
              value={label}
              onChange={e => setLabel(e.target.value)}
              placeholder="Ej: Tragos sin alcohol"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-cream text-sm font-body placeholder:text-muted focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/30 transition-colors"
            />
            {!isEdit && (
              <p className="text-muted text-xs mt-1.5">
                Identificador: <span className="text-cream font-mono">{derivedKey || '—'}</span>
              </p>
            )}
          </div>

          {/* Picker de icono */}
          <div>
            <label className="block text-muted text-xs font-body mb-1.5 uppercase tracking-wider">Icono</label>
            <div className="grid grid-cols-8 gap-1.5">
              {CATEGORY_ICON_CHOICES.map(choice => (
                <button
                  key={choice}
                  type="button"
                  onClick={() => setIcon(choice)}
                  className={[
                    'aspect-square rounded-lg text-lg flex items-center justify-center transition-colors border',
                    icon === choice
                      ? 'bg-accent/15 border-accent/60'
                      : 'bg-white/5 border-white/10 hover:bg-white/10',
                  ].join(' ')}
                  aria-label={`Icono ${choice}`}
                  aria-pressed={icon === choice}
                >
                  {choice}
                </button>
              ))}
            </div>
          </div>

          {formError && (
            <p className="text-red-400 text-sm font-body">{formError}</p>
          )}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="flex-1 px-4 py-2.5 rounded-xl border border-white/10 text-muted hover:text-cream text-sm font-body transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-2.5 rounded-xl bg-accent hover:bg-accent/90 text-white text-sm font-body transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <span className="inline-block w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Guardando…
                </>
              ) : (
                isEdit ? 'Guardar' : 'Crear categoría'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  )
}

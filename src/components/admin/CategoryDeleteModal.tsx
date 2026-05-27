import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { AdminMenuItem, Category } from '../../types'

interface Props {
  category: Category
  items: AdminMenuItem[]
  /** Otras categorías a las que se puede reasignar (excluye la actual). */
  otherCategories: Category[]
  deleting: boolean
  onConfirm: (reassignIds: string[], targetKey: string | null) => Promise<void>
  onCancel: () => void
}

export default function CategoryDeleteModal({
  category,
  items,
  otherCategories,
  deleting,
  onConfirm,
  onCancel,
}: Props) {
  // Por defecto: ningún item marcado → todos se borran. El usuario marca los que quiere conservar.
  const [reassignIds, setReassignIds] = useState<string[]>([])
  const [targetKey, setTargetKey] = useState<string>(otherCategories[0]?.key ?? '')
  const [formError, setFormError] = useState<string | null>(null)
  const overlayRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onCancel()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onCancel])

  function toggle(id: string) {
    setReassignIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id],
    )
  }

  const reassignCount = reassignIds.length
  const deleteCount = items.length - reassignCount
  const needsTarget = reassignCount > 0

  async function handleConfirm() {
    setFormError(null)
    if (needsTarget && !targetKey) {
      setFormError('Elegí una categoría destino para los productos marcados.')
      return
    }
    try {
      await onConfirm(reassignIds, needsTarget ? targetKey : null)
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Error al borrar.')
    }
  }

  return createPortal(
    <div
      ref={overlayRef}
      onClick={e => { if (e.target === overlayRef.current) onCancel() }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
    >
      <div className="w-full max-w-md bg-bg-card rounded-2xl border border-white/10 shadow-2xl flex flex-col max-h-[90dvh]">
        <div className="p-6 pb-4 border-b border-white/5">
          <h3 className="font-heading text-2xl text-cream tracking-wide mb-1">
            Eliminar categoría {category.icon} {category.label}
          </h3>
          <p className="text-muted text-sm font-body leading-relaxed">
            Marcá los productos que querés <span className="text-cream">conservar</span> (se mueven a otra categoría).
            Los no marcados se <span className="text-red-400">eliminan</span>.
          </p>
        </div>

        {items.length === 0 ? (
          <div className="px-6 py-4">
            <p className="text-muted text-sm">Esta categoría no tiene productos. Se eliminará directamente.</p>
          </div>
        ) : (
          <div className="px-6 py-3 overflow-y-auto">
            {/* Destino */}
            <div className="flex items-center gap-2 mb-3">
              <span className="text-muted text-xs uppercase tracking-wider">Mover marcados a:</span>
              <select
                value={targetKey}
                onChange={e => setTargetKey(e.target.value)}
                disabled={otherCategories.length === 0}
                className="flex-1 bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-cream text-base font-body focus:outline-none focus:border-accent/40 cursor-pointer disabled:opacity-50"
              >
                {otherCategories.length === 0 ? (
                  <option value="">No hay otras categorías</option>
                ) : (
                  otherCategories.map(c => (
                    <option key={c.key} value={c.key} className="bg-[#1A1A1A]">
                      {c.icon} {c.label}
                    </option>
                  ))
                )}
              </select>
            </div>

            {/* Lista de items */}
            <div className="bg-white/5 rounded-xl border border-white/10 max-h-56 overflow-y-auto divide-y divide-white/5">
              {items.map(item => {
                const keep = reassignIds.includes(item.id)
                return (
                  <label
                    key={item.id}
                    className="flex items-center gap-3 px-3 py-2 text-sm cursor-pointer hover:bg-white/5"
                  >
                    <input
                      type="checkbox"
                      checked={keep}
                      onChange={() => toggle(item.id)}
                      className="accent-accent w-4 h-4"
                    />
                    <span className="text-cream truncate flex-1">{item.name}</span>
                    <span className={keep ? 'text-accent text-xs shrink-0' : 'text-red-400 text-xs shrink-0'}>
                      {keep ? 'conservar' : 'borrar'}
                    </span>
                  </label>
                )
              })}
            </div>

            <p className="text-muted text-xs mt-3">
              {reassignCount} a conservar · <span className="text-red-400">{deleteCount} a borrar</span>
            </p>
          </div>
        )}

        {formError && (
          <p className="px-6 text-red-400 text-sm font-body">{formError}</p>
        )}

        <div className="p-6 pt-4 border-t border-white/5 flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={deleting}
            className="flex-1 px-4 py-2.5 rounded-xl border border-white/10 text-muted hover:text-cream text-sm font-body transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={deleting || (needsTarget && otherCategories.length === 0)}
            className="flex-1 px-4 py-2.5 rounded-xl bg-red-500/80 hover:bg-red-500 text-white text-sm font-body transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {deleting ? (
              <>
                <span className="inline-block w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Eliminando…
              </>
            ) : (
              'Eliminar categoría'
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}

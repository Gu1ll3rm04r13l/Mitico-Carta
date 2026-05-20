import { useMemo, useState } from 'react'
import { CATEGORY_LABELS } from '../../lib/categories'
import { applyPercent, type RoundMode } from '../../lib/priceBulk'
import type { AdminMenuItem } from '../../types'

const ROUND_OPTIONS: { mode: RoundMode; label: string }[] = [
  { mode: 'nearest', label: 'Cercano' },
  { mode: 'up', label: 'Arriba' },
  { mode: 'down', label: 'Abajo' },
]

export default function BulkPriceModal({
  items,
  saving,
  onApply,
  onClose,
}: {
  items: AdminMenuItem[]
  saving: boolean
  onApply: (updates: { id: string; price: number }[]) => Promise<void>
  onClose: () => void
}) {
  const [percent, setPercent] = useState<string>('10')
  const [mode, setMode] = useState<RoundMode>('nearest')

  // Categorías presentes en la carta, en el orden de CATEGORY_LABELS.
  const presentCategories = useMemo(
    () => Object.keys(CATEGORY_LABELS).filter(k => items.some(i => i.category === k)),
    [items],
  )
  const [selectedCats, setSelectedCats] = useState<string[]>(presentCategories)

  const pct = Number(percent)
  const pctValid = Number.isFinite(pct) && percent.trim() !== ''

  const affected = useMemo(() => {
    if (!pctValid) return []
    return items
      .filter(i => selectedCats.includes(i.category))
      .map(i => ({
        item: i,
        newPrice: applyPercent(i.price, pct, mode),
      }))
      .filter(({ item, newPrice }) => newPrice !== item.price)
  }, [items, selectedCats, pct, mode, pctValid])

  function toggleCat(cat: string) {
    setSelectedCats(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat],
    )
  }

  function allSelected() {
    setSelectedCats(presentCategories)
  }
  function noneSelected() {
    setSelectedCats([])
  }

  async function handleApply() {
    const updates = affected.map(({ item, newPrice }) => ({ id: item.id, price: newPrice }))
    await onApply(updates)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg bg-bg-card rounded-2xl border border-white/10 shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 pb-4 border-b border-white/5">
          <h3 className="font-heading text-2xl text-cream tracking-wide mb-1">Aumentar precios</h3>
          <p className="text-muted text-sm font-body leading-relaxed">
            Aplicá un porcentaje a toda la carta o a categorías elegidas. Usá un valor negativo para bajar precios.
          </p>
        </div>

        {/* Controls */}
        <div className="p-6 flex flex-col gap-5 overflow-y-auto">
          {/* Porcentaje */}
          <div className="flex flex-col gap-2">
            <label className="text-cream text-sm font-body font-medium">Porcentaje</label>
            <div className="relative">
              <input
                type="number"
                inputMode="decimal"
                value={percent}
                onChange={e => setPercent(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 pr-8 text-cream font-body text-sm focus:outline-none focus:border-accent/60"
                placeholder="10"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted text-sm">%</span>
            </div>
          </div>

          {/* Redondeo */}
          <div className="flex flex-col gap-2">
            <label className="text-cream text-sm font-body font-medium">Redondeo (a centena)</label>
            <div className="grid grid-cols-3 gap-2">
              {ROUND_OPTIONS.map(opt => (
                <button
                  key={opt.mode}
                  type="button"
                  onClick={() => setMode(opt.mode)}
                  className={[
                    'px-3 py-2 rounded-xl text-sm font-body transition-colors border',
                    mode === opt.mode
                      ? 'bg-accent text-white border-accent'
                      : 'bg-white/5 text-muted border-white/10 hover:text-cream',
                  ].join(' ')}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <p className="text-muted text-xs">
              Siempre múltiplos de 100. Ej. 10090 → arriba 10100, abajo 10000, cercano 10100.
            </p>
          </div>

          {/* Categorías */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="text-cream text-sm font-body font-medium">Categorías</label>
              <div className="flex gap-3 text-xs">
                <button type="button" onClick={allSelected} className="text-accent hover:underline">
                  Todas
                </button>
                <button type="button" onClick={noneSelected} className="text-muted hover:text-cream">
                  Ninguna
                </button>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {presentCategories.map(cat => {
                const active = selectedCats.includes(cat)
                const meta = CATEGORY_LABELS[cat]
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => toggleCat(cat)}
                    className={[
                      'px-3 py-1.5 rounded-full text-xs font-body transition-colors border flex items-center gap-1.5',
                      active
                        ? 'bg-accent/15 text-cream border-accent/50'
                        : 'bg-white/5 text-muted border-white/10 hover:text-cream',
                    ].join(' ')}
                  >
                    <span>{meta?.icon}</span>
                    {meta?.label ?? cat}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Preview */}
          <div className="flex flex-col gap-2">
            <label className="text-cream text-sm font-body font-medium">
              Vista previa{' '}
              <span className="text-muted font-normal">({affected.length} ítems cambian)</span>
            </label>
            {!pctValid ? (
              <p className="text-muted text-xs">Ingresá un porcentaje válido.</p>
            ) : affected.length === 0 ? (
              <p className="text-muted text-xs">Ningún ítem cambia con estos valores.</p>
            ) : (
              <div className="bg-white/5 rounded-xl border border-white/10 max-h-48 overflow-y-auto divide-y divide-white/5">
                {affected.map(({ item, newPrice }) => (
                  <div key={item.id} className="flex items-center justify-between gap-2 px-3 py-2 text-xs">
                    <span className="text-cream truncate flex-1">{item.name}</span>
                    <span className="text-muted shrink-0">
                      ${item.price.toLocaleString('es-AR')}
                    </span>
                    <span className="text-muted shrink-0">→</span>
                    <span className="text-accent font-medium shrink-0">
                      ${newPrice.toLocaleString('es-AR')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 pt-4 border-t border-white/5 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="flex-1 px-4 py-2.5 rounded-xl border border-white/10 text-muted hover:text-cream text-sm font-body transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleApply}
            disabled={saving || affected.length === 0}
            className="flex-1 px-4 py-2.5 rounded-xl bg-accent hover:bg-accent/90 text-white text-sm font-body transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {saving ? (
              <>
                <span className="inline-block w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Aplicando…
              </>
            ) : (
              `Aplicar a ${affected.length} ítems`
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

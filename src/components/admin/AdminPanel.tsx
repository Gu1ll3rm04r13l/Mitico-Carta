import { useTransition, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAdminMenu } from '../../hooks/useAdminMenu'
import type { AdminMenuItem } from '../../types'

const CATEGORY_LABELS: Record<string, { label: string; icon: string }> = {
  entradas:      { label: 'Entradas',    icon: '🧀' },
  cervezas:      { label: 'Cervezas',    icon: '🍺' },
  cocteles:      { label: 'Cócteles',    icon: '🍸' },
  vinos:         { label: 'Vinos',       icon: '🍷' },
  'sin-alcohol': { label: 'Sin Alcohol', icon: '🥤' },
  pizzas:        { label: 'Pizzas',      icon: '🍕' },
  postres:       { label: 'Postres',     icon: '🍮' },
  sandwiches:    { label: 'Sandwiches',  icon: '🥪' },
  panchos:       { label: 'Panchos',     icon: '🌭' },
  empanadas:     { label: 'Empanadas',   icon: '🥟' },
  ensaladas:     { label: 'Ensaladas',   icon: '🥗' },
}

function AvailableToggle({
  item,
  onToggle,
}: {
  item: AdminMenuItem
  onToggle: (id: string, current: boolean) => Promise<void>
}) {
  const [isPending, startTransition] = useTransition()

  return (
    <button
      type="button"
      aria-label={item.available ? 'Deshabilitar ítem' : 'Habilitar ítem'}
      disabled={isPending}
      onClick={e => {
        e.stopPropagation()
        startTransition(() => onToggle(item.id, item.available))
      }}
      className={[
        'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/50',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        item.available ? 'bg-accent' : 'bg-white/10',
      ].join(' ')}
    >
      <span
        className={[
          'inline-block h-4 w-4 rounded-full bg-white shadow transition-transform duration-200',
          item.available ? 'translate-x-6' : 'translate-x-1',
        ].join(' ')}
      />
    </button>
  )
}

function MenuItemRow({
  item,
  onToggle,
}: {
  item: AdminMenuItem
  onToggle: (id: string, current: boolean) => Promise<void>
}) {
  return (
    <div
      className={[
        'flex items-center justify-between gap-4 px-4 py-3 transition-opacity',
        item.available ? 'opacity-100' : 'opacity-40',
      ].join(' ')}
    >
      <div className="flex flex-col gap-0.5 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-cream font-body text-sm font-medium truncate">{item.name}</span>
          {item.is_signature && (
            <span className="text-[10px] text-accent-warm font-body uppercase tracking-wider shrink-0">
              Signature
            </span>
          )}
        </div>
        <span className="text-muted text-xs font-body">
          ${item.price.toLocaleString('es-AR')}
        </span>
      </div>
      <AvailableToggle item={item} onToggle={onToggle} />
    </div>
  )
}

function CategorySection({
  catKey,
  items,
  onToggle,
}: {
  catKey: string
  items: AdminMenuItem[]
  onToggle: (id: string, current: boolean) => Promise<void>
}) {
  const [open, setOpen] = useState(true)
  const meta = CATEGORY_LABELS[catKey]
  const activeCount = items.filter(i => i.available).length

  return (
    <section>
      <button
        type="button"
        onClick={() => setOpen(prev => !prev)}
        className="w-full flex items-center justify-between mb-2 px-1 group"
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">{meta.icon}</span>
          <h2 className="text-cream font-heading text-xl tracking-wider">{meta.label}</h2>
          <span
            className={[
              'text-muted transition-transform duration-200 text-xs ml-1',
              open ? 'rotate-0' : '-rotate-90',
            ].join(' ')}
          >
            ▾
          </span>
        </div>
        <span className="text-muted text-xs">
          {activeCount}/{items.length} activos
        </span>
      </button>

      {open && (
        <div className="bg-bg-card rounded-2xl overflow-hidden border border-white/5 divide-y divide-white/5">
          {items.map(item => (
            <MenuItemRow key={item.id} item={item} onToggle={onToggle} />
          ))}
        </div>
      )}
    </section>
  )
}

export default function AdminPanel() {
  const { grouped, loading, error, toggleAvailable, refetch } = useAdminMenu()

  async function handleLogout() {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-deep flex items-center justify-center">
        <p className="text-muted font-body text-sm animate-pulse">Cargando carta…</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-bg-deep flex flex-col items-center justify-center gap-4">
        <p className="text-red-400 font-body text-sm">Error: {error}</p>
        <button onClick={refetch} className="text-accent text-sm font-body underline underline-offset-2">
          Reintentar
        </button>
      </div>
    )
  }

  const categoryKeys = Object.keys(CATEGORY_LABELS).filter(k => grouped[k]?.length)

  return (
    <div className="min-h-screen bg-bg-deep font-body">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-bg-deep/95 backdrop-blur border-b border-white/5 px-4 py-4 flex items-center justify-between">
        <div>
          <a
            href="/"
            className="font-heading text-3xl text-cream tracking-widest leading-none hover:text-accent transition-colors"
          >
            MÍTICO
          </a>
          <p className="text-muted text-xs mt-0.5">Gestión de carta</p>
        </div>
        <button
          onClick={handleLogout}
          className="text-muted hover:text-cream text-xs transition-colors px-3 py-2 rounded-lg hover:bg-white/5"
        >
          Cerrar sesión
        </button>
      </header>

      {/* Hint */}
      <div className="px-4 pt-5 pb-2">
        <p className="text-muted text-xs leading-relaxed">
          Activá o desactivá ítems según disponibilidad del día. Los cambios se ven en la carta al instante.
        </p>
      </div>

      {/* Categories */}
      <div className="px-4 pb-12 flex flex-col gap-6 mt-2">
        {categoryKeys.map(catKey => (
          <CategorySection
            key={catKey}
            catKey={catKey}
            items={grouped[catKey]}
            onToggle={toggleAvailable}
          />
        ))}
      </div>
    </div>
  )
}

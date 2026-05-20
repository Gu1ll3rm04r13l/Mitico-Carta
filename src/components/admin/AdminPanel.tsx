import { useTransition, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useAdminMenu } from '../../hooks/useAdminMenu'
import { CATEGORY_LABELS } from '../../lib/categories'
import ItemFormModal from './ItemFormModal'
import BulkPriceModal from './BulkPriceModal'
import ImportExportBar from './ImportExportBar'
import type { AdminMenuItem, AdminMenuItemInput } from '../../types'

// ─── AvailableToggle ────────────────────────────────────────────────────────

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

// ─── MenuItemRow ─────────────────────────────────────────────────────────────

function MenuItemRow({
  item,
  onToggle,
  onEdit,
  onDelete,
}: {
  item: AdminMenuItem
  onToggle: (id: string, current: boolean) => Promise<void>
  onEdit: (item: AdminMenuItem) => void
  onDelete: (item: AdminMenuItem) => void
}) {
  return (
    <div
      className={[
        'flex items-center justify-between gap-3 px-4 py-3 transition-opacity',
        item.available ? 'opacity-100' : 'opacity-40',
      ].join(' ')}
    >
      {/* Image thumbnail */}
      {item.image_url ? (
        <img
          src={item.image_url}
          alt={item.name}
          className="w-9 h-9 rounded-lg object-cover shrink-0 border border-white/10"
        />
      ) : (
        <div className="w-9 h-9 rounded-lg bg-white/5 border border-white/8 shrink-0 flex items-center justify-center text-muted text-lg">
          {CATEGORY_LABELS[item.category]?.icon ?? '🍽️'}
        </div>
      )}

      {/* Info */}
      <div className="flex flex-col gap-0.5 min-w-0 flex-1">
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

      {/* Actions */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={() => onEdit(item)}
          aria-label="Editar ítem"
          className="p-1.5 rounded-lg text-muted hover:text-cream hover:bg-white/8 transition-colors"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
        </button>
        <button
          type="button"
          onClick={() => onDelete(item)}
          aria-label="Eliminar ítem"
          className="p-1.5 rounded-lg text-muted hover:text-red-400 hover:bg-red-400/10 transition-colors"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
            <path d="M10 11v6M14 11v6" />
            <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
          </svg>
        </button>
        <AvailableToggle item={item} onToggle={onToggle} />
      </div>
    </div>
  )
}

// ─── CategorySection ──────────────────────────────────────────────────────────

function CategorySection({
  catKey,
  items,
  onToggle,
  onEdit,
  onDelete,
  onDeleteCategory,
}: {
  catKey: string
  items: AdminMenuItem[]
  onToggle: (id: string, current: boolean) => Promise<void>
  onEdit: (item: AdminMenuItem) => void
  onDelete: (item: AdminMenuItem) => void
  onDeleteCategory: (catKey: string) => void
}) {
  const [open, setOpen] = useState(true)
  const meta = CATEGORY_LABELS[catKey]
  const activeCount = items.filter(i => i.available).length

  return (
    <section>
      <div className="flex items-center justify-between mb-2 px-1">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => onDeleteCategory(catKey)}
            aria-label={`Eliminar categoría ${meta?.label ?? catKey}`}
            title="Eliminar categoría y todos sus productos"
            className="p-1.5 rounded-lg text-muted hover:text-red-400 hover:bg-red-400/10 transition-colors shrink-0"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
              <path d="M10 11v6M14 11v6" />
              <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => setOpen(prev => !prev)}
            className="flex items-center gap-2 group"
          >
            <span className="text-lg">{meta?.icon}</span>
            <h2 className="text-cream font-heading text-xl tracking-wider">{meta?.label ?? catKey}</h2>
            <span
              className={[
                'text-muted transition-transform duration-200 text-base ml-1',
                open ? 'rotate-0' : '-rotate-90',
              ].join(' ')}
            >
              ▾
            </span>
          </button>
        </div>
        <span className="text-muted text-xs">
          {activeCount}/{items.length} activos
        </span>
      </div>

      {open && (
        <div className="bg-bg-card rounded-2xl overflow-hidden border border-white/5 divide-y divide-white/5">
          {items.map(item => (
            <MenuItemRow
              key={item.id}
              item={item}
              onToggle={onToggle}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </section>
  )
}

// ─── DeleteConfirmModal ───────────────────────────────────────────────────────

function DeleteConfirmModal({
  item,
  deleting,
  onConfirm,
  onCancel,
}: {
  item: AdminMenuItem
  deleting: boolean
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm bg-bg-card rounded-2xl border border-white/10 shadow-2xl p-6 flex flex-col gap-5">
        <div>
          <h3 className="font-heading text-xl text-cream tracking-wide mb-1">Eliminar producto</h3>
          <p className="text-muted text-sm font-body leading-relaxed">
            ¿Confirmas que querés eliminar <span className="text-cream font-medium">{item.name}</span>? Esta acción no se puede deshacer.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 rounded-xl border border-white/10 text-muted hover:text-cream text-sm font-body transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={deleting}
            className="flex-1 px-4 py-2.5 rounded-xl bg-red-500/80 hover:bg-red-500 text-white text-sm font-body transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {deleting ? (
              <>
                <span className="inline-block w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Eliminando…
              </>
            ) : (
              'Eliminar'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── CategoryDeleteConfirmModal ───────────────────────────────────────────────

function CategoryDeleteConfirmModal({
  label,
  count,
  deleting,
  onConfirm,
  onCancel,
}: {
  label: string
  count: number
  deleting: boolean
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm bg-bg-card rounded-2xl border border-white/10 shadow-2xl p-6 flex flex-col gap-5">
        <div>
          <h3 className="font-heading text-xl text-cream tracking-wide mb-1">Eliminar categoría</h3>
          <p className="text-muted text-sm font-body leading-relaxed">
            Vas a eliminar la categoría <span className="text-cream font-medium">{label}</span> y sus{' '}
            <span className="text-red-400 font-medium">{count} producto{count === 1 ? '' : 's'}</span>.
            Esta acción no se puede deshacer.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 rounded-xl border border-white/10 text-muted hover:text-cream text-sm font-body transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={deleting}
            className="flex-1 px-4 py-2.5 rounded-xl bg-red-500/80 hover:bg-red-500 text-white text-sm font-body transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {deleting ? (
              <>
                <span className="inline-block w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Eliminando…
              </>
            ) : (
              `Eliminar ${count} ítem${count === 1 ? '' : 's'}`
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── AdminPanel ───────────────────────────────────────────────────────────────

export default function AdminPanel() {
  const { grouped, allItems, loading, mutating, error, toggleAvailable, insertItem, updateItem, deleteItem, deleteCategory, bulkUpdatePrices, bulkImport, refetch } = useAdminMenu()

  const [formItem, setFormItem] = useState<AdminMenuItem | null | 'new'>(null)
  const [deleteTarget, setDeleteTarget] = useState<AdminMenuItem | null>(null)
  const [deleteCatTarget, setDeleteCatTarget] = useState<string | null>(null)
  const [bulkOpen, setBulkOpen] = useState(false)

  async function handleLogout() {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  async function handleSave(input: AdminMenuItemInput, imageFile?: File) {
    if (formItem === 'new') {
      await insertItem(input, imageFile)
    } else if (formItem) {
      await updateItem(formItem.id, input, imageFile)
    }
    setFormItem(null)
  }

  async function handleDeleteConfirm() {
    if (!deleteTarget) return
    await deleteItem(deleteTarget.id)
    setDeleteTarget(null)
  }

  async function handleDeleteCategoryConfirm() {
    if (!deleteCatTarget) return
    await deleteCategory(deleteCatTarget)
    setDeleteCatTarget(null)
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
      <header className="sticky top-0 z-10 bg-bg-deep/95 backdrop-blur border-b border-white/5 px-4 py-4 flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
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
            className="text-muted hover:text-cream text-xs transition-colors px-3 py-2 rounded-lg hover:bg-white/5 shrink-0"
          >
            Salir
          </button>
        </div>
        {/* Acciones — se apilan/envuelven en mobile (375px) */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setFormItem('new')}
            className="flex items-center gap-1.5 bg-accent hover:bg-accent/90 text-white text-xs font-body font-medium px-3 py-2 rounded-xl transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Nuevo producto
          </button>
          <button
            onClick={() => setBulkOpen(true)}
            className="flex items-center gap-1.5 bg-white/5 hover:bg-white/10 text-cream text-xs font-body font-medium px-3 py-2 rounded-xl transition-colors border border-white/10"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="19" y1="5" x2="5" y2="19" />
              <circle cx="6.5" cy="6.5" r="2.5" />
              <circle cx="17.5" cy="17.5" r="2.5" />
            </svg>
            Aumentar precios %
          </button>
          <ImportExportBar items={allItems} saving={mutating} onImport={bulkImport} />
        </div>
      </header>

      {/* Hint */}
      <div className="px-4 pt-5 pb-2">
        <p className="text-muted text-xs leading-relaxed">
          Activá o desactivá ítems según disponibilidad. Los cambios se reflejan en la carta al instante.
          Para editar precios en masa usá <span className="text-cream">Aumentar precios %</span> o exportá/importá un <span className="text-cream">Excel (.xlsx)</span>.
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
            onEdit={item => setFormItem(item)}
            onDelete={item => setDeleteTarget(item)}
            onDeleteCategory={key => setDeleteCatTarget(key)}
          />
        ))}
      </div>

      {/* Form modal (new or edit) */}
      {formItem !== null && (
        <ItemFormModal
          item={formItem === 'new' ? null : formItem}
          saving={mutating}
          onSave={handleSave}
          onClose={() => setFormItem(null)}
        />
      )}

      {/* Delete confirmation */}
      {deleteTarget && (
        <DeleteConfirmModal
          item={deleteTarget}
          deleting={mutating}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      {/* Category delete confirmation */}
      {deleteCatTarget && (
        <CategoryDeleteConfirmModal
          label={CATEGORY_LABELS[deleteCatTarget]?.label ?? deleteCatTarget}
          count={grouped[deleteCatTarget]?.length ?? 0}
          deleting={mutating}
          onConfirm={handleDeleteCategoryConfirm}
          onCancel={() => setDeleteCatTarget(null)}
        />
      )}

      {/* Bulk price editor */}
      {bulkOpen && (
        <BulkPriceModal
          items={allItems}
          saving={mutating}
          onApply={bulkUpdatePrices}
          onClose={() => setBulkOpen(false)}
        />
      )}
    </div>
  )
}

import { useState } from 'react'
import { createPortal } from 'react-dom'
import type { AdminMenuItem, AdminMenuItemInput, Category } from '../../types'

const EMPTY_FORM: Omit<AdminMenuItemInput, 'category'> = {
  name: '',
  description: null,
  price: 0,
  sort_order: 0,
  available: true,
  is_signature: false,
  tags: [],
  image_url: null,
}

function inputClass(extra = '') {
  return [
    // text-base = 16px: evita el auto-zoom de iOS al enfocar inputs <16px.
    'w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5',
    'text-cream text-base font-body placeholder:text-muted',
    // Focus minimo: solo un cambio sutil de borde, sin ring/glow.
    'focus:outline-none focus:border-accent/40',
    'transition-colors',
    extra,
  ].join(' ')
}

function labelClass() {
  return 'block text-muted text-xs font-body mb-1.5 uppercase tracking-wider'
}

interface Props {
  item?: AdminMenuItem | null
  categories: Category[]
  saving: boolean
  onSave: (input: AdminMenuItemInput, imageFile?: File) => Promise<void>
  onClose: () => void
}

export default function ItemFormModal({ item, categories, saving, onSave, onClose }: Props) {
  const [form, setForm] = useState<AdminMenuItemInput>(
    item
      ? {
          name: item.name,
          description: item.description,
          price: item.price,
          category: item.category,
          sort_order: item.sort_order,
          available: item.available,
          is_signature: item.is_signature,
          tags: item.tags ?? [],
          image_url: item.image_url,
        }
      : { ...EMPTY_FORM, category: categories[0]?.key ?? '' },
  )

  const [priceInput, setPriceInput] = useState(item ? String(item.price) : '')
  const [orderInput, setOrderInput] = useState(item ? String(item.sort_order) : '')
  const [tagInput, setTagInput] = useState((item?.tags ?? []).join(', '))
  const [imageFile, setImageFile] = useState<File | undefined>(undefined)
  const [imagePreview, setImagePreview] = useState<string | null>(item?.image_url ?? null)
  const [formError, setFormError] = useState<string | null>(null)
  // Sin autofocus: el dueno no quiere foco automatico en ningun momento.

  // Sync tags from text input
  function handleTagInput(value: string) {
    setTagInput(value)
    const parsed = value
      .split(',')
      .map(t => t.trim())
      .filter(Boolean)
    setForm(prev => ({ ...prev, tags: parsed }))
  }

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  // Cierre solo via Cancelar o la cruz: evitamos perder datos por
  // un click fuera del form o un Escape accidental (no cerramos aca).

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFormError(null)

    if (!form.name.trim()) {
      setFormError('El nombre es obligatorio.')
      return
    }
    if (form.price <= 0) {
      setFormError('El precio debe ser mayor a 0.')
      return
    }

    try {
      await onSave(form, imageFile)
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Error al guardar.')
    }
  }

  const isEdit = Boolean(item)

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
    >
      <div className="w-full max-w-md bg-bg-card rounded-2xl border border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[88dvh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/8 shrink-0">
          <h2 className="font-heading text-2xl text-cream tracking-wider">
            {isEdit ? 'Editar producto' : 'Nuevo producto'}
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 px-5 py-5 flex flex-col gap-4">

          {/* Name */}
          <div>
            <label className={labelClass()}>Nombre *</label>
            <input
              type="text"
              value={form.name}
              onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Ej: Pizza Margherita"
              className={inputClass()}
            />
          </div>

          {/* Description */}
          <div>
            <label className={labelClass()}>Descripción</label>
            <textarea
              value={form.description ?? ''}
              onChange={e => setForm(prev => ({ ...prev, description: e.target.value || null }))}
              placeholder="Ingredientes o descripción breve"
              rows={2}
              className={inputClass('resize-none')}
            />
          </div>

          {/* Price + Category row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass()}>Precio (ARS) *</label>
              <input
                type="number"
                min={0}
                step={50}
                value={priceInput}
                placeholder="0"
                onChange={e => {
                  setPriceInput(e.target.value)
                  setForm(prev => ({ ...prev, price: Number(e.target.value) || 0 }))
                }}
                className={inputClass()}
              />
            </div>
            <div>
              <label className={labelClass()}>Categoría *</label>
              <select
                value={form.category}
                onChange={e => setForm(prev => ({ ...prev, category: e.target.value }))}
                className={inputClass('cursor-pointer')}
              >
                {categories.map(c => (
                  <option key={c.key} value={c.key} className="bg-[#1A1A1A]">
                    {c.icon} {c.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Sort order */}
          <div>
            <label className={labelClass()}>Orden</label>
            <input
              type="number"
              min={0}
              value={orderInput}
              placeholder="0"
              onChange={e => {
                setOrderInput(e.target.value)
                setForm(prev => ({ ...prev, sort_order: Number(e.target.value) || 0 }))
              }}
              className={inputClass()}
            />
          </div>

          {/* Tags */}
          <div>
            <label className={labelClass()}>Tags (separados por coma)</label>
            <input
              type="text"
              value={tagInput}
              onChange={e => handleTagInput(e.target.value)}
              placeholder="vegetariano, sin-tacc, picante"
              className={inputClass()}
            />
            {form.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {form.tags.map(tag => (
                  <span
                    key={tag}
                    className="text-[11px] px-2 py-0.5 rounded-full bg-accent/15 text-accent-warm border border-accent/20"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Toggles */}
          <div className="flex gap-6">
            <Toggle
              label="Disponible"
              checked={form.available}
              onChange={v => setForm(prev => ({ ...prev, available: v }))}
            />
            <Toggle
              label="Signature"
              checked={form.is_signature}
              onChange={v => setForm(prev => ({ ...prev, is_signature: v }))}
            />
          </div>

          {/* Image */}
          <div>
            <label className={labelClass()}>Imagen</label>
            <label className="flex items-center gap-3 cursor-pointer group">
              <div className="flex-1 bg-white/5 border border-white/10 border-dashed rounded-xl px-3 py-2.5 text-muted text-sm font-body group-hover:border-accent/40 transition-colors">
                {imageFile ? imageFile.name : 'Seleccionar archivo…'}
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
            </label>
            {imagePreview && (
              <div className="mt-2 relative w-24 h-24">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-24 h-24 object-cover rounded-xl border border-white/10"
                />
                <button
                  type="button"
                  onClick={() => {
                    setImageFile(undefined)
                    setImagePreview(null)
                    setForm(prev => ({ ...prev, image_url: null }))
                  }}
                  className="absolute -top-1.5 -right-1.5 bg-bg-card border border-white/15 rounded-full w-5 h-5 flex items-center justify-center text-muted hover:text-cream transition-colors text-xs"
                  aria-label="Quitar imagen"
                >
                  ×
                </button>
              </div>
            )}
          </div>

          {formError && (
            <p className="text-red-400 text-sm font-body">{formError}</p>
          )}
        </form>

        {/* Footer actions */}
        <div className="px-5 py-4 border-t border-white/8 shrink-0 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-xl border border-white/10 text-muted hover:text-cream hover:border-white/20 text-sm font-body transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="item-form"
            disabled={saving}
            onClick={handleSubmit}
            className="flex-1 px-4 py-2.5 rounded-xl bg-accent hover:bg-accent/90 text-white text-sm font-body font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {saving ? (
              <>
                <span className="inline-block w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Guardando…
              </>
            ) : (
              isEdit ? 'Guardar cambios' : 'Crear producto'
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <label className="flex items-center gap-2.5 cursor-pointer select-none">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={[
          'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/50',
          checked ? 'bg-accent' : 'bg-white/10',
        ].join(' ')}
      >
        <span
          className={[
            'inline-block h-4 w-4 rounded-full bg-white shadow transition-transform duration-200',
            checked ? 'translate-x-6' : 'translate-x-1',
          ].join(' ')}
        />
      </button>
      <span className="text-cream text-sm font-body">{label}</span>
    </label>
  )
}

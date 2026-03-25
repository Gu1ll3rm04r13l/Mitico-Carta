import { useState } from 'react'
import { MENU_CATEGORIES } from '../data/menuData'
import type { MenuCategory, MenuItem, DietaryTag } from '../types'

// ─── Helpers ───────────────────────────────────────────────────────────────

const TAG_CONFIG: Record<DietaryTag, { bg: string; color: string; label: string }> = {
  vegetariano: { bg: 'rgba(34,197,94,0.12)', color: '#4ade80', label: 'Vegetariano' },
  vegano: { bg: 'rgba(134,239,172,0.12)', color: '#86efac', label: 'Vegano' },
  'sin-tacc': { bg: 'rgba(251,191,36,0.12)', color: '#fbbf24', label: 'Sin TACC' },
  picante: { bg: 'rgba(248,113,113,0.12)', color: '#f87171', label: 'Picante 🌶' },
}

function formatPrice(price: number): string {
  return `$${price.toLocaleString('es-AR')}`
}

// ─── MenuCard ──────────────────────────────────────────────────────────────

function MenuCard({ item }: { item: MenuItem }) {
  return (
    <article
      className="rounded-xl p-4 flex flex-col gap-2.5"
      style={{
        backgroundColor: '#1A1A1A',
        border: '1px solid rgba(245,230,200,0.06)',
      }}
    >
      {/* Nombre + precio */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3
              className="text-base font-semibold leading-snug"
              style={{ color: '#F5E6C8', fontFamily: 'Inter, sans-serif' }}
            >
              {item.name}
            </h3>
            {item.isSignature && (
              <span
                className="text-[9px] font-bold tracking-widest uppercase px-1.5 py-0.5 rounded shrink-0"
                style={{ backgroundColor: 'rgba(232,98,42,0.18)', color: '#E8622A' }}
              >
                SIGNATURE
              </span>
            )}
          </div>
          <p
            className="text-sm mt-1 leading-relaxed"
            style={{ color: '#8A8070', fontFamily: 'Inter, sans-serif' }}
          >
            {item.description}
          </p>
        </div>

        {/* Precio */}
        <div className="text-right shrink-0">
          <p
            className="font-semibold text-base"
            style={{ color: '#E8622A', fontFamily: 'Inter, sans-serif' }}
          >
            {formatPrice(item.price)}
          </p>
          {item.priceMedia !== undefined && (
            <p className="text-xs mt-0.5" style={{ color: '#8A8070', fontFamily: 'Inter, sans-serif' }}>
              Media: {formatPrice(item.priceMedia)}
            </p>
          )}
        </div>
      </div>

      {/* Tags dietéticos */}
      {item.tags && item.tags.length > 0 && (
        <div className="flex gap-1 flex-wrap">
          {item.tags.map(tag => (
            <span
              key={tag}
              className="text-[10px] font-medium px-1.5 py-0.5 rounded"
              style={{
                backgroundColor: TAG_CONFIG[tag].bg,
                color: TAG_CONFIG[tag].color,
              }}
            >
              {TAG_CONFIG[tag].label}
            </span>
          ))}
        </div>
      )}
    </article>
  )
}

// ─── CategoryTab ───────────────────────────────────────────────────────────

interface CategoryTabProps {
  category: MenuCategory
  isActive: boolean
  onClick: () => void
}

function CategoryTab({ category, isActive, onClick }: CategoryTabProps) {
  return (
    <button
      role="tab"
      aria-selected={isActive}
      onClick={onClick}
      className="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200 shrink-0"
      style={
        isActive
          ? { backgroundColor: '#E8622A', color: '#fff', fontFamily: 'Inter, sans-serif' }
          : {
              backgroundColor: 'rgba(245,230,200,0.06)',
              color: '#8A8070',
              fontFamily: 'Inter, sans-serif',
            }
      }
    >
      <span aria-hidden="true">{category.icon}</span>
      {category.label}
    </button>
  )
}

// ─── Menu ──────────────────────────────────────────────────────────────────

export default function Menu() {
  const [activeId, setActiveId] = useState<MenuCategory['id']>(MENU_CATEGORIES[0].id)

  const activeCategory = MENU_CATEGORIES.find(c => c.id === activeId)!

  return (
    <section id="menu" style={{ backgroundColor: '#0D0D0D', paddingTop: '5rem', paddingBottom: '6rem' }}>
      <div className="max-w-3xl mx-auto px-5 md:px-10">

        {/* Encabezado */}
        <div className="mb-10">
          <span
            className="inline-block mb-3 text-xs font-semibold tracking-widest uppercase"
            style={{ color: '#E8622A', fontFamily: 'Inter, sans-serif' }}
          >
            Lo que hacemos
          </span>
          <h2
            className="leading-none uppercase"
            style={{
              fontFamily: '"Bebas Neue", sans-serif',
              fontSize: 'clamp(2.5rem, 8vw, 4.5rem)',
              color: '#F5E6C8',
            }}
          >
            La Carta
          </h2>
        </div>

        {/* Tabs de categorías — scroll horizontal en móvil */}
        <div
          className="flex gap-1.5 overflow-x-auto pb-1 mb-8 -mx-1 px-1"
          style={{ scrollbarWidth: 'none' }}
          role="tablist"
          aria-label="Categorías del menú"
        >
          {MENU_CATEGORIES.map(cat => (
            <CategoryTab
              key={cat.id}
              category={cat}
              isActive={cat.id === activeId}
              onClick={() => setActiveId(cat.id)}
            />
          ))}
        </div>

        {/* Grid de items */}
        <div
          role="tabpanel"
          aria-label={activeCategory.label}
          className="grid gap-3"
          style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 320px), 1fr))' }}
        >
          {activeCategory.items.map(item => (
            <MenuCard key={item.id} item={item} />
          ))}
        </div>

        {/* Nota al pie */}
        <p
          className="mt-10 text-center text-xs"
          style={{ color: '#8A8070', fontFamily: 'Inter, sans-serif' }}
        >
          Precios en pesos argentinos · Sujetos a cambios sin previo aviso
        </p>
      </div>
    </section>
  )
}

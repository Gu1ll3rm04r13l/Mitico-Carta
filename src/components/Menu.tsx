import { useState } from 'react'
import { MENU_CATEGORIES } from '../data/menuData'
import type { MenuCategory, MenuItem } from '../types'

// ─── Helpers ───────────────────────────────────────────────────────────────

function formatPrice(price: number): string {
  return `$${price.toLocaleString('es-AR')}`
}

// ─── MenuCard ──────────────────────────────────────────────────────────────

function MenuCard({ item }: { item: MenuItem }) {
  return (
    <article
      className="rounded-xl p-4 flex flex-col gap-2.5 transition-transform duration-200 active:scale-[0.98]"
      style={{
        backgroundColor: '#1A1A1A',
        border: '1px solid rgba(245,230,200,0.06)',
      }}
    >
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
                MÍTICO
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

        <div className="text-right shrink-0">
          <p
            className="font-semibold text-base"
            style={{ color: '#E8622A', fontFamily: 'Inter, sans-serif' }}
          >
            {formatPrice(item.price)}
          </p>
        </div>
      </div>
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
      // shrink-0 para móvil, pero permitimos crecer/encoger en desktop si es necesario
      className="flex items-center gap-1.5 px-5 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200 shrink-0 md:shrink border"
      style={
        isActive
          ? { 
              backgroundColor: '#E8622A', 
              color: '#fff', 
              borderColor: '#E8622A',
              fontFamily: 'Inter, sans-serif',
              boxShadow: '0 4px 12px rgba(232,98,42,0.2)' 
            }
          : {
              backgroundColor: 'rgba(245,230,200,0.03)',
              color: '#8A8070',
              borderColor: 'rgba(245,230,200,0.1)',
              fontFamily: 'Inter, sans-serif',
            }
      }
    >
      <span className="text-lg" aria-hidden="true">{category.icon}</span>
      {category.label}
    </button>
  )
}

// ─── Menu ──────────────────────────────────────────────────────────────────

interface MenuProps {
  isOpen: boolean
  onToggle: () => void
}

export default function Menu({ isOpen, onToggle }: MenuProps) {
  const [activeId, setActiveId] = useState<MenuCategory['id']>(MENU_CATEGORIES[0].id)

  const activeCategory = MENU_CATEGORIES.find(c => c.id === activeId) || MENU_CATEGORIES[0]

  return (
    <section id="menu" style={{ backgroundColor: '#0D0D0D', paddingTop: '5rem', paddingBottom: '6rem' }}>
      <div className="max-w-4xl mx-auto px-5 md:px-10">

        {/* Encabezado */}
        <div className="mb-8">
          <span
            className="inline-block mb-3 text-xs font-semibold tracking-widest uppercase"
            style={{ color: '#E8622A', fontFamily: 'Inter, sans-serif' }}
          >
            Nuestra propuesta
          </span>
          <div className="flex items-center justify-between">
            <h2
              className="leading-none uppercase"
              style={{
                fontFamily: '"Bebas Neue", sans-serif',
                fontSize: 'clamp(3rem, 10vw, 5rem)',
                color: '#F5E6C8',
              }}
            >
              La Carta
            </h2>
            <button
              onClick={onToggle}
              aria-expanded={isOpen}
              aria-controls="menu-body"
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold tracking-widest uppercase border transition-colors duration-200"
              style={{
                fontFamily: 'Inter, sans-serif',
                color: isOpen ? '#8A8070' : '#E8622A',
                borderColor: isOpen ? 'rgba(245,230,200,0.1)' : 'rgba(232,98,42,0.4)',
                backgroundColor: isOpen ? 'rgba(245,230,200,0.03)' : 'rgba(232,98,42,0.08)',
              }}
            >
              {isOpen ? 'Comprimir' : 'Ver carta'}
              <svg
                width="13"
                height="13"
                viewBox="0 0 14 14"
                fill="none"
                aria-hidden="true"
                style={{
                  transition: 'transform 0.35s ease',
                  transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                }}
              >
                <path d="M2 5l5 5 5-5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </div>

        {/* Cuerpo colapsable */}
        <div
          id="menu-body"
          style={{
            display: 'grid',
            gridTemplateRows: isOpen ? '1fr' : '0fr',
            transition: 'grid-template-rows 0.4s ease',
          }}
        >
          <div style={{ overflow: 'hidden', minHeight: 0 }}>

            {/* Contenedor de Tabs - FLEX-WRAP para Escritorio */}
            <div className="relative mb-10">
              <div
                className="flex flex-nowrap md:flex-wrap gap-2 overflow-x-auto md:overflow-visible pb-4 md:pb-0 no-scrollbar -mx-5 px-5 md:mx-0 md:px-0"
                role="tablist"
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
              {/* Sombra sutil solo en móvil */}
              <div className="absolute right-0 top-0 bottom-4 w-12 bg-gradient-to-l from-[#0D0D0D] to-transparent pointer-events-none md:hidden" />
            </div>

            {/* Grid de items */}
            <div
              role="tabpanel"
              key={activeId}
              className="grid gap-4 animate-in fade-in duration-500"
              style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 340px), 1fr))' }}
            >
              {activeCategory.items.map(item => (
                <MenuCard key={item.id} item={item} />
              ))}
            </div>

            {/* Nota al pie */}
            <div className="mt-16 pt-8 border-t border-white/5 text-center">
              <p
                className="text-xs uppercase tracking-widest"
                style={{ color: '#8A8070', fontFamily: 'Inter, sans-serif' }}
              >
                Mítico Pizza & Cocktails  · Miramar
              </p>
              <p className="mt-2 text-[10px] text-white/20">
                Precios sujetos a cambios sin previo aviso
              </p>
            </div>

          </div>
        </div>

      </div>
    </section>
  )
}
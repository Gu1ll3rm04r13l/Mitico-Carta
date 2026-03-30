const HERO_IMAGE = 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=1600&q=80'

interface HeroProps {
  onReserveClick: () => void
  onOrderClick: () => void
  onMenuClick: () => void
}

export default function Hero({ onReserveClick, onOrderClick, onMenuClick }: HeroProps) {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#0D0D0D]">
      {/* Imagen de fondo con tratamiento para resaltar la pizza */}
      <div className="absolute inset-0 z-0">
        <img
          src={HERO_IMAGE}
          alt="Mítico Pizza"
          className="w-full h-full object-cover opacity-70 brightness-[0.45] contrast-[1.25] saturate-[1.1]"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/20 to-[#0D0D0D]" />
      </div>

      <div className="relative z-10 text-center px-6">
        <span
          className="block mb-4 text-[11px] tracking-[0.3em] uppercase text-[#E8622A] font-semibold"
          style={{ fontFamily: 'Inter, sans-serif' }}
        >
          Pizzería & Cocktail
        </span>

        <h1
          className="mb-6 uppercase tracking-tight"
          style={{
            fontFamily: '"Prata", serif',
            fontSize: 'clamp(4rem, 15vw, 9rem)',
            color: '#F5E6C8',
            letterSpacing: '-0.02em',
            fontWeight: '400',
          }}
        >
          Mítico
        </h1>

        <div
          className="max-w-md mx-auto mb-10 text-lg md:text-xl text-[#F5E6C8]/60 italic"
          style={{ fontFamily: '"Prata", serif' }}
        >
          <p>Pizza de masa madre & Bebidas con criterio.</p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={onReserveClick}
            className="px-10 py-4 bg-[#E8622A] text-white font-bold uppercase tracking-widest text-sm transition-all hover:bg-[#ff7a45]"
          >
            Reservar mesa
          </button>
          <button
            onClick={onOrderClick}
            className="px-10 py-4 font-bold uppercase tracking-widest text-sm transition-all hover:opacity-85 active:scale-[0.97]"
            style={{ backgroundColor: '#C4963A', color: '#fff' }}
          >
            Hacer pedido
          </button>
          <a
            href="#menu"
            onClick={onMenuClick}
            className="px-10 py-4 border border-[#F5E6C8]/30 text-[#F5E6C8] font-bold uppercase tracking-widest text-sm hover:bg-white/5"
          >
            Ver carta
          </a>
        </div>
      </div>
    </section>
  )
}

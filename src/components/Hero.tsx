const HERO_IMAGE = 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=1600&q=80'

interface HeroProps {
  onReserveClick: () => void
  onOrderClick: () => void
  onMenuClick: () => void
}

export default function Hero({ onReserveClick, onOrderClick, onMenuClick }: HeroProps) {
  return (
    <section className="relative min-h-dvh flex items-center justify-center overflow-hidden bg-bg-deep">
      <div className="absolute inset-0 z-0">
        <img
          src={HERO_IMAGE}
          alt="Mítico Pizza"
          className="w-full h-full object-cover opacity-70 brightness-[0.45] contrast-[1.25] saturate-[1.1]"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/20 to-bg-deep" />
      </div>

      <div className="relative z-10 text-center px-6">
        <span className="block mb-4 text-[11px] tracking-[0.3em] uppercase text-accent font-body font-semibold">
          Pizzería & Cocktail
        </span>

        <h1
          className="mb-6 uppercase tracking-tight text-cream font-normal"
          style={{
            fontFamily: '"Prata", serif',
            fontSize: 'clamp(4rem, 15vw, 9rem)',
            letterSpacing: '-0.02em',
          }}
        >
          Mítico
        </h1>

        <div
          className="max-w-md mx-auto mb-10 text-lg md:text-xl text-cream/60 italic"
          style={{ fontFamily: '"Prata", serif' }}
        >
          <p>Pizza de masa madre & Bebidas con criterio.</p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={onReserveClick}
            className="px-10 py-4 bg-accent text-white font-bold uppercase tracking-widest text-sm transition-all hover:bg-[#ff7a45]"
          >
            Reservar mesa
          </button>
          <button
            onClick={onOrderClick}
            className="px-10 py-4 bg-accent-warm text-white font-bold uppercase tracking-widest text-sm transition-all hover:opacity-85 active:scale-[0.97]"
          >
            Delivery
          </button>
          <a
            href="#menu"
            onClick={onMenuClick}
            className="px-10 py-4 border border-cream/30 text-cream font-bold uppercase tracking-widest text-sm hover:bg-white/5"
          >
            Ver carta
          </a>
        </div>
      </div>
    </section>
  )
}

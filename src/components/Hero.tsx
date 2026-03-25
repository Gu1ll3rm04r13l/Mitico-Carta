const HERO_IMAGE =
  'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=1600&q=80'

interface HeroProps {
  onReserveClick: () => void
}

export default function Hero({ onReserveClick }: HeroProps) {
  return (
    <section
      id="inicio"
      className="relative min-h-screen flex items-end pb-16 md:pb-24 overflow-hidden"
      aria-label="Hero principal"
    >
      {/* Imagen de fondo con overlay */}
      <div className="absolute inset-0 z-0">
        <img
          src={HERO_IMAGE}
          alt="Pizza artesanal Mítico"
          className="w-full h-full object-cover object-center"
          loading="eager"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0D0D0D] via-[#0D0D0D]/60 to-[#0D0D0D]/20" />
      </div>

      {/* Contenido */}
      <div className="relative z-10 w-full max-w-6xl mx-auto px-5 md:px-10">

        {/* Badge */}
        <span
          className="inline-block mb-4 px-3 py-1 text-xs font-semibold tracking-widest uppercase border rounded-full"
          style={{
            color: '#E8622A',
            borderColor: 'rgba(232,98,42,0.4)',
            fontFamily: 'Inter, sans-serif',
          }}
        >
          Pizzería · Bar
        </span>

        {/* Título */}
        <h1
          className="leading-none mb-2 uppercase"
          style={{
            fontFamily: '"Bebas Neue", sans-serif',
            fontSize: 'clamp(4rem, 14vw, 10rem)',
            color: '#F5E6C8',
          }}
        >
          Mítico
        </h1>

        {/* Tagline */}
        <p
          className="mb-8 max-w-md leading-relaxed"
          style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: 'clamp(1rem, 3vw, 1.375rem)',
            color: 'rgba(245,230,200,0.70)',
          }}
        >
          Pizza de masa madre. Bebidas con criterio.
          <br />
          Una noche que no olvidarás.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={onReserveClick}
            className="inline-flex items-center justify-center px-8 py-4 rounded-md font-semibold text-base tracking-wide transition-all duration-200 hover:opacity-85 active:scale-[0.97]"
            style={{
              backgroundColor: '#E8622A',
              color: '#fff',
              fontFamily: 'Inter, sans-serif',
            }}
          >
            Reservar mesa
          </button>
          <a
            href="#menu"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-md font-semibold text-base tracking-wide transition-all duration-200 hover:bg-white/10 active:scale-[0.97]"
            style={{
              border: '1px solid rgba(245,230,200,0.30)',
              color: '#F5E6C8',
              fontFamily: 'Inter, sans-serif',
            }}
          >
            Ver carta
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </a>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-1 opacity-40">
        <div
          className="w-px h-10 animate-pulse"
          style={{ backgroundColor: 'rgba(245,230,200,0.5)' }}
        />
        <span
          className="text-[10px] tracking-widest uppercase"
          style={{ color: 'rgba(245,230,200,0.6)', fontFamily: 'Inter, sans-serif' }}
        >
          Scroll
        </span>
      </div>
    </section>
  )
}

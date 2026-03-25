interface FooterProps {
  onCancelClick: () => void
}

export default function Footer({ onCancelClick }: FooterProps) {
  return (
    <footer
      className="border-t"
      style={{
        backgroundColor: '#0D0D0D',
        borderColor: 'rgba(245,230,200,0.08)',
      }}
    >
      <div className="max-w-3xl mx-auto px-5 md:px-10 py-12">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-8">

          {/* Marca y horarios */}
          <div className="flex flex-col gap-3">
            <p
              className="text-3xl uppercase leading-none"
              style={{ fontFamily: '"Bebas Neue", sans-serif', color: '#F5E6C8' }}
            >
              Mítico
            </p>
            <p className="text-sm" style={{ color: '#8A8070', fontFamily: 'Inter, sans-serif' }}>
              Pizzería · Bar
            </p>
            <div
              className="text-sm space-y-0.5"
              style={{ color: '#8A8070', fontFamily: 'Inter, sans-serif' }}
            >
              <p><strong>Invierno:</strong> Vie–Sáb 20:00 – 01:30</p>
              <p><strong>Finde largos:</strong> abierto días adicionales</p>
              <p><strong>Verano:</strong> abierto todos los días</p>
            </div>
          </div>

          {/* Links y acción de cancelación */}
          <div className="flex flex-col gap-4">
            {/* Redes */}
            <div className="flex gap-3">
              <a
                href="https://instagram.com/mitico.bar"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-sm transition-colors hover:opacity-80"
                style={{ color: '#8A8070', fontFamily: 'Inter, sans-serif' }}
                aria-label="Instagram de Mítico"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                </svg>
                @mitico.bar
              </a>
            </div>

            {/* Cancelar reserva */}
            <div
              className="pt-3 border-t"
              style={{ borderColor: 'rgba(245,230,200,0.08)' }}
            >
              <p className="text-xs mb-2" style={{ color: '#8A8070', fontFamily: 'Inter, sans-serif' }}>
                ¿Tenés una reserva y no podés venir?
              </p>
              <button
                type="button"
                onClick={onCancelClick}
                className="inline-flex items-center gap-1.5 text-sm font-medium transition-all hover:opacity-80 active:scale-[0.97]"
                style={{ color: '#f87171', fontFamily: 'Inter, sans-serif' }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
                Cancelar mi reserva
              </button>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div
          className="mt-10 pt-6 border-t text-xs"
          style={{ borderColor: 'rgba(245,230,200,0.06)', color: '#8A8070', fontFamily: 'Inter, sans-serif' }}
        >
          © {new Date().getFullYear()} Mítico · Todos los derechos reservados
        </div>
      </div>
    </footer>
  )
}

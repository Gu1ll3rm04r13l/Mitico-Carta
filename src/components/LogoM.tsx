export default function LogoM() {
  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      aria-label="Volver al inicio — Mítico"
      className="fixed top-5 left-5 z-50 group select-none bg-transparent border-0 p-0 cursor-pointer"
      style={{ lineHeight: 1 }}
    >
      <span
        className="block transition-all duration-500 group-hover:scale-110"
        style={{
          fontFamily: '"Bodoni Moda", serif',
          fontSize: 'clamp(2.2rem, 5vw, 3rem)',
          fontWeight: 400,
          color: '#FFFFFF',
          letterSpacing: '-0.02em',
          animation: 'logoGlow 3s ease-in-out infinite',
        }}
      >
        M
      </span>
    </button>
  )
}

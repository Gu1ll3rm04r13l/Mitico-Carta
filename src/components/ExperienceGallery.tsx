import { useRef, useState, useEffect } from 'react'

// Videos
import bartenderVideo from '../assets/videos/bartender.MP4'
import masa1Video from '../assets/videos/masa1.MP4'
import masa2Video from '../assets/videos/masa2.MP4'
import servicioVideo from '../assets/videos/servicio_general.MP4'

// Fotos
import cookingImg from '../assets/images/cooking.jpg'
import eatingImg from '../assets/images/eating.jpg'
import papasImg from '../assets/images/papas.jpg'
import pizzeroImg from '../assets/images/pizzero.jpg'

// ─── Types ──────────────────────────────────────────────────────────────────

type VideoItem = { type: 'video'; src: string }
type ImageItem = { type: 'image'; src: string; alt: string }
type GalleryItem = VideoItem | ImageItem

const GALLERY: GalleryItem[] = [
  { type: 'video',  src: bartenderVideo },
  { type: 'image',  src: cookingImg,  alt: 'Cocina en acción' },
  { type: 'image',  src: eatingImg,   alt: 'Experiencia gastronómica' },
  { type: 'video',  src: masa1Video },
  { type: 'video',  src: masa2Video },
  { type: 'image',  src: papasImg,    alt: 'Papas artesanales' },
  { type: 'image',  src: pizzeroImg,  alt: 'Maestro pizzero' },
  { type: 'video',  src: servicioVideo },
]

// ─── VideoCell ───────────────────────────────────────────────────────────────

interface VideoCellProps {
  src: string
  isActive: boolean
  onActivate: () => void
  onDeactivate: () => void
}

function VideoCell({ src, isActive, onActivate, onDeactivate }: VideoCellProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isSoundOn, setIsSoundOn] = useState(false)

  // Pause when another video becomes active
  useEffect(() => {
    if (!isActive && isPlaying) {
      const v = videoRef.current
      if (v) { v.pause(); v.muted = true }
      setIsPlaying(false)
      setIsSoundOn(false)
    }
  }, [isActive]) // eslint-disable-line react-hooks/exhaustive-deps

  // Load metadata lazily when entering viewport
  useEffect(() => {
    const wrapper = wrapperRef.current
    if (!wrapper) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          const v = videoRef.current
          if (v && v.preload === 'none') {
            v.preload = 'metadata'
            v.load()
          }
          observer.disconnect()
        }
      },
      { threshold: 0.15 }
    )
    observer.observe(wrapper)
    return () => observer.disconnect()
  }, [])

  function handleClick() {
    const v = videoRef.current
    if (!v) return
    if (isPlaying) {
      v.pause()
      v.muted = true
      setIsPlaying(false)
      setIsSoundOn(false)
      onDeactivate()
    } else {
      onActivate()
      v.muted = false
      v.play().catch(() => {
        // Fallback: play muted if browser blocks unmuted autoplay
        v.muted = true
        v.play()
        setIsSoundOn(false)
        return
      })
      setIsPlaying(true)
      setIsSoundOn(!v.muted)
    }
  }

  return (
    <div
      ref={wrapperRef}
      onClick={handleClick}
      className="relative overflow-hidden rounded-xl cursor-pointer aspect-[3/4] select-none"
      style={{ backgroundColor: '#111' }}
    >
      <video
        ref={videoRef}
        src={src}
        preload="none"
        muted
        playsInline
        loop
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* Overlay: paused */}
      <div
        className="absolute inset-0 flex items-end justify-start p-4 transition-opacity duration-300"
        style={{
          background: isPlaying
            ? 'transparent'
            : 'linear-gradient(to top, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.1) 50%, transparent 100%)',
          opacity: isPlaying ? 0 : 1,
          pointerEvents: 'none',
        }}
      >
        {/* Play button */}
        <div
          className="flex items-center justify-center rounded-full"
          style={{
            width: 52,
            height: 52,
            background: 'rgba(255,255,255,0.15)',
            backdropFilter: 'blur(8px)',
            border: '1.5px solid rgba(255,255,255,0.3)',
          }}
        >
          <svg viewBox="0 0 24 24" fill="white" width={22} height={22} style={{ marginLeft: 3 }}>
            <path d="M8 5v14l11-7z" />
          </svg>
        </div>
      </div>

      {/* Sound indicator when playing */}
      {isPlaying && (
        <div
          className="absolute top-3 right-3 flex items-center gap-1 rounded-full px-2 py-1"
          style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(6px)' }}
        >
          {isSoundOn ? (
            <svg viewBox="0 0 24 24" fill="white" width={13} height={13}>
              <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="white" width={13} height={13}>
              <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
            </svg>
          )}
        </div>
      )}
    </div>
  )
}

// ─── ImageCell ───────────────────────────────────────────────────────────────

function ImageCell({ src, alt }: { src: string; alt: string }) {
  return (
    <div className="relative overflow-hidden rounded-xl aspect-[3/4] group">
      <img
        src={src}
        alt={alt}
        loading="lazy"
        decoding="async"
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
      />
      {/* Subtle bottom gradient for depth */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'linear-gradient(to top, rgba(0,0,0,0.3) 0%, transparent 40%)',
        }}
      />
    </div>
  )
}

// ─── ExperienceGallery ───────────────────────────────────────────────────────

export default function ExperienceGallery() {
  const [activeVideoIndex, setActiveVideoIndex] = useState<number | null>(null)

  return (
    <section
      id="experiencia"
      style={{ backgroundColor: '#0D0D0D', paddingTop: '5rem', paddingBottom: '6rem' }}
    >
      <div className="max-w-6xl mx-auto px-5 md:px-10">

        {/* Encabezado */}
        <div className="mb-8">
          <span
            className="inline-block mb-3 text-xs font-semibold tracking-widest uppercase"
            style={{ color: '#E8622A', fontFamily: 'Inter, sans-serif' }}
          >
            Conocé el ambiente
          </span>
          <h2
            className="leading-none uppercase"
            style={{
              fontFamily: '"Bebas Neue", sans-serif',
              fontSize: 'clamp(3rem, 10vw, 5rem)',
              color: '#F5E6C8',
            }}
          >
            La Experiencia
          </h2>
        </div>

        {/* Mosaico */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-1.5 md:gap-2">
          {GALLERY.map((item, i) =>
            item.type === 'video' ? (
              <VideoCell
                key={i}
                src={item.src}
                isActive={activeVideoIndex === i}
                onActivate={() => setActiveVideoIndex(i)}
                onDeactivate={() => setActiveVideoIndex(null)}
              />
            ) : (
              <ImageCell key={i} src={item.src} alt={item.alt} />
            )
          )}
        </div>

      </div>
    </section>
  )
}

import { useState, useRef, useEffect, type KeyboardEvent } from 'react'
import { createPortal } from 'react-dom'
import { useChat, type UseChatReturn } from '../hooks/useChat'
import { buildWhatsAppUrl } from '../hooks/useReservation'
import type { ChatMessage, ChatIntent } from '../types'

// Mensaje pre-cargado al caer al WhatsApp cuando el asistente no responde.
const FALLBACK_WA_URL = buildWhatsAppUrl(
  '¡Buenas Mítico! Quiero hacer un pedido 🍕',
)

// ─── Subcomponentes ─────────────────────────────────────────────────────────

function TypingIndicator() {
  return (
    <div className="flex items-end gap-2 px-1">
      <div className="w-7 h-7 rounded-full bg-accent flex items-center justify-center text-xs shrink-0 text-cream font-heading">
        M
      </div>
      <div className="bg-bg-card rounded-2xl rounded-bl-sm px-4 py-3 flex gap-1 items-center" style={{ minHeight: '2.5rem' }}>
        {[0, 1, 2].map(i => (
          <span
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-muted"
            style={{ animation: `chatDot 1.2s ease-in-out ${i * 0.2}s infinite` }}
          />
        ))}
      </div>
    </div>
  )
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user'
  return (
    <div className={`flex items-end gap-2 px-1 ${isUser ? 'flex-row-reverse' : ''}`}>
      {!isUser && (
        <div className="w-7 h-7 rounded-full bg-accent flex items-center justify-center text-xs text-cream font-heading shrink-0">
          M
        </div>
      )}
      <div
        className={[
          'max-w-[78%] px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap break-words',
          isUser
            ? 'bg-accent text-cream rounded-2xl rounded-br-sm'
            : 'bg-bg-card text-cream rounded-2xl rounded-bl-sm',
        ].join(' ')}
      >
        {message.content}
      </div>
    </div>
  )
}

function OrderButton({ url, onClear }: { url: string; onClear: () => void }) {
  return (
    <div className="mx-3 mb-2 flex items-center gap-2">
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-[0.97]"
        style={{ backgroundColor: '#25D366' }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
        Enviar pedido por WhatsApp
      </a>
      <button
        onClick={onClear}
        className="p-2 rounded-lg text-muted hover:text-cream hover:bg-white/10 transition-colors"
        aria-label="Descartar"
        title="Descartar pedido"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
      </button>
    </div>
  )
}

function FallbackBanner({ onDismiss }: { onDismiss: () => void }) {
  return (
    <div className="mx-3 mb-2 rounded-xl bg-bg-card border border-white/10 px-4 py-3">
      <div className="flex items-start gap-2">
        <span className="shrink-0 text-base leading-none mt-0.5">☕</span>
        <p className="flex-1 text-xs text-cream leading-relaxed">
          El asistente se tomó un descanso 😅 Mandanos tu pedido directo por WhatsApp y te atendemos al toque.
        </p>
        <button
          onClick={onDismiss}
          className="shrink-0 text-muted hover:text-cream transition-colors"
          aria-label="Cerrar aviso"
        >
          ✕
        </button>
      </div>
      <a
        href={FALLBACK_WA_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-2.5 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-[0.97]"
        style={{ backgroundColor: '#25D366' }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
        Hacer pedido por WhatsApp
      </a>
    </div>
  )
}

// ─── ChatPanel ──────────────────────────────────────────────────────────────

function ChatPanel({ onClose, chat }: { onClose: () => void; chat: UseChatReturn }) {
  const { messages, isLoading, error, pendingOrderUrl, sendMessage, clearError, clearOrder } = chat
  const [inputValue, setInputValue] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading, pendingOrderUrl])

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 100)
  }, [])

  const handleSend = async () => {
    const text = inputValue.trim()
    if (!text || isLoading) return
    setInputValue('')
    await sendMessage(text)
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div
      className="flex flex-col rounded-2xl overflow-hidden shadow-2xl border border-white/10"
      style={{
        background: '#111111',
        width: 'min(380px, calc(100vw - 2rem))',
        height: 'min(520px, calc(100dvh - 6rem))',
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10 shrink-0" style={{ background: '#1A1A1A' }}>
        <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center font-heading text-cream text-sm">
          M
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-cream text-sm font-medium leading-tight">Asistente Mítico</p>
          <p className="text-muted text-xs leading-tight">
            {isLoading ? 'Escribiendo...' : 'En línea'}
          </p>
        </div>
        <button
          onClick={onClose}
          className="text-muted hover:text-cream transition-colors p-1 rounded-lg hover:bg-white/10"
          aria-label="Cerrar chat"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto py-4 flex flex-col gap-3 min-h-0">
        {messages.map(msg => (
          <MessageBubble key={msg.id} message={msg} />
        ))}
        {isLoading && <TypingIndicator />}
        <div ref={messagesEndRef} />
      </div>

      {/* Fallback cálido cuando el asistente no responde (server/límite/red) */}
      {error && <FallbackBanner onDismiss={clearError} />}

      {/* Botón WhatsApp cuando el pedido está listo */}
      {pendingOrderUrl && <OrderButton url={pendingOrderUrl} onClear={clearOrder} />}

      {/* Input */}
      <div className="shrink-0 px-3 pb-3 pt-2 border-t border-white/10">
        <div className="flex items-end gap-2 bg-bg-card rounded-xl px-3 py-2">
          <textarea
            ref={inputRef}
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Escribí tu consulta..."
            rows={1}
            className="flex-1 bg-transparent text-cream text-sm placeholder:text-muted resize-none outline-none leading-relaxed"
            style={{ maxHeight: '96px', overflowY: 'auto' }}
          />
          <button
            onClick={handleSend}
            disabled={!inputValue.trim() || isLoading}
            className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed bg-accent hover:opacity-90 active:scale-95"
            aria-label="Enviar"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z" />
            </svg>
          </button>
        </div>
        <p className="text-center text-muted text-[10px] mt-1.5">
          Enter para enviar · Shift+Enter para nueva línea
        </p>
      </div>
    </div>
  )
}

// ─── ChatWidget (raíz flotante) ──────────────────────────────────────────────

interface ChatWidgetProps {
  /** Controlado externamente — si se provee, sobreescribe el estado interno */
  isOpen?: boolean
  onOpenChange?: (open: boolean) => void
  /** Intent para pre-cargar un flujo ('order' = tomar pedido) */
  intent?: ChatIntent
  onIntentHandled?: () => void
}

export default function ChatWidget({
  isOpen: externalIsOpen,
  onOpenChange,
  intent = null,
  onIntentHandled,
}: ChatWidgetProps) {
  const [internalIsOpen, setInternalIsOpen] = useState(false)

  // El estado de la charla vive acá (siempre montado), no en ChatPanel. Así al
  // minimizar el chat para ver la carta no se pierde la conversación.
  const chat = useChat(intent)

  const isControlled = externalIsOpen !== undefined
  const isOpen = isControlled ? externalIsOpen : internalIsOpen

  const setIsOpen = (value: boolean) => {
    if (!isControlled) setInternalIsOpen(value)
    onOpenChange?.(value)
  }

  // Cuando el intent cambia a 'order', abrir automáticamente
  useEffect(() => {
    if (intent === 'order') {
      setIsOpen(true)
      onIntentHandled?.()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [intent])

  return createPortal(
    <div
      className="fixed z-50 flex flex-col items-end gap-3"
      style={{ bottom: 'calc(1.5rem + env(safe-area-inset-bottom))', right: '1.5rem' }}
    >
      {isOpen && (
        <div style={{ animation: 'chatSlideUp 0.2s ease-out', transformOrigin: 'bottom right' }}>
          <ChatPanel onClose={() => setIsOpen(false)} chat={chat} />
        </div>
      )}

      {/* Fila inferior: iconos directos + FAB */}
      <div className="flex items-center gap-3">
      {isOpen && (
        <div className="flex flex-row gap-2">
          <a
            href="https://instagram.com/mitico.bar"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Instagram de Mítico"
            className="w-10 h-10 rounded-full flex items-center justify-center transition-all hover:opacity-90 active:scale-95"
            style={{ background: '#1A1A1A', border: '1px solid rgba(245,230,200,0.12)', boxShadow: '0 2px 12px rgba(0,0,0,0.4)' }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="#C4963A">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
            </svg>
          </a>
          <a
            href="https://wa.me/5492235799301"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="WhatsApp de Mítico"
            className="w-10 h-10 rounded-full flex items-center justify-center transition-all hover:opacity-90 active:scale-95"
            style={{ background: '#1A1A1A', border: '1px solid rgba(245,230,200,0.12)', boxShadow: '0 2px 12px rgba(0,0,0,0.4)' }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="#25D366">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
          </a>
        </div>
      )}

      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 rounded-full bg-accent shadow-lg flex items-center justify-center transition-all hover:opacity-90 active:scale-95"
        aria-label={isOpen ? 'Cerrar asistente' : 'Abrir asistente'}
        style={{ boxShadow: '0 4px 24px rgba(232,98,42,0.4)' }}
      >
        {isOpen ? (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#F5E6C8" strokeWidth="2.5">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        ) : (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#F5E6C8" strokeWidth="2">
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
          </svg>
        )}
      </button>
      </div>
    </div>,
    document.body,
  )
}

import { useState, useCallback, useEffect, useRef } from 'react'
import type { ChatMessage, ChatIntent } from '../types'
import { sendChatMessage } from '../services/ai'
import { WHATSAPP_NUMBER } from './useReservation'

// Marcador que el AI incluye cuando el pedido está confirmado.
const ORDER_MARKER_RE = /\[\[PEDIDO:([\s\S]*?)\]\]/

// Máximo de mensajes que se mandan como contexto a la API.
const MAX_CONTEXT_MESSAGES = 6

const WELCOME_MESSAGE: ChatMessage = {
  id: 'welcome',
  role: 'assistant',
  content: '¡Buenas! Soy el asistente de Mítico 🍕 ¿En qué te puedo ayudar? Puedo contarte sobre el menú, los precios o ayudarte a hacer un pedido.',
  timestamp: Date.now(),
}

const ORDER_WELCOME_MESSAGE: ChatMessage = {
  id: 'welcome',
  role: 'assistant',
  content: '¡Buenas! Vamos con tu pedido 🍕 ¿Qué te provoca pedir hoy? Contame y te armo el resumen.',
  timestamp: Date.now(),
}

// ─── Parseo del marcador ────────────────────────────────────────────────────

/** Extrae el texto del pedido del marcador y limpia el mensaje visible. */
function parseOrderMarker(content: string): { visible: string; orderText: string | null } {
  const match = ORDER_MARKER_RE.exec(content)
  if (!match) return { visible: content, orderText: null }

  const orderText = match[1].trim().replace(/\\n/g, '\n')
  const visible = content.replace(ORDER_MARKER_RE, '').trim()
  return { visible, orderText }
}

/** Construye la URL de WhatsApp con el texto del pedido pre-cargado. */
function buildOrderWhatsAppUrl(orderText: string): string {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(orderText)}`
}

// ─── Hook ───────────────────────────────────────────────────────────────────

export interface UseChatReturn {
  messages: ChatMessage[]
  isLoading: boolean
  error: string | null
  /** URL de WhatsApp con el pedido listo. Aparece cuando la IA confirma el pedido. */
  pendingOrderUrl: string | null
  sendMessage: (text: string) => Promise<void>
  clearError: () => void
  clearOrder: () => void
}

export function useChat(intent: ChatIntent = null): UseChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([
    intent === 'order' ? ORDER_WELCOME_MESSAGE : WELCOME_MESSAGE,
  ])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pendingOrderUrl, setPendingOrderUrl] = useState<string | null>(null)

  // Resetear si cambia el intent (ej: se abre por segunda vez con distinto flujo)
  const prevIntentRef = useRef(intent)
  useEffect(() => {
    if (intent !== prevIntentRef.current) {
      prevIntentRef.current = intent
      setMessages([intent === 'order' ? ORDER_WELCOME_MESSAGE : WELCOME_MESSAGE])
      setPendingOrderUrl(null)
      setError(null)
    }
  }, [intent])

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim()
      if (!trimmed || isLoading) return

      const userMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: 'user',
        content: trimmed,
        timestamp: Date.now(),
      }

      setMessages(prev => [...prev, userMessage])
      setIsLoading(true)
      setError(null)

      const historyForApi = [...messages.filter(m => m.id !== 'welcome'), userMessage]
        .slice(-MAX_CONTEXT_MESSAGES)
        .map(m => ({ role: m.role, content: m.content }))

      try {
        const responseText = await sendChatMessage(historyForApi)

        const { visible, orderText } = parseOrderMarker(responseText)

        if (orderText) {
          setPendingOrderUrl(buildOrderWhatsAppUrl(orderText))
        }

        const assistantMessage: ChatMessage = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: visible,
          timestamp: Date.now(),
        }

        setMessages(prev => [...prev, assistantMessage])
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'No pude conectarme al asistente. Intentá de nuevo.',
        )
      } finally {
        setIsLoading(false)
      }
    },
    [messages, isLoading],
  )

  const clearError = useCallback(() => setError(null), [])
  const clearOrder = useCallback(() => setPendingOrderUrl(null), [])

  return { messages, isLoading, error, pendingOrderUrl, sendMessage, clearError, clearOrder }
}

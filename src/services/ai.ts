/**
 * ai.ts
 *
 * Capa de servicio para comunicación con la API de IA.
 * Desacoplada del componente — swappeable para WhatsApp u otro canal en el futuro.
 */

export interface ApiChatMessage {
  role: 'user' | 'assistant'
  content: string
}

// ─── Chat ───────────────────────────────────────────────────────────────────

export async function sendChatMessage(
  messages: ApiChatMessage[],
  systemPrompt: string,
): Promise<string> {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages, systemPrompt }),
  })

  if (!response.ok) {
    const body = await response.json().catch(() => ({})) as { error?: string }
    throw new Error(body.error ?? `Error del servidor (${response.status})`)
  }

  const data = await response.json() as { text: string }
  return data.text
}

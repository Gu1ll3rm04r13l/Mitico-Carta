export interface ApiChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export async function sendChatMessage(messages: ApiChatMessage[]): Promise<string> {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages }),
  })

  if (!response.ok) {
    const body = await response.json().catch(() => ({})) as { error?: string }
    throw new Error(body.error ?? `Error del servidor (${response.status})`)
  }

  const data = await response.json() as { text: string }
  return data.text
}

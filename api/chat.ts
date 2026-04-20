import Groq from 'groq-sdk'
import type { VercelRequest, VercelResponse } from '@vercel/node'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { messages, systemPrompt } = req.body as {
    messages: Array<{ role: 'user' | 'assistant'; content: string }>
    systemPrompt: string
  }

  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'Se requiere un array de mensajes no vacío.' })
  }

  try {
    const response = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      max_tokens: 1024,
      messages: [{ role: 'system', content: systemPrompt }, ...messages],
    })

    const text = response.choices[0]?.message?.content ?? ''
    return res.json({ text })
  } catch (error) {
    console.error('[chat]', error)
    return res.status(500).json({
      error: 'No pude procesar tu mensaje. Intentá de nuevo en un momento.',
    })
  }
}

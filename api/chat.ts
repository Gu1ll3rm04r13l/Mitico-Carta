import Groq from 'groq-sdk'
import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getMenu } from './_lib/menuCache'
import { buildSystemPrompt } from './_lib/buildPrompt'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { messages } = req.body as {
    messages: Array<{ role: 'user' | 'assistant'; content: string }>
  }

  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'Se requiere un array de mensajes no vacío.' })
  }

  try {
    const menu = await getMenu()
    const systemPrompt = buildSystemPrompt(menu)

    const response = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      max_tokens: 500,
      messages: [{ role: 'system', content: systemPrompt }, ...messages],
    })

    const text = response.choices[0]?.message?.content ?? ''
    const usage = response.usage
    if (usage) {
      console.log(`[chat] tokens in=${usage.prompt_tokens} out=${usage.completion_tokens} total=${usage.total_tokens}`)
    }
    return res.json({ text })
  } catch (error) {
    console.error('[chat]', error)
    return res.status(500).json({
      error: 'No pude procesar tu mensaje. Intentá de nuevo en un momento.',
    })
  }
}

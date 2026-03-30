/**
 * server/index.ts
 *
 * Proxy minimalista hacia la API de Claude.
 * Mantiene la API key en el servidor — nunca expuesta al browser.
 *
 * En producción: este mismo servidor puede servir el build de Vite (dist/).
 */

import express from 'express'
import cors from 'cors'
import Anthropic from '@anthropic-ai/sdk'
import 'dotenv/config'

// ─── Setup ──────────────────────────────────────────────────────────────────

const app = express()
const PORT = Number(process.env.PORT ?? 3001)
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN ?? 'http://localhost:5173'

app.use(cors({ origin: ALLOWED_ORIGIN }))
app.use(express.json({ limit: '64kb' }))

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// ─── Types ──────────────────────────────────────────────────────────────────

interface ChatRequestBody {
  messages: Array<{ role: 'user' | 'assistant'; content: string }>
  systemPrompt: string
}

// ─── Routes ─────────────────────────────────────────────────────────────────

app.post('/api/chat', async (req, res) => {
  const { messages, systemPrompt } = req.body as ChatRequestBody

  if (!Array.isArray(messages) || messages.length === 0) {
    res.status(400).json({ error: 'Se requiere un array de mensajes no vacío.' })
    return
  }

  if (typeof systemPrompt !== 'string') {
    res.status(400).json({ error: 'systemPrompt debe ser un string.' })
    return
  }

  try {
    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001', // Rápido y económico para chatbot
      max_tokens: 512,
      system: systemPrompt,
      messages,
    })

    const text =
      response.content[0].type === 'text' ? response.content[0].text : ''

    res.json({ text })
  } catch (error) {
    console.error('[chat] Error:', error)
    res.status(500).json({
      error: 'No pude procesar tu mensaje. Intentá de nuevo en un momento.',
    })
  }
})

// ─── Start ──────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`[server] Corriendo en http://localhost:${PORT}`)
})

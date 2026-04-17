/**
 * server/index.ts
 *
 * Proxy minimalista hacia la API de Groq.
 * Mantiene la API key en el servidor — nunca expuesta al browser.
 *
 * En producción: este mismo servidor puede servir el build de Vite (dist/).
 */

import express from 'express'
import cors from 'cors'
import Groq from 'groq-sdk'
import 'dotenv/config'

// ─── Setup ──────────────────────────────────────────────────────────────────

const app = express()
const PORT = Number(process.env.PORT ?? 3001)
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN ?? 'http://localhost:5173'

app.use(cors({ origin: ALLOWED_ORIGIN }))
app.use(express.json({ limit: '64kb' }))

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

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
    const response = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      max_tokens: 512,
      messages: [{ role: 'system', content: systemPrompt }, ...messages],
    })

    const text = response.choices[0]?.message?.content ?? ''

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

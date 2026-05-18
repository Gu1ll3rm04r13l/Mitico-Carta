import express from 'express'
import cors from 'cors'
import Groq from 'groq-sdk'
import 'dotenv/config'
import { getMenu } from './_shared/menuCache'
import { buildSystemPrompt } from './_shared/buildPrompt'

const app = express()
const PORT = Number(process.env.PORT ?? 3001)
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN ?? 'http://localhost:5173'

app.use(cors({ origin: ALLOWED_ORIGIN }))
app.use(express.json({ limit: '64kb' }))

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })

interface ChatRequestBody {
  messages: Array<{ role: 'user' | 'assistant'; content: string }>
}

app.post('/api/chat', async (req, res) => {
  const { messages } = req.body as ChatRequestBody

  if (!Array.isArray(messages) || messages.length === 0) {
    res.status(400).json({ error: 'Se requiere un array de mensajes no vacío.' })
    return
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
    res.json({ text })
  } catch (error) {
    console.error('[chat] Error:', error)
    res.status(500).json({
      error: 'No pude procesar tu mensaje. Intentá de nuevo en un momento.',
    })
  }
})

app.listen(PORT, () => {
  console.log(`[server] Corriendo en http://localhost:${PORT}`)
})

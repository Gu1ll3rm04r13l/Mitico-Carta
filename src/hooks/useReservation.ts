import { useState, useCallback } from 'react'
import type { ReservationFormData, ReservationErrors, ReservationStatus } from '../types'

// ─── Configuración ─────────────────────────────────────────────────────────

/**
 * Número de WhatsApp del local en formato internacional sin '+'.
 * Argentina: 54 + código de área sin 0 + número sin 15.
 * Ej: para 011-1234-5678 → 541112345678
 */
export const WHATSAPP_NUMBER = '5492235799301' // TODO: reemplazar con el número real del local

export function buildWhatsAppUrl(message: string): string {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`
}

// ─── Formulario inicial ────────────────────────────────────────────────────

const INITIAL_FORM: ReservationFormData = {
  name: '',
  guests: 2,
  date: '',
  time: '',
  notes: '',
}

// ─── Validación ────────────────────────────────────────────────────────────

function validate(data: ReservationFormData): ReservationErrors {
  const errors: ReservationErrors = {}

  if (!data.name.trim()) {
    errors.name = 'Tu nombre es requerido'
  } else if (data.name.trim().length < 2) {
    errors.name = 'Ingresá al menos 2 caracteres'
  }

  if (data.guests < 1 || data.guests > 30) {
    errors.guests = 'Debe ser entre 1 y 20 personas'
  }

  if (!data.date) {
    errors.date = 'Elegí una fecha'
  } else {
    const selected = new Date(`${data.date}T00:00:00`)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    if (selected < today) {
      errors.date = 'La fecha no puede ser en el pasado'
    }
  }

  if (!data.time) {
    errors.time = 'Elegí un horario'
  }

  return errors
}

// ─── Construcción del mensaje ───────────────────────────────────────────────

export function buildReservationMessage(data: ReservationFormData): string {
  const date = new Date(`${data.date}T00:00:00`)
  const formattedDate = date.toLocaleDateString('es-AR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  const lines: string[] = [
    '¡Hola Mítico! 🍕',
    'Quiero hacer una reserva:',
    '',
    `📅 ${formattedDate}`,
    `🕐 ${data.time}hs`,
    `👥 ${data.guests} ${data.guests === 1 ? 'persona' : 'personas'}`,
    `📝 Nombre: ${data.name.trim()}`,
  ]

  if (data.notes.trim()) {
    lines.push(`💬 ${data.notes.trim()}`)
  }

  lines.push('', '¡Gracias! 🙌')

  return lines.join('\n')
}

// ─── Hook ──────────────────────────────────────────────────────────────────

export interface UseReservationReturn {
  form: ReservationFormData
  errors: ReservationErrors
  status: ReservationStatus
  /** URL de WhatsApp con el mensaje pre-cargado, disponible tras submit exitoso */
  whatsAppUrl: string
  updateField: <K extends keyof ReservationFormData>(field: K, value: ReservationFormData[K]) => void
  submit: () => void
  reset: () => void
}

export function useReservation(): UseReservationReturn {
  const [form, setForm] = useState<ReservationFormData>(INITIAL_FORM)
  const [errors, setErrors] = useState<ReservationErrors>({})
  const [status, setStatus] = useState<ReservationStatus>('idle')
  const [whatsAppUrl, setWhatsAppUrl] = useState('')

  const updateField = useCallback(
    <K extends keyof ReservationFormData>(field: K, value: ReservationFormData[K]) => {
      setForm(prev => ({ ...prev, [field]: value }))
      setErrors(prev => {
        if (!prev[field]) return prev
        const next = { ...prev }
        delete next[field]
        return next
      })
    },
    []
  )

  const submit = useCallback(() => {
    const validationErrors = validate(form)
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    const message = buildReservationMessage(form)
    setWhatsAppUrl(buildWhatsAppUrl(message))
    setStatus('success')
  }, [form])

  const reset = useCallback(() => {
    setForm(INITIAL_FORM)
    setErrors({})
    setStatus('idle')
    setWhatsAppUrl('')
  }, [])

  return { form, errors, status, whatsAppUrl, updateField, submit, reset }
}

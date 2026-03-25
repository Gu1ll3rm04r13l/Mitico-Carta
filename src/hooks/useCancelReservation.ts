import { useState, useCallback } from 'react'
import { buildWhatsAppUrl } from './useReservation'
import type { CancelFormData, CancelErrors, ReservationStatus } from '../types'

// ─── Formulario inicial ────────────────────────────────────────────────────

const INITIAL_FORM: CancelFormData = {
  name: '',
  date: '',
  time: '',
  notes: '',
}

// ─── Validación ────────────────────────────────────────────────────────────

function validate(data: CancelFormData): CancelErrors {
  const errors: CancelErrors = {}

  if (!data.name.trim()) {
    errors.name = 'Tu nombre es requerido'
  }

  if (!data.date) {
    errors.date = 'Indicá la fecha de tu reserva'
  } else {
    const selected = new Date(`${data.date}T00:00:00`)
    const today = new Date()
    today.setHours(0, 0, 0, 0) 

    if (selected < today) {
      errors.date = 'No podés cancelar una reserva de una fecha pasada'
    }
  }

  return errors
}

// ─── Construcción del mensaje ───────────────────────────────────────────────

function buildCancelMessage(data: CancelFormData): string {
  const date = new Date(`${data.date}T00:00:00`)
  const formattedDate = date.toLocaleDateString('es-AR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })

  const capitalizedDate = formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1)

  // Eliminamos todos los iconos para evitar errores de visualización
  const lines: string[] = [
    '*¡Hola Mítico!*',
    'Necesito cancelar una reserva:',
    '',
    `*Fecha:* ${capitalizedDate}`,
  ]

  if (data.time) {
    lines.push(`*Hora:* ${data.time}hs`)
  }

  lines.push(`*Nombre:* ${data.name.trim()}`)

  if (data.notes.trim()) {
    lines.push('', `*Motivo:* ${data.notes.trim()}`)
  }

  lines.push('', 'Muchas gracias.')

  return lines.join('\n')
}

// ─── Hook ──────────────────────────────────────────────────────────────────

export interface UseCancelReservationReturn {
  form: CancelFormData
  errors: CancelErrors
  status: ReservationStatus
  whatsAppUrl: string
  updateField: <K extends keyof CancelFormData>(field: K, value: CancelFormData[K]) => void
  submit: () => void
  reset: () => void
}

export function useCancelReservation(): UseCancelReservationReturn {
  const [form, setForm] = useState<CancelFormData>(INITIAL_FORM)
  const [errors, setErrors] = useState<CancelErrors>({})
  const [status, setStatus] = useState<ReservationStatus>('idle')
  const [whatsAppUrl, setWhatsAppUrl] = useState('')

  const updateField = useCallback(
    <K extends keyof CancelFormData>(field: K, value: CancelFormData[K]) => {
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

    const message = buildCancelMessage(form)
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

import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useReservation } from '../hooks/useReservation'
import type { ReservationFormData, ReservationErrors } from '../types'

// ─── Helpers ───────────────────────────────────────────────────────────────

function generateTimeSlots(): string[] {
  const slots: string[] = []
  const START_HOUR = 20
  const END_HOUR = 23 // Hasta las 23:30

  for (let h = START_HOUR; h <= END_HOUR; h++) {
    for (const m of [0, 30]) {
      const hour = String(h).padStart(2, '0');
      const minute = String(m).padStart(2, '0');
      slots.push(`${hour}:${minute}`);
    }
  }
  
  // Agregamos la medianoche como última opción
  slots.push("00:00")
  
  return slots
}

const TIME_SLOTS = generateTimeSlots()

function todayISO(): string {
  return new Date().toISOString().split('T')[0]
}

// ─── Primitivos compartidos ─────────────────────────────────────────────────

function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return (
    <p className="mt-1 text-xs" style={{ color: '#f87171', fontFamily: 'Inter, sans-serif' }}>
      {message}
    </p>
  )
}

function Label({ htmlFor, children }: { htmlFor: string; children: React.ReactNode }) {
  return (
    <label
      htmlFor={htmlFor}
      className="block text-xs font-semibold tracking-wide uppercase mb-1.5"
      style={{ color: '#8A8070', fontFamily: 'Inter, sans-serif' }}
    >
      {children}
    </label>
  )
}

const inputBase = (hasError: boolean): React.CSSProperties => ({
  width: '100%',
  backgroundColor: '#0D0D0D',
  color: '#F5E6C8',
  border: `1px solid ${hasError ? '#f87171' : 'rgba(245,230,200,0.12)'}`,
  borderRadius: '8px',
  padding: '10px 14px',
  fontSize: '15px',
  fontFamily: 'Inter, sans-serif',
  outline: 'none',
  transition: 'border-color 0.15s',
})

// ─── FormView ──────────────────────────────────────────────────────────────

interface FormViewProps {
  form: ReservationFormData
  errors: ReservationErrors
  isSubmitting: boolean
  firstInputRef: React.RefObject<HTMLInputElement | null>
  updateField: <K extends keyof ReservationFormData>(field: K, value: ReservationFormData[K]) => void
  onSubmit: () => void
}

function FormView({ form, errors, isSubmitting, firstInputRef, updateField, onSubmit }: FormViewProps) {
  return (
    <div className="flex flex-col gap-5">
      {/* Nombre */}
      <div>
        <Label htmlFor="res-name">Tu nombre</Label>
        <input
          ref={firstInputRef}
          id="res-name"
          type="text"
          placeholder="Ej: Martín García"
          autoComplete="name"
          value={form.name}
          onChange={e => updateField('name', e.target.value)}
          style={inputBase(!!errors.name)}
        />
        <FieldError message={errors.name} />
      </div>

      {/* Personas */}
      <div>
        <Label htmlFor="res-guests">Personas</Label>
        <div className="flex items-center gap-3">
          <button
            type="button"
            aria-label="Reducir personas"
            onClick={() => updateField('guests', Math.max(1, form.guests - 1))}
            disabled={form.guests <= 1}
            className="w-10 h-10 rounded-lg text-lg font-bold transition-colors flex items-center justify-center"
            style={{
              backgroundColor: 'rgba(245,230,200,0.08)',
              color: form.guests <= 1 ? '#8A8070' : '#F5E6C8',
              border: '1px solid rgba(245,230,200,0.12)',
            }}
          >
            −
          </button>
          <span
            id="res-guests"
            className="text-2xl font-semibold w-10 text-center"
            style={{ color: '#F5E6C8', fontFamily: 'Inter, sans-serif' }}
            aria-live="polite"
          >
            {form.guests}
          </span>
          <button
            type="button"
            aria-label="Aumentar personas"
            onClick={() => updateField('guests', Math.min(20, form.guests + 1))}
            disabled={form.guests >= 20}
            className="w-10 h-10 rounded-lg text-lg font-bold transition-colors flex items-center justify-center"
            style={{
              backgroundColor: 'rgba(245,230,200,0.08)',
              color: form.guests >= 20 ? '#8A8070' : '#F5E6C8',
              border: '1px solid rgba(245,230,200,0.12)',
            }}
          >
            +
          </button>
          <span className="text-sm" style={{ color: '#8A8070', fontFamily: 'Inter, sans-serif' }}>
            {form.guests === 1 ? 'persona' : 'personas'}
          </span>
        </div>
        <FieldError message={errors.guests} />
      </div>

      {/* Fecha y Hora */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="res-date">Fecha</Label>
          <input
            id="res-date"
            type="date"
            min={todayISO()}
            value={form.date}
            onChange={e => updateField('date', e.target.value)}
            style={{ ...inputBase(!!errors.date), colorScheme: 'dark' }}
          />
          <FieldError message={errors.date} />
        </div>
        <div>
          <Label htmlFor="res-time">Horario</Label>
          <select
            id="res-time"
            value={form.time}
            onChange={e => updateField('time', e.target.value)}
            style={inputBase(!!errors.time)}
          >
            <option value="" disabled>--:--</option>
            {TIME_SLOTS.map(slot => (
              <option key={slot} value={slot} style={{ backgroundColor: '#1A1A1A' }}>
                {slot}hs
              </option>
            ))}
          </select>
          <FieldError message={errors.time} />
        </div>
      </div>

      {/* Notas */}
      <div>
        <Label htmlFor="res-notes">Aclaraciones (opcional)</Label>
        <textarea
          id="res-notes"
          rows={3}
          placeholder="Ej: festejo de cumpleaños, necesitamos silla para bebé..."
          value={form.notes}
          onChange={e => updateField('notes', e.target.value)}
          style={{ ...inputBase(false), resize: 'none' }}
        />
      </div>

      {/* Submit */}
      <button
        type="button"
        onClick={onSubmit}
        disabled={isSubmitting}
        className="w-full py-4 rounded-lg font-semibold text-base tracking-wide transition-all duration-200 active:scale-[0.98]"
        style={{
          backgroundColor: isSubmitting ? 'rgba(232,98,42,0.6)' : '#E8622A',
          color: '#fff',
          fontFamily: 'Inter, sans-serif',
          cursor: isSubmitting ? 'wait' : 'pointer',
        }}
      >
        {isSubmitting ? 'Preparando...' : 'Confirmar reserva →'}
      </button>
    </div>
  )
}

// ─── SuccessView ────────────────────────────────────────────────────────────

interface SuccessViewProps {
  whatsAppUrl: string
  onReset: () => void
}

function SuccessView({ whatsAppUrl, onReset }: SuccessViewProps) {
  return (
    <div className="flex flex-col gap-5">
      {/* Estado */}
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
          style={{ backgroundColor: 'rgba(74,222,128,0.15)' }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="#4ade80"
            strokeWidth={2.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div>
          <p className="font-semibold text-base" style={{ color: '#F5E6C8', fontFamily: 'Inter, sans-serif' }}>
            ¡Tu reserva está lista!
          </p>
          <p className="text-sm" style={{ color: '#8A8070', fontFamily: 'Inter, sans-serif' }}>
            El mensaje ya está escrito. Solo tocá Enviar en WhatsApp.
          </p>
        </div>
      </div>

      {/* CTA WhatsApp — acción directa del usuario para evitar bloqueo de popup */}
      <a
        href={whatsAppUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="w-full py-4 rounded-lg font-semibold text-base text-center tracking-wide transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-2.5"
        style={{ backgroundColor: '#25D366', color: '#fff', fontFamily: 'Inter, sans-serif' }}
      >
        {/* WhatsApp icon */}
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
        Enviar por WhatsApp
      </a>

      <button
        type="button"
        onClick={onReset}
        className="text-sm text-center transition-colors hover:underline"
        style={{ color: '#8A8070', fontFamily: 'Inter, sans-serif' }}
      >
        Hacer otra reserva
      </button>
    </div>
  )
}

// ─── Modal Principal ────────────────────────────────────────────────────────

interface Props {
  onClose: () => void
}

export default function ReservationModal({ onClose }: Props) {
  const { form, errors, status, whatsAppUrl, updateField, submit, reset } = useReservation()
  const firstInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [])

  useEffect(() => {
    firstInputRef.current?.focus()
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleClose = () => { reset(); onClose() }
  const isSuccess = status === 'success'

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.80)' }}
      onClick={e => { if (e.target === e.currentTarget) handleClose() }}
      role="dialog"
      aria-modal="true"
      aria-label="Formulario de reserva"
    >
      <div
        className="w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl overflow-y-auto"
        style={{ backgroundColor: '#1A1A1A', maxHeight: '92dvh' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4 border-b sticky top-0"
          style={{ borderColor: 'rgba(245,230,200,0.08)', backgroundColor: '#1A1A1A' }}
        >
          <div>
            <h2
              className="text-xl uppercase"
              style={{ fontFamily: '"Bebas Neue", sans-serif', color: '#F5E6C8', letterSpacing: '0.05em' }}
            >
              {isSuccess ? 'Todo listo' : 'Reservar Mesa'}
            </h2>
            {!isSuccess && (
              <p className="text-xs" style={{ color: '#8A8070', fontFamily: 'Inter, sans-serif' }}>
                Te preparamos el mensaje para enviar por WhatsApp
              </p>
            )}
          </div>
          <button
            onClick={handleClose}
            className="flex items-center justify-center w-9 h-9 rounded-full transition-colors hover:bg-white/10"
            aria-label="Cerrar"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="#8A8070" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-6 py-5">
          {isSuccess ? (
            <SuccessView whatsAppUrl={whatsAppUrl} onReset={reset} />
          ) : (
            <FormView
              form={form}
              errors={errors}
              isSubmitting={status === 'submitting'}
              firstInputRef={firstInputRef}
              updateField={updateField}
              onSubmit={submit}
            />
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}

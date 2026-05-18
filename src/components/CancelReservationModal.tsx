import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useCancelReservation } from '../hooks/useCancelReservation'
import { TIME_SLOTS } from '../lib/timeSlots'
import type { CancelFormData, CancelErrors } from '../types'

// ─── Primitivos ─────────────────────────────────────────────────────────────

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
  form: CancelFormData
  errors: CancelErrors
  firstInputRef: React.RefObject<HTMLInputElement | null>
  updateField: <K extends keyof CancelFormData>(field: K, value: CancelFormData[K]) => void
  onSubmit: () => void
}

function FormView({ form, errors, firstInputRef, updateField, onSubmit }: FormViewProps) {
  return (
    <div className="flex flex-col gap-5">
      {/* SE ELIMINÓ EL CARTEL AMARILLO DE ADVERTENCIA AQUÍ */}

      {/* Nombre */}
      <div>
        <Label htmlFor="cancel-name">Tu nombre</Label>
        <input
          ref={firstInputRef}
          id="cancel-name"
          type="text"
          placeholder="Ej: Martín García"
          autoComplete="name"
          value={form.name}
          onChange={e => updateField('name', e.target.value)}
          style={inputBase(!!errors.name)}
        />
        <FieldError message={errors.name} />
      </div>

      {/* Fecha y Hora original */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="cancel-date">Fecha de tu reserva</Label>
          <input
            id="cancel-date"
            type="date"
            value={form.date}
            onChange={e => updateField('date', e.target.value)}
            style={{ ...inputBase(!!errors.date), colorScheme: 'dark' }}
          />
          <FieldError message={errors.date} />
        </div>
        <div>
          <Label htmlFor="cancel-time">Horario (opcional)</Label>
          <select
            id="cancel-time"
            value={form.time}
            onChange={e => updateField('time', e.target.value)}
            style={inputBase(false)}
          >
            <option value="">--:--</option>
            {TIME_SLOTS.map(slot => (
              <option key={slot} value={slot} style={{ backgroundColor: '#1A1A1A' }}>
                {slot}hs
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Notas */}
      <div>
        <Label htmlFor="cancel-notes">Motivo u observaciones (opcional)</Label>
        <textarea
          id="cancel-notes"
          rows={2}
          placeholder="Ej: cambio de planes, emergencia..."
          value={form.notes}
          onChange={e => updateField('notes', e.target.value)}
          style={{ ...inputBase(false), resize: 'none' }}
        />
      </div>

      {/* Submit */}
      <button
        type="button"
        onClick={onSubmit}
        className="w-full py-4 rounded-lg font-semibold text-base tracking-wide transition-all duration-200 active:scale-[0.98]"
        style={{
          backgroundColor: 'rgba(248,113,113,0.15)',
          color: '#f87171',
          border: '1px solid rgba(248,113,113,0.3)',
          fontFamily: 'Inter, sans-serif',
        }}
      >
        CANCELAR mi reserva →
      </button>
    </div>
  )
}

// ─── SuccessView ────────────────────────────────────────────────────────────

function SuccessView({ whatsAppUrl, onReset }: { whatsAppUrl: string; onReset: () => void }) {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
          style={{ backgroundColor: 'rgba(74,222,128,0.15)' }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="#4ade80" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div>
          <p className="font-semibold text-base" style={{ color: '#F5E6C8', fontFamily: 'Inter, sans-serif' }}>
            Mensaje de cancelación listo
          </p>
          <p className="text-sm" style={{ color: '#8A8070', fontFamily: 'Inter, sans-serif' }}>
            Abrí WhatsApp y tocá Enviar para confirmar.
          </p>
        </div>
      </div>

      <a
        href={whatsAppUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="w-full py-4 rounded-lg font-semibold text-base text-center tracking-wide transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-2.5"
        style={{ backgroundColor: '#25D366', color: '#fff', fontFamily: 'Inter, sans-serif' }}
      >
        Enviar cancelación por WhatsApp
      </a>

      <button
        type="button"
        onClick={onReset}
        className="text-sm text-center transition-colors hover:underline"
        style={{ color: '#8A8070', fontFamily: 'Inter, sans-serif' }}
      >
        Volver
      </button>
    </div>
  )
}

// ─── Modal Principal ────────────────────────────────────────────────────────

interface Props {
  onClose: () => void
}

export default function CancelReservationModal({ onClose }: Props) {
  const { form, errors, status, whatsAppUrl, updateField, submit, reset } = useCancelReservation()
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
      aria-label="Cancelación de reserva"
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
              {isSuccess ? 'Listo' : 'Cancelar Reserva'}
            </h2>
            {!isSuccess && (
              <p className="text-xs" style={{ color: '#8A8070', fontFamily: 'Inter, sans-serif' }}>
                Avisale al local por WhatsApp
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
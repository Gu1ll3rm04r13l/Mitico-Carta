import { useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { toXlsx, parseXlsx, rowsToImport, type ImportResult } from '../../lib/menuExcel'
import type { AdminMenuItem, AdminMenuItemInput } from '../../types'

export default function ImportExportBar({
  items,
  saving,
  onImport,
}: {
  items: AdminMenuItem[]
  saving: boolean
  onImport: (rows: { id: string; input: Partial<AdminMenuItemInput> }[]) => Promise<void>
}) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [fileError, setFileError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function handleExport() {
    setBusy(true)
    try {
      const blob = await toXlsx(items)
      const url = URL.createObjectURL(blob)
      const date = new Date().toISOString().slice(0, 10)
      const a = document.createElement('a')
      a.href = url
      a.download = `mitico-carta-${date}.xlsx`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } finally {
      setBusy(false)
    }
  }

  async function handlePickFile(e: React.ChangeEvent<HTMLInputElement>) {
    setFileError(null)
    const file = e.target.files?.[0]
    e.target.value = '' // permite re-seleccionar el mismo archivo
    if (!file) return

    if (!file.name.toLowerCase().endsWith('.xlsx')) {
      setFileError('Formato no soportado. Subí el archivo .xlsx que exportaste (Excel / Google Sheets → Descargar como .xlsx).')
      return
    }

    setBusy(true)
    try {
      const buffer = await file.arrayBuffer()
      const rows = await parseXlsx(buffer)
      const knownIds = new Set(items.map(i => i.id))
      setResult(rowsToImport(rows, knownIds))
    } catch {
      setFileError('No se pudo leer el archivo. Verificá que sea un .xlsx válido.')
    } finally {
      setBusy(false)
    }
  }

  async function confirmImport() {
    if (!result) return
    await onImport(result.valid)
    setResult(null)
  }

  const disabled = saving || busy

  return (
    <>
      {/* Exportar */}
      <button
        type="button"
        onClick={handleExport}
        disabled={disabled}
        title="Descargá la carta en Excel (.xlsx). La columna id está bloqueada: editá solo los precios."
        className="flex items-center gap-1.5 bg-white/5 hover:bg-white/10 text-cream text-xs font-body font-medium px-3 py-2 rounded-xl transition-colors border border-white/10 disabled:opacity-50"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
        Exportar Excel
      </button>

      {/* Importar */}
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        disabled={disabled}
        title="Subí el .xlsx editado. Solo se actualizan los ítems; la columna id identifica cada producto."
        className="flex items-center gap-1.5 bg-white/5 hover:bg-white/10 text-cream text-xs font-body font-medium px-3 py-2 rounded-xl transition-colors border border-white/10 disabled:opacity-50"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" y1="3" x2="12" y2="15" />
        </svg>
        Importar Excel
      </button>
      <input
        ref={fileRef}
        type="file"
        accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        onChange={handlePickFile}
        className="hidden"
      />

      {/* Error de archivo (portal a body: el header tiene backdrop-blur y rompería el fixed) */}
      {fileError && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-bg-card rounded-2xl border border-white/10 shadow-2xl p-6 flex flex-col gap-5">
            <div>
              <h3 className="font-heading text-xl text-cream tracking-wide mb-1">No se pudo importar</h3>
              <p className="text-muted text-sm font-body leading-relaxed">{fileError}</p>
            </div>
            <button
              type="button"
              onClick={() => setFileError(null)}
              className="px-4 py-2.5 rounded-xl border border-white/10 text-muted hover:text-cream text-sm font-body transition-colors"
            >
              Entendido
            </button>
          </div>
        </div>,
        document.body,
      )}

      {/* Resumen de import (portal a body por el mismo motivo) */}
      {result && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-bg-card rounded-2xl border border-white/10 shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-6 pb-4 border-b border-white/5">
              <h3 className="font-heading text-2xl text-cream tracking-wide mb-1">Importar Excel</h3>
              <p className="text-muted text-sm font-body">
                <span className="text-cream font-medium">{result.valid.length}</span> filas listas para actualizar
                {result.errors.length > 0 && (
                  <> · <span className="text-red-400">{result.errors.length}</span> con error</>
                )}
              </p>
            </div>

            {result.errors.length > 0 && (
              <div className="px-6 py-3 overflow-y-auto">
                <p className="text-red-400 text-xs font-medium mb-1.5">Filas ignoradas:</p>
                <div className="bg-red-400/5 rounded-xl border border-red-400/20 max-h-40 overflow-y-auto divide-y divide-white/5">
                  {result.errors.map((err, i) => (
                    <div key={i} className="px-3 py-1.5 text-xs text-muted">
                      Línea {err.line}: {err.reason}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="p-6 pt-4 border-t border-white/5 flex gap-3">
              <button
                type="button"
                onClick={() => setResult(null)}
                disabled={saving}
                className="flex-1 px-4 py-2.5 rounded-xl border border-white/10 text-muted hover:text-cream text-sm font-body transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmImport}
                disabled={saving || result.valid.length === 0}
                className="flex-1 px-4 py-2.5 rounded-xl bg-accent hover:bg-accent/90 text-white text-sm font-body transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {saving ? (
                  <>
                    <span className="inline-block w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Importando…
                  </>
                ) : (
                  `Actualizar ${result.valid.length} ítems`
                )}
              </button>
            </div>
          </div>
        </div>,
        document.body,
      )}
    </>
  )
}

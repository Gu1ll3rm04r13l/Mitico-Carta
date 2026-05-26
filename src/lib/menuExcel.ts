// Import/Export Excel (.xlsx) de la carta usando ExcelJS.
// Match de import por `id`. La columna `id` se exporta BLOQUEADA (solo lectura)
// para evitar que se edite por accidente y se rompa el match.
// ExcelJS solo se importa acá → vive en el chunk lazy del panel admin (no afecta la carta pública).

import ExcelJS from 'exceljs'
import type { AdminMenuItem, AdminMenuItemInput } from '../types'

// Paleta de la marca para el estilo de tabla del Excel.
const HEADER_FILL = 'FFE8622A' // accent (naranja Mítico)
const HEADER_FONT = 'FFFFFFFF' // texto blanco en encabezado
const BAND_FILL = 'FFF6EFE3'   // crema suave para filas alternadas

export const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'

interface ColDef {
  key: string
  header: string
  width: number
}

// `id` va al final y oculto: es la llave de match del import, no debe editarse.
const COLUMNS: ColDef[] = [
  { key: 'name',         header: 'name',         width: 26 },
  { key: 'price',        header: 'price',        width: 12 },
  { key: 'category',     header: 'category',     width: 16 },
  { key: 'description',  header: 'description',  width: 40 },
  { key: 'sort_order',   header: 'sort_order',   width: 11 },
  { key: 'available',    header: 'available',    width: 11 },
  { key: 'is_signature', header: 'is_signature', width: 13 },
  { key: 'tags',         header: 'tags',         width: 18 },
  { key: 'image_url',    header: 'image_url',    width: 40 },
  { key: 'slug',         header: 'slug',         width: 22 },
  { key: 'id',           header: 'id',           width: 38 },
]

// ─── Export ──────────────────────────────────────────────────────────────────

export async function toXlsx(items: AdminMenuItem[], categoryKeys: string[]): Promise<Blob> {
  const wb = new ExcelJS.Workbook()
  wb.creator = 'Mítico'
  wb.created = new Date()

  const ws = wb.addWorksheet('Carta', {
    views: [{ state: 'frozen', ySplit: 1 }], // fija la fila de encabezado
  })
  ws.columns = COLUMNS.map(c => ({ key: c.key, header: c.header, width: c.width }))

  for (const item of items) {
    ws.addRow({
      id: item.id,
      slug: item.slug,
      name: item.name,
      description: item.description ?? '',
      price: item.price,
      category: item.category,
      sort_order: item.sort_order,
      available: item.available,
      is_signature: item.is_signature,
      tags: (item.tags ?? []).join('|'),
      image_url: item.image_url ?? '',
    })
  }

  const lastRow = ws.rowCount
  const lastDataRow = Math.max(lastRow, 1)

  // ── Estilo de tabla ──────────────────────────────────────────────────────
  // Encabezado: fondo naranja, texto blanco en negrita.
  const header = ws.getRow(1)
  header.height = 20
  header.eachCell(cell => {
    cell.font = { bold: true, color: { argb: HEADER_FONT } }
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: HEADER_FILL } }
    cell.alignment = { vertical: 'middle' }
  })

  // Filas alternadas (banded) en crema suave.
  for (let r = 2; r <= lastDataRow; r++) {
    if (r % 2 === 0) {
      ws.getRow(r).eachCell({ includeEmpty: true }, cell => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BAND_FILL } }
      })
    }
  }

  // ── Listas desplegables (data validation) ──────────────────────────────────
  // Categoría: solo valores válidos → evita typos que romperían el import.
  const catCol = ws.getColumn('category').letter
  const boolCols = [ws.getColumn('available').letter, ws.getColumn('is_signature').letter]
  for (let r = 2; r <= lastDataRow; r++) {
    ws.getCell(`${catCol}${r}`).dataValidation = {
      type: 'list',
      allowBlank: false,
      formulae: [`"${categoryKeys.join(',')}"`],
      showErrorMessage: true,
      errorStyle: 'error',
      errorTitle: 'Categoría inválida',
      error: 'Elegí una categoría de la lista.',
    }
    for (const col of boolCols) {
      ws.getCell(`${col}${r}`).dataValidation = {
        type: 'list',
        allowBlank: false,
        formulae: ['"TRUE,FALSE"'],
        showErrorMessage: true,
        errorStyle: 'error',
        errorTitle: 'Valor inválido',
        error: 'Usá TRUE o FALSE.',
      }
    }
  }

  // ── Bloqueo de columna id ───────────────────────────────────────────────────
  // Por defecto todas las celdas quedan bloqueadas al proteger la hoja.
  // Desbloqueamos todo y luego re-bloqueamos solo la columna `id`.
  ws.eachRow(row => {
    row.eachCell({ includeEmpty: true }, cell => {
      cell.protection = { locked: false }
    })
  })
  const idColumn = ws.getColumn('id')
  idColumn.eachCell({ includeEmpty: true }, cell => {
    cell.protection = { locked: true }
  })
  // Oculta la columna id: queda al final y fuera de la vista. El import la sigue leyendo.
  idColumn.hidden = true

  // Protege la hoja (sin contraseña): bloquea edición de celdas marcadas como locked.
  // El usuario igual puede ordenar/seleccionar; solo no puede editar la columna id.
  await ws.protect('', {
    selectLockedCells: true,
    selectUnlockedCells: true,
    sort: true,
    autoFilter: true,
  })

  const buffer = await wb.xlsx.writeBuffer()
  return new Blob([buffer], { type: XLSX_MIME })
}

// ─── Parse ─────────────────────────────────────────────────────────────────

type Row = Record<string, string>

/** Lee un .xlsx y devuelve filas como objetos { columna: valor (string) }. */
export async function parseXlsx(buffer: ArrayBuffer): Promise<Row[]> {
  const wb = new ExcelJS.Workbook()
  await wb.xlsx.load(buffer)
  const ws = wb.worksheets[0]
  if (!ws) return []

  const headerRow = ws.getRow(1)
  const headers: string[] = []
  headerRow.eachCell({ includeEmpty: true }, (cell, col) => {
    headers[col] = String(cell.value ?? '').trim()
  })

  const rows: Row[] = []
  ws.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return
    const obj: Row = {}
    row.eachCell({ includeEmpty: true }, (cell, col) => {
      const key = headers[col]
      if (!key) return
      obj[key] = cellToString(cell.value)
    })
    rows.push(obj)
  })
  return rows
}

function cellToString(value: ExcelJS.CellValue): string {
  if (value === null || value === undefined) return ''
  if (typeof value === 'boolean') return value ? 'true' : 'false'
  if (typeof value === 'object') {
    // formulas, rich text, hyperlinks
    if ('result' in value && value.result != null) return String(value.result)
    if ('text' in value && value.text != null) return String(value.text)
    if ('richText' in value && Array.isArray(value.richText)) {
      return value.richText.map(rt => rt.text).join('')
    }
    return ''
  }
  return String(value)
}

// ─── Row → update ────────────────────────────────────────────────────────────

export interface ParsedImportRow {
  id: string
  input: Partial<AdminMenuItemInput>
}

export interface ImportResult {
  valid: ParsedImportRow[]
  errors: { line: number; reason: string }[]
}

function parseBool(value: string): boolean | undefined {
  const v = value.trim().toLowerCase()
  if (v === 'true' || v === '1' || v === 'sí' || v === 'si') return true
  if (v === 'false' || v === '0' || v === 'no' || v === '') return false
  return undefined
}

/**
 * Valida y mapea filas a updates por id.
 * Solo incluye campos presentes. Filas inválidas van a `errors`.
 * Si se pasa `knownIds`, los ids que no existen en la carta se reportan como error
 * (evita que ediciones con id alterado se pierdan en silencio).
 */
export function rowsToImport(rows: Row[], knownIds?: Set<string>): ImportResult {
  const valid: ParsedImportRow[] = []
  const errors: { line: number; reason: string }[] = []

  rows.forEach((row, idx) => {
    const line = idx + 2 // +1 header, +1 base-1
    const id = (row.id ?? '').trim()
    if (!id) {
      errors.push({ line, reason: 'Falta id' })
      return
    }
    if (knownIds && !knownIds.has(id)) {
      errors.push({ line, reason: `id no existe en la carta: "${id}" (¿se editó la columna id?)` })
      return
    }

    const input: Partial<AdminMenuItemInput> = {}

    if ('name' in row && row.name !== '') input.name = row.name
    if ('description' in row) input.description = row.description === '' ? null : row.description
    if ('category' in row && row.category !== '') input.category = row.category
    if ('image_url' in row) input.image_url = row.image_url === '' ? null : row.image_url

    if ('price' in row && row.price !== '') {
      const price = Number(row.price)
      if (!Number.isFinite(price) || price < 0) {
        errors.push({ line, reason: `Precio inválido: "${row.price}"` })
        return
      }
      input.price = Math.round(price)
    }

    if ('sort_order' in row && row.sort_order !== '') {
      const so = Number(row.sort_order)
      if (!Number.isFinite(so)) {
        errors.push({ line, reason: `sort_order inválido: "${row.sort_order}"` })
        return
      }
      input.sort_order = Math.round(so)
    }

    if ('available' in row && row.available !== '') {
      const b = parseBool(row.available)
      if (b === undefined) {
        errors.push({ line, reason: `available inválido: "${row.available}"` })
        return
      }
      input.available = b
    }

    if ('is_signature' in row && row.is_signature !== '') {
      const b = parseBool(row.is_signature)
      if (b === undefined) {
        errors.push({ line, reason: `is_signature inválido: "${row.is_signature}"` })
        return
      }
      input.is_signature = b
    }

    if ('tags' in row) {
      input.tags = row.tags === '' ? [] : row.tags.split('|').map(t => t.trim()).filter(Boolean)
    }

    if (Object.keys(input).length === 0) {
      errors.push({ line, reason: 'Sin campos para actualizar' })
      return
    }

    valid.push({ id, input })
  })

  return { valid, errors }
}

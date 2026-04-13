import type { TableRow } from '../types/map'

export function parseTsv(text: string): { headers: string[]; rows: TableRow[] } {
  const normalized = text.replace(/\uFEFF/g, '').replace(/\r\n/g, '\n').trim()
  if (!normalized) {
    return { headers: [], rows: [] }
  }

  const lines = normalized
    .split('\n')
    .map((line) => line.trimEnd())
    .filter((line) => line.length > 0)

  if (lines.length === 0) {
    return { headers: [], rows: [] }
  }

  const headers = lines[0].split('\t').map((header) => header.trim())
  const rows = lines.slice(1).map((line) => {
    const values = line.split('\t')
    const row: TableRow = {}
    headers.forEach((header, index) => {
      row[header] = values[index] ?? ''
    })
    return row
  })

  return { headers, rows }
}

export function serializeTsv(headers: string[], rows: TableRow[]): string {
  const headerLine = headers.join('\t')
  const body = rows.map((row) => headers.map((header) => row[header] ?? '').join('\t'))
  return [headerLine, ...body].join('\r\n')
}

export function findFieldName(row: TableRow, candidates: string[]): string | undefined {
  const lookup = new Map(Object.keys(row).map((key) => [key.toLowerCase(), key]))
  return candidates.map((candidate) => lookup.get(candidate.toLowerCase())).find(Boolean)
}

export function getFieldValue(row: TableRow, candidates: string[]): string {
  const fieldName = findFieldName(row, candidates)
  return fieldName ? row[fieldName] ?? '' : ''
}

export function setFieldValue(row: TableRow, candidates: string[], value: string): void {
  const fieldName = findFieldName(row, candidates)
  if (fieldName) {
    row[fieldName] = value
  }
}

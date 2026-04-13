import { getFieldValue } from './tsv'
import type { SourceBundle, TableRow } from '../types/map'

export interface ImportedLevelTypeOption {
  id: string
  name: string
  tileFileCount: number
  summary: string
}

export function resolveLevelTypeId(row: TableRow, index: number): string {
  return getFieldValue(row, ['ID', 'Id']) || String(index)
}

function countTileFiles(row: TableRow): number {
  return Object.entries(row).filter(([key, value]) => /^file\s*\d+$/i.test(key) && value.trim() && value.trim() !== '0').length
}

export function getImportedLevelTypeOptions(sourceBundle?: SourceBundle): ImportedLevelTypeOption[] {
  const rows = sourceBundle?.tables['LvlTypes.txt']?.rows ?? []
  return rows.map((row, index) => {
    const tileFileCount = countTileFiles(row)
    const name = getFieldValue(row, ['Name']) || `Level Type ${index}`
    return {
      id: resolveLevelTypeId(row, index),
      name,
      tileFileCount,
      summary: tileFileCount > 0 ? `${tileFileCount} tile file reference${tileFileCount === 1 ? '' : 's'}` : 'No tile file count found',
    }
  })
}

export function findImportedLevelTypeOption(
  sourceBundle: SourceBundle | undefined,
  levelTypeId?: string,
): ImportedLevelTypeOption | undefined {
  if (!levelTypeId) {
    return undefined
  }
  return getImportedLevelTypeOptions(sourceBundle).find((option) => option.id === levelTypeId)
}

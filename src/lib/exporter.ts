import { createEmptyProject } from './project'
import { getFieldValue, serializeTsv, setFieldValue } from './tsv'
import type {
  ExportBundle,
  MapProject,
  RoomTemplate,
  SourceBundle,
  SourceTable,
  TableRow,
} from '../types/map'

function cloneTable(table?: SourceTable): { headers: string[]; rows: TableRow[] } {
  if (!table) {
    return { headers: [], rows: [] }
  }
  return {
    headers: [...table.headers],
    rows: table.rows.map((row) => ({ ...row })),
  }
}

function ensureHeaders(headers: string[], requiredHeaders: string[]): string[] {
  const next = [...headers]
  for (const header of requiredHeaders) {
    if (!next.includes(header)) {
      next.push(header)
    }
  }
  return next
}

function findOrCreateRow(rows: TableRow[], candidates: string[], value: string): TableRow {
  const existing = rows.find((row) => getFieldValue(row, candidates) === value)
  if (existing) {
    return existing
  }
  const row: TableRow = {}
  rows.push(row)
  return row
}

function upsertLvlPrestRows(rows: TableRow[], roomTemplates: RoomTemplate[]): TableRow[] {
  const updated = rows.map((row) => ({ ...row }))

  for (const room of roomTemplates) {
    const target =
      updated.find((row) => getFieldValue(row, ['Def']) === room.linkedPresetId) ??
      updated.find((row) =>
        Object.keys(row)
          .filter((key) => /^file\s*\d+$/i.test(key))
          .some((key) => row[key]?.toLowerCase() === room.ds1Path.toLowerCase()),
      ) ??
      (() => {
        const row: TableRow = {}
        updated.push(row)
        return row
      })()

    setFieldValue(target, ['Name'], room.name)
    setFieldValue(target, ['Def'], room.linkedPresetId || room.id)
    setFieldValue(target, ['SizeX'], String(room.size.x))
    setFieldValue(target, ['SizeY'], String(room.size.y))
    setFieldValue(target, ['Files'], '1')
    setFieldValue(target, ['File1'], room.ds1Path)
    setFieldValue(target, ['Dt1Mask'], getFieldValue(target, ['Dt1Mask']) || '1')
    setFieldValue(target, ['Populate'], getFieldValue(target, ['Populate']) || '1')
    setFieldValue(target, ['Outdoors'], room.tags.includes('outdoor') ? '1' : '0')
    setFieldValue(target, ['Scan'], room.warpDefs.length > 0 ? '1' : '0')
  }

  return updated
}

function buildReport(project: MapProject, sourceBundle?: SourceBundle): string {
  const roomsUsed = new Set(project.placements.map((placement) => placement.roomTemplateId))
  const linkedFiles = project.roomTemplates
    .filter((room) => roomsUsed.size === 0 || roomsUsed.has(room.id))
    .map((room) => `- ${room.ds1Path}`)
    .join('\n')
  const importedSummary = sourceBundle
    ? `${sourceBundle.rawFiles.length} imported files, ${sourceBundle.ds1Files.length} DS1 files`
    : 'No source bundle loaded.'

  return [
    '# PD2 Map Designer Export',
    '',
    `- Map: ${project.meta.name}`,
    `- Export name: ${project.meta.exportName}`,
    `- Theme: ${project.meta.theme || 'Unassigned'}`,
    `- Placements: ${project.placements.length}`,
    `- Validation issues: ${project.validation.length}`,
    `- Source bundle: ${importedSummary}`,
    '',
    '## Required DS1 files',
    linkedFiles || '- No rooms referenced yet.',
    '',
    '## Notes',
    '- Copy the exported table files into your extracted mod workspace, not directly into MPQ archives.',
    '- DS1 binaries are not rewritten in v1. The report lists which imported DS1 files the map layout references.',
  ].join('\n')
}

export function buildExportBundle(project: MapProject, sourceBundle?: SourceBundle): ExportBundle {
  const safeProject = project ?? createEmptyProject()
  const levels = cloneTable(sourceBundle?.tables['Levels.txt'])
  const lvlMaze = cloneTable(sourceBundle?.tables['LvlMaze.txt'])
  const lvlPrest = cloneTable(sourceBundle?.tables['LvlPrest.txt'])

  levels.headers = ensureHeaders(levels.headers, ['Name', 'Id', 'LevelType'])
  lvlMaze.headers = ensureHeaders(lvlMaze.headers, ['Name', 'Level', 'Rooms', 'Rooms(N)', 'Rooms(H)', 'SizeX', 'SizeY'])
  lvlPrest.headers = ensureHeaders(lvlPrest.headers, ['Name', 'Def', 'SizeX', 'SizeY', 'Files', 'File1', 'Dt1Mask', 'Populate', 'Outdoors', 'Scan'])

  const levelRow = findOrCreateRow(levels.rows, ['Id', 'LevelId'], safeProject.meta.areaLevelId || 'custom-map')
  setFieldValue(levelRow, ['Name', 'LevelName'], safeProject.meta.name)
  setFieldValue(levelRow, ['Id', 'LevelId'], safeProject.meta.areaLevelId || 'custom-map')
  setFieldValue(levelRow, ['LevelType', 'LvlType', 'Type'], safeProject.meta.levelTypeId)

  const mazeRow = findOrCreateRow(lvlMaze.rows, ['Level', 'Id'], safeProject.meta.areaLevelId || 'custom-map')
  setFieldValue(mazeRow, ['Name'], safeProject.meta.name)
  setFieldValue(mazeRow, ['Level', 'Id'], safeProject.meta.areaLevelId || 'custom-map')
  setFieldValue(mazeRow, ['Rooms'], String(Math.max(safeProject.placements.length, safeProject.generatorRules.roomCount.min)))
  setFieldValue(mazeRow, ['Rooms(N)'], String(Math.max(safeProject.placements.length, safeProject.generatorRules.roomCount.min)))
  setFieldValue(mazeRow, ['Rooms(H)'], String(Math.max(safeProject.placements.length, safeProject.generatorRules.roomCount.max)))
  setFieldValue(mazeRow, ['SizeX'], String(safeProject.generatorRules.sizeTarget.width))
  setFieldValue(mazeRow, ['SizeY'], String(safeProject.generatorRules.sizeTarget.height))

  const lvlPrestRows = upsertLvlPrestRows(lvlPrest.rows, safeProject.roomTemplates)
  const report = buildReport(safeProject, sourceBundle)
  const projectJson = JSON.stringify(safeProject, null, 2)

  return {
    files: [
      { name: 'Levels.txt', content: serializeTsv(levels.headers, levels.rows) },
      { name: 'LvlMaze.txt', content: serializeTsv(lvlMaze.headers, lvlMaze.rows) },
      { name: 'LvlPrest.txt', content: serializeTsv(lvlPrest.headers, lvlPrestRows) },
      { name: `${safeProject.meta.exportName || 'pd2-map-export'}.project.json`, content: projectJson },
      { name: 'EXPORT_REPORT.md', content: report },
    ],
    report,
    projectJson,
  }
}

import { CONNECTOR_SIDES } from './constants'
import { createDraftPiece, getAvailablePieceTemplates, suggestThemePresetId } from './draft'
import { getFieldValue } from './tsv'
import type {
  ConnectorSide,
  DraftPiece,
  GeneratorRuleSet,
  MapProject,
  RoomTemplate,
  SourceBundle,
  TableRow,
  WarpDefinition,
} from '../types/map'

function createId(prefix: string, value: string): string {
  return `${prefix}-${value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'item'}`
}

function toPositiveNumber(value: string, fallback: number): number {
  const parsed = Number.parseInt(value, 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

function uniqueList(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)))
}

function inferConnectorsFromName(name: string, size: { x: number; y: number }): ConnectorSide[] {
  const lower = name.toLowerCase()
  if (lower.includes('entrance') || lower.includes('entry')) {
    return ['south']
  }
  if (lower.includes('exit') || lower.includes('boss')) {
    return ['north']
  }
  if (lower.includes('bridge') || lower.includes('corridor')) {
    return size.x >= size.y ? ['east', 'west'] : ['north', 'south']
  }
  if (size.x >= 16 || size.y >= 16) {
    return ['north', 'east', 'south', 'west']
  }
  return ['east', 'west', 'south']
}

function inferTags(row: TableRow, name: string): string[] {
  const tags: string[] = []
  const lower = name.toLowerCase()

  if (getFieldValue(row, ['Outdoors']) === '1') {
    tags.push('outdoor')
  } else {
    tags.push('indoor')
  }

  if (lower.includes('boss')) {
    tags.push('boss')
  }
  if (lower.includes('entry') || lower.includes('gate')) {
    tags.push('entry')
  }
  if (lower.includes('exit')) {
    tags.push('exit')
  }
  if (lower.includes('hall') || lower.includes('corridor')) {
    tags.push('corridor')
  }
  if (getFieldValue(row, ['Populate']) === '1') {
    tags.push('dense')
  }

  return uniqueList(tags)
}

function buildWarpDefs(row: TableRow, roomName: string): WarpDefinition[] {
  if (getFieldValue(row, ['Scan']) !== '1') {
    return []
  }

  const warpId = createId('warp', roomName)
  return [
    {
      id: warpId,
      label: `${roomName} waypoint`,
      direction: 'north',
      targetLevelId: getFieldValue(row, ['LevelId', 'Id']) || undefined,
      uniqueId: getFieldValue(row, ['Def']) || undefined,
    },
  ]
}

function buildDefaultRules(roomTemplates: RoomTemplate[], theme: string, exportName: string): GeneratorRuleSet {
  return {
    seed: 'pd2-seed-001',
    themeFilters: theme ? [theme] : [],
    roomCount: {
      min: Math.max(4, Math.min(roomTemplates.length, 6)),
      max: Math.max(6, Math.min(roomTemplates.length, 10)),
    },
    sizeTarget: {
      width: 4,
      height: 4,
    },
    connectorRules: {
      requireLoop: false,
      allowDeadEnds: true,
    },
    requiredRoomIds: roomTemplates.slice(0, 2).map((room) => room.id),
    branchLimit: 2,
    exportName,
  }
}

function createRoomFromPresetRow(row: TableRow, ds1Path: string, levelTypeId: string, source: RoomTemplate['source']): RoomTemplate {
  const roomName = getFieldValue(row, ['Name']) || ds1Path.split(/[\\/]/).pop() || 'Unnamed room'
  const size = {
    x: toPositiveNumber(getFieldValue(row, ['SizeX']), 8),
    y: toPositiveNumber(getFieldValue(row, ['SizeY']), 8),
  }

  return {
    id: createId('room', `${getFieldValue(row, ['Def']) || roomName}-${ds1Path}`),
    name: roomName,
    ds1Path,
    linkedPresetId: getFieldValue(row, ['Def']) || undefined,
    levelTypeId,
    size,
    connectorSides: inferConnectorsFromName(roomName, size),
    tags: inferTags(row, roomName),
    warpDefs: buildWarpDefs(row, roomName),
    spawnHints: [],
    notes: '',
    source,
  }
}

function buildRooms(bundle: SourceBundle, levelTypeId: string): RoomTemplate[] {
  const lvlPrest = bundle.tables['LvlPrest.txt']
  const ds1Lookup = new Map(bundle.ds1Files.map((file) => [file.path.toLowerCase(), file]))
  const rooms: RoomTemplate[] = []
  const seen = new Set<string>()

  if (lvlPrest) {
    for (const row of lvlPrest.rows) {
      const fileFields = Object.keys(row)
        .filter((key) => /^file\s*\d+$/i.test(key))
        .sort((left, right) => left.localeCompare(right, undefined, { numeric: true }))

      for (const fieldName of fileFields) {
        const ds1Path = row[fieldName]?.trim()
        if (!ds1Path || ds1Path === '0' || seen.has(ds1Path.toLowerCase())) {
          continue
        }

        seen.add(ds1Path.toLowerCase())
        rooms.push(createRoomFromPresetRow(row, ds1Path, levelTypeId, bundle.origin === 'demo' ? 'demo' : 'imported'))
        const linked = ds1Lookup.get(ds1Path.toLowerCase())
        if (linked) {
          linked.linkedPresetIds.push(getFieldValue(row, ['Def']) || '')
        }
      }
    }
  }

  for (const ds1File of bundle.ds1Files) {
    if (seen.has(ds1File.path.toLowerCase())) {
      continue
    }

    const roomName = ds1File.name.replace(/\.ds1$/i, '')
    const size = { x: 8, y: 8 }
    rooms.push({
      id: createId('room', ds1File.path),
      name: roomName,
      ds1Path: ds1File.path,
      linkedPresetId: undefined,
      levelTypeId,
      size,
      connectorSides: inferConnectorsFromName(roomName, size),
      tags: ['indoor'],
      warpDefs: [],
      spawnHints: [],
      notes: 'Imported from DS1 file with no matching LvlPrest row yet.',
      source: bundle.origin === 'demo' ? 'demo' : 'imported',
    })
  }

  return rooms
}

function emptyDraft(mode: 'quick-start' | 'advanced-import' = 'quick-start') {
  return {
    mode,
    selectedThemeId: undefined,
    selectedPieceTemplateId: undefined,
    selectedPieceId: undefined,
    pieces: [] as DraftPiece[],
    notes: '',
  }
}

export function createEmptyProject(): MapProject {
  return {
    meta: {
      name: 'Untitled PD2 Map',
      description: 'Start by importing Levels.txt, LvlMaze.txt, LvlPrest.txt, LvlTypes.txt, and DS1 files.',
      areaLevelId: '',
      levelTypeId: '',
      theme: '',
      author: '',
      version: '0.1.0',
      exportName: 'pd2-map-export',
    },
    draft: emptyDraft(),
    roomTemplates: [],
    placements: [],
    generatorRules: buildDefaultRules([], '', 'pd2-map-export'),
    validation: [],
    lastEditedAt: new Date().toISOString(),
  }
}

export function createProjectFromSourceBundle(bundle: SourceBundle): MapProject {
  const empty = createEmptyProject()
  const levels = bundle.tables['Levels.txt']
  const lvlTypes = bundle.tables['LvlTypes.txt']
  const firstLevel = levels?.rows[0]
  const firstLevelType = lvlTypes?.rows[0]
  const levelTypeId =
    getFieldValue(firstLevel ?? {}, ['LevelType', 'LvlType', 'Type']) ||
    getFieldValue(firstLevelType ?? {}, ['ID', 'Id']) ||
    ''
  const theme = getFieldValue(firstLevelType ?? {}, ['Name']) || 'Imported theme'
  const name = getFieldValue(firstLevel ?? {}, ['Name', 'LevelName']) || 'Imported PD2 Map'
  const exportName = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'pd2-map-export'
  const roomTemplates = buildRooms(bundle, levelTypeId)
  const selectedThemeId = suggestThemePresetId(`${theme} ${name}`)

  return {
    ...empty,
    meta: {
      name,
      description: 'Imported from local PD2 or Diablo II extracted files.',
      areaLevelId: getFieldValue(firstLevel ?? {}, ['Id', 'LevelId']),
      levelTypeId,
      theme,
      author: '',
      version: '0.1.0',
      exportName,
    },
    draft: {
      ...emptyDraft('advanced-import'),
      selectedThemeId,
      selectedPieceTemplateId: roomTemplates[0] ? `imported-${roomTemplates[0].id}` : undefined,
    },
    roomTemplates,
    generatorRules: buildDefaultRules(roomTemplates, theme, exportName),
    lastEditedAt: new Date().toISOString(),
  }
}

export function createWarp(direction: ConnectorSide): WarpDefinition {
  const now = Date.now().toString(36)
  return {
    id: `warp-${now}`,
    label: 'New warp',
    direction,
  }
}

export function getRoomById(project: MapProject, roomId?: string): RoomTemplate | undefined {
  return roomId ? project.roomTemplates.find((room) => room.id === roomId) : undefined
}

export function getOppositeSide(side: ConnectorSide): ConnectorSide {
  const opposites: Record<ConnectorSide, ConnectorSide> = {
    north: 'south',
    east: 'west',
    south: 'north',
    west: 'east',
  }
  return opposites[side]
}

export function normalizeConnectorSides(sides: ConnectorSide[]): ConnectorSide[] {
  return CONNECTOR_SIDES.filter((side) => sides.includes(side))
}

export function normalizeProject(project: Partial<MapProject> | undefined, sourceBundle?: SourceBundle): MapProject {
  const fallback = sourceBundle ? createProjectFromSourceBundle(sourceBundle) : createEmptyProject()
  if (!project) {
    return fallback
  }

  const roomTemplates = project.roomTemplates ?? fallback.roomTemplates
  const placements = project.placements ?? fallback.placements
  const templates = getAvailablePieceTemplates(roomTemplates)
  const draftPieces =
    project.draft?.pieces ??
    placements
      .map((placement) => {
        const room = roomTemplates.find((item) => item.id === placement.roomTemplateId)
        const template = room ? templates.find((item) => item.importedRoomId === room.id) : undefined
        return template ? createDraftPiece(template, placement.x, placement.y, placement.rotation) : undefined
      })
      .filter((piece): piece is DraftPiece => Boolean(piece))

  return {
    ...fallback,
    ...project,
    meta: {
      ...fallback.meta,
      ...(project.meta ?? {}),
    },
    draft: {
      ...emptyDraft(sourceBundle ? 'advanced-import' : 'quick-start'),
      ...(project.draft ?? {}),
      selectedThemeId:
        project.draft?.selectedThemeId ??
        suggestThemePresetId(`${project.meta?.theme ?? ''} ${project.meta?.name ?? ''}`),
      selectedPieceTemplateId:
        project.draft?.selectedPieceTemplateId ??
        (roomTemplates[0] ? `imported-${roomTemplates[0].id}` : fallback.draft.selectedPieceTemplateId),
      pieces: draftPieces,
    },
    roomTemplates,
    placements,
    generatorRules: {
      ...fallback.generatorRules,
      ...(project.generatorRules ?? {}),
      roomCount: {
        ...fallback.generatorRules.roomCount,
        ...(project.generatorRules?.roomCount ?? {}),
      },
      sizeTarget: {
        ...fallback.generatorRules.sizeTarget,
        ...(project.generatorRules?.sizeTarget ?? {}),
      },
      connectorRules: {
        ...fallback.generatorRules.connectorRules,
        ...(project.generatorRules?.connectorRules ?? {}),
      },
    },
    validation: project.validation ?? fallback.validation,
    lastEditedAt: project.lastEditedAt ?? fallback.lastEditedAt,
  }
}

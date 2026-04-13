import { CONNECTOR_SIDES, REQUIRED_TABLES } from './constants'
import { getOppositeSide, getRoomById } from './project'
import { getFieldValue } from './tsv'
import type {
  ConnectorSide,
  MapProject,
  PlacementConnectorState,
  PlacedRoom,
  RoomTemplate,
  SourceBundle,
  ValidationIssue,
} from '../types/map'

function issue(
  severity: ValidationIssue['severity'],
  code: string,
  message: string,
  details?: string,
  path?: string,
): ValidationIssue {
  return {
    id: `${code}-${Math.random().toString(36).slice(2, 10)}`,
    severity,
    code,
    message,
    details,
    path,
  }
}

function fileCountFromLvlTypes(bundle?: SourceBundle): number {
  const table = bundle?.tables['LvlTypes.txt']
  if (!table) {
    return 0
  }

  return table.rows.reduce((max, row) => {
    const count = Object.keys(row).filter((key) => /^file\s*\d+$/i.test(key) && row[key] && row[key] !== '0').length
    return Math.max(max, count)
  }, 0)
}

function collectWarpIds(project: MapProject): string[] {
  return [
    ...project.roomTemplates.flatMap((room) => room.warpDefs.map((warp) => warp.id)),
    ...project.placements.flatMap((placement) => placement.warpOverrides.map((warp) => warp.id)),
  ]
}

function validateRequiredTables(bundle?: SourceBundle): ValidationIssue[] {
  if (!bundle) {
    return [issue('info', 'bundle.missing', 'No source bundle is loaded yet.')]
  }

  const missing = REQUIRED_TABLES.filter((tableName) => !bundle.tables[tableName])
  return missing.map((tableName) =>
    issue('error', 'table.missing', `${tableName} is required for safe map export.`, undefined, tableName),
  )
}

function validateLvlPrestRows(bundle?: SourceBundle): ValidationIssue[] {
  const table = bundle?.tables['LvlPrest.txt']
  if (!table) {
    return []
  }

  const ds1Paths = new Set(bundle?.ds1Files.map((file) => file.path.toLowerCase()) ?? [])
  const maxMask = fileCountFromLvlTypes(bundle)
  const maxMaskValue = maxMask > 0 ? 2 ** maxMask - 1 : 0
  const issues: ValidationIssue[] = []

  table.rows.forEach((row, index) => {
    const fileFields = Object.keys(row).filter((key) => /^file\s*\d+$/i.test(key))
    const actualFiles = fileFields.map((key) => row[key]?.trim()).filter((value) => value && value !== '0')
    const declaredCount = Number.parseInt(getFieldValue(row, ['Files']), 10)
    const dt1Mask = Number.parseInt(getFieldValue(row, ['Dt1Mask']), 10)
    const presetName = getFieldValue(row, ['Name']) || `LvlPrest row ${index + 1}`

    if (Number.isFinite(declaredCount) && declaredCount !== actualFiles.length) {
      issues.push(
        issue(
          'warning',
          'lvlprest.file-count',
          `${presetName} declares ${declaredCount} file slots but references ${actualFiles.length} DS1 files.`,
          'Files column should match File1..FileN usage.',
        ),
      )
    }

    actualFiles.forEach((filePath) => {
      if (!ds1Paths.has(filePath.toLowerCase())) {
        issues.push(
          issue(
            'error',
            'lvlprest.ds1-missing',
            `${presetName} references a DS1 file that is not in the imported bundle.`,
            filePath,
            filePath,
          ),
        )
      }
    })

    if (actualFiles.length > 0 && (!Number.isFinite(dt1Mask) || dt1Mask <= 0)) {
      issues.push(
        issue(
          'warning',
          'lvlprest.dt1mask-invalid',
          `${presetName} has an invalid Dt1Mask value.`,
          'Set Dt1Mask to a positive integer that matches the selected LevelType tile files.',
        ),
      )
    } else if (maxMaskValue > 0 && dt1Mask > maxMaskValue) {
      issues.push(
        issue(
          'warning',
          'lvlprest.dt1mask-range',
          `${presetName} uses a Dt1Mask higher than the imported LvlTypes rows appear to support.`,
          `Imported tile-file capacity suggests a maximum mask of ${maxMaskValue}.`,
        ),
      )
    }
  })

  return issues
}

function validateWarpIds(project: MapProject): ValidationIssue[] {
  const counts = new Map<string, number>()
  const issues: ValidationIssue[] = []

  for (const warpId of collectWarpIds(project)) {
    counts.set(warpId, (counts.get(warpId) ?? 0) + 1)
  }

  counts.forEach((count, warpId) => {
    if (count > 1) {
      issues.push(
        issue(
          'error',
          'warp.duplicate-id',
          `Warp id "${warpId}" is used ${count} times.`,
          'Each warp id should be unique before export.',
        ),
      )
    }
  })

  return issues
}

function placementLookup(placements: PlacedRoom[]): Map<string, PlacedRoom[]> {
  const lookup = new Map<string, PlacedRoom[]>()
  for (const placement of placements) {
    const key = `${placement.x},${placement.y}`
    lookup.set(key, [...(lookup.get(key) ?? []), placement])
  }
  return lookup
}

function roomHasConnector(room: RoomTemplate | undefined, side: ConnectorSide): boolean {
  return room?.connectorSides.includes(side) ?? false
}

function neighborCoordinate(placement: PlacedRoom, side: ConnectorSide): { x: number; y: number } {
  switch (side) {
    case 'north':
      return { x: placement.x, y: placement.y - 1 }
    case 'east':
      return { x: placement.x + 1, y: placement.y }
    case 'south':
      return { x: placement.x, y: placement.y + 1 }
    case 'west':
      return { x: placement.x - 1, y: placement.y }
  }
}

export function getPlacementConnectorStates(project: MapProject): PlacementConnectorState[] {
  const states: PlacementConnectorState[] = []
  const lookup = placementLookup(project.placements)

  for (const placement of project.placements) {
    const room = getRoomById(project, placement.roomTemplateId)
    for (const side of CONNECTOR_SIDES) {
      if (!roomHasConnector(room, side)) {
        continue
      }

      const neighborPos = neighborCoordinate(placement, side)
      const neighborPlacement = lookup.get(`${neighborPos.x},${neighborPos.y}`)?.[0]
      const neighborRoom = neighborPlacement ? getRoomById(project, neighborPlacement.roomTemplateId) : undefined
      const matches = roomHasConnector(neighborRoom, getOppositeSide(side))
      states.push({
        placementId: placement.placementId,
        side,
        state: !neighborPlacement ? 'open' : matches ? 'matched' : 'conflict',
      })
    }
  }

  return states
}

function validatePlacements(project: MapProject): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  const lookup = placementLookup(project.placements)

  lookup.forEach((placements, key) => {
    if (placements.length > 1) {
      issues.push(
        issue(
          'error',
          'placement.overlap',
          `Multiple rooms occupy grid cell ${key}.`,
          'Move or remove overlapping placements in the composer.',
        ),
      )
    }
  })

  const connectorStates = getPlacementConnectorStates(project)
  for (const state of connectorStates) {
    if (state.state === 'conflict') {
      issues.push(
        issue(
          'warning',
          'placement.connector-conflict',
          `Placement ${state.placementId} has a connector mismatch on the ${state.side} side.`,
          'Neighbor rooms should expose matching opposite connectors.',
        ),
      )
    }
    if (state.state === 'open' && !project.generatorRules.connectorRules.allowDeadEnds) {
      issues.push(
        issue(
          'warning',
          'placement.dead-end',
          `Placement ${state.placementId} leaves an open ${state.side} connector while dead ends are disabled.`,
          'Either add a connecting room or allow dead ends in generator rules.',
        ),
      )
    }
  }

  if (project.generatorRules.roomCount.max < project.generatorRules.roomCount.min) {
    issues.push(
      issue(
        'error',
        'generator.room-count',
        'Generator room count max cannot be smaller than min.',
      ),
    )
  }

  return issues
}

export function validateWorkspace(bundle: SourceBundle | undefined, project: MapProject): ValidationIssue[] {
  return [
    ...validateRequiredTables(bundle),
    ...(bundle?.issues ?? []),
    ...validateLvlPrestRows(bundle),
    ...validateWarpIds(project),
    ...validatePlacements(project),
  ]
}

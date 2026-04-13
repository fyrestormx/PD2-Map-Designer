import { getFieldValue } from './tsv'
import { getAvailablePieceTemplates, getDraftConnectorStates, getThemePreset, slugify } from './draft'
import type { BindingState, MapProject, PlacedRoom, SourceBundle } from '../types/map'

interface LevelTypeMatch {
  levelTypeId?: string
  levelTypeName?: string
}

function findBestLevelTypeMatch(sourceBundle: SourceBundle | undefined, themeId?: string): LevelTypeMatch {
  if (!sourceBundle || !themeId) {
    return {}
  }

  const theme = getThemePreset(themeId)
  const lvlTypes = sourceBundle.tables['LvlTypes.txt']
  if (!theme || !lvlTypes) {
    return {}
  }

  const ranked = lvlTypes.rows
    .map((row) => {
      const haystack = `${getFieldValue(row, ['Name'])} ${Object.values(row).join(' ')}`.toLowerCase()
      const score = theme.levelTypeKeywords.filter((keyword) => haystack.includes(keyword)).length
      return { row, score }
    })
    .sort((left, right) => right.score - left.score)

  const best = ranked[0]
  if (!best || best.score === 0) {
    return {}
  }

  return {
    levelTypeId: getFieldValue(best.row, ['ID', 'Id']),
    levelTypeName: getFieldValue(best.row, ['Name']),
  }
}

export function draftPlacementsFromProject(project: MapProject): PlacedRoom[] {
  return project.draft.pieces
    .filter((piece) => piece.importedRoomId)
    .map((piece) => ({
      placementId: piece.id,
      roomTemplateId: piece.importedRoomId!,
      x: piece.x,
      y: piece.y,
      rotation: piece.rotation,
      locked: false,
      warpOverrides: [],
    }))
}

function starterPieceNames(project: MapProject): string[] {
  return project.draft.pieces
    .filter((piece) => piece.source === 'starter')
    .map((piece) => piece.name)
}

function hasReviewRole(project: MapProject, role: 'entrance' | 'exit'): boolean {
  return project.draft.pieces.some((piece) => piece.kind === role)
}

export function getBindingState(project: MapProject, sourceBundle?: SourceBundle): BindingState {
  const templates = getAvailablePieceTemplates(project.roomTemplates)
  const connectorStates = getDraftConnectorStates(project.draft, templates)
  const openConnectorCount = connectorStates.filter((state) => state.state !== 'matched').length
  const importedPieceCount = project.draft.pieces.filter((piece) => piece.source === 'imported').length
  const starterPieceCount = project.draft.pieces.filter((piece) => piece.source === 'starter').length
  const blockers: string[] = []
  const warnings: string[] = []
  const levelTypeMatch = findBestLevelTypeMatch(sourceBundle, project.draft.selectedThemeId)

  if (!project.draft.selectedThemeId) {
    blockers.push('Choose a theme first.')
  }

  if (project.draft.pieces.length === 0) {
    blockers.push('Place at least one room or corridor on the build canvas.')
  }

  if (!sourceBundle) {
    blockers.push('Import extracted PD2 files in Advanced Mode before building a PD2 export bundle.')
  }

  if (sourceBundle && !levelTypeMatch.levelTypeId) {
    blockers.push('The chosen theme does not match any imported LevelType yet.')
  }

  if (starterPieceCount > 0) {
    blockers.push('Replace starter-only pieces with imported room pieces before PD2 export.')
  }

  if (importedPieceCount === 0) {
    blockers.push('Use at least one imported room piece before PD2 export.')
  }

  if (openConnectorCount > 0) {
    blockers.push('Close or fix all open connector warnings before PD2 export.')
  }

  if (!hasReviewRole(project, 'entrance')) {
    warnings.push('Add an entrance marker so the layout is easier to understand.')
  }

  if (!hasReviewRole(project, 'exit')) {
    warnings.push('Add an exit or boss end marker so the route has a clear finish.')
  }

  if (starterPieceCount > 0) {
    warnings.push(`Starter shapes still in use: ${starterPieceNames(project).slice(0, 4).join(', ')}.`)
  }

  return {
    hasImportedData: Boolean(sourceBundle),
    themeBound: Boolean(levelTypeMatch.levelTypeId),
    levelTypeId: levelTypeMatch.levelTypeId,
    levelTypeName: levelTypeMatch.levelTypeName,
    blockers,
    warnings,
    openConnectorCount,
    importedPieceCount,
    starterPieceCount,
    canExportToPd2: blockers.length === 0,
  }
}

export function projectForPd2Export(project: MapProject, sourceBundle?: SourceBundle): MapProject | undefined {
  const bindingState = getBindingState(project, sourceBundle)
  if (!bindingState.canExportToPd2) {
    return undefined
  }

  const theme = getThemePreset(project.draft.selectedThemeId)
  return {
    ...project,
    meta: {
      ...project.meta,
      theme: theme?.name ?? project.meta.theme,
      levelTypeId: bindingState.levelTypeId ?? project.meta.levelTypeId,
      exportName: slugify(project.meta.name || theme?.name || project.meta.exportName),
    },
    placements: draftPlacementsFromProject(project),
  }
}

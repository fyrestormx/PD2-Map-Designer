import { getBindingState } from './bindings'
import { countDraftKinds, getThemePreset } from './draft'
import { findImportedLevelTypeOption } from './levelTypes'
import type { ExportBundle, ExportTextFile, MapProject, SourceBundle } from '../types/map'

export function buildReviewSummary(project: MapProject, sourceBundle?: SourceBundle): string {
  const bindingState = getBindingState(project, sourceBundle)
  const theme = getThemePreset(project.draft.selectedThemeId)
  const localTileset = findImportedLevelTypeOption(sourceBundle, project.draft.selectedImportedLevelTypeId)
  const counts = countDraftKinds(project.draft.pieces)

  return [
    `# ${project.meta.name || 'PD2 Map Draft'}`,
    '',
    '## Summary',
    `- Theme: ${theme?.name ?? 'Not chosen'}`,
    `- Local tileset: ${localTileset?.name ?? bindingState.levelTypeName ?? 'Not chosen'}`,
    `- Total pieces: ${project.draft.pieces.length}`,
    `- Saved variations: ${project.variants.length}`,
    `- PD2 export ready: ${bindingState.canExportToPd2 ? 'Yes' : 'No'}`,
    '',
    '## Layout counts',
    `- Rooms: ${counts.room}`,
    `- Straight corridors: ${counts['corridor-straight']}`,
    `- Corner corridors: ${counts['corridor-corner']}`,
    `- Junctions: ${counts['junction-t'] + counts['junction-cross']}`,
    `- Entrances: ${counts.entrance}`,
    `- Exits: ${counts.exit}`,
    `- Boss rooms: ${counts['boss-room']}`,
    '',
    '## Route notes',
    project.draft.notes || 'No route notes yet.',
    '',
    '## Blockers',
    ...(bindingState.blockers.length ? bindingState.blockers.map((item) => `- ${item}`) : ['- None']),
    '',
    '## Warnings',
    ...(bindingState.warnings.length ? bindingState.warnings.map((item) => `- ${item}`) : ['- None']),
    '',
  ].join('\n')
}

export function buildReviewPacketFiles(
  project: MapProject,
  sourceBundle: SourceBundle | undefined,
  exportBundle: ExportBundle | undefined,
): ExportTextFile[] {
  const files: ExportTextFile[] = [
    {
      name: `${project.meta.exportName || 'pd2-map-draft'}.planner.json`,
      content: JSON.stringify(project, null, 2),
    },
    {
      name: `${project.meta.exportName || 'pd2-map-draft'}-review.md`,
      content: buildReviewSummary(project, sourceBundle),
    },
  ]

  if (exportBundle) {
    files.push(...exportBundle.files)
    files.push({
      name: `${project.meta.exportName || 'pd2-map-draft'}-raw-export-report.txt`,
      content: exportBundle.report,
    })
  }

  return files
}

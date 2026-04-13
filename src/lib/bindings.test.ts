import { describe, expect, it } from 'vitest'
import { getBindingState } from './bindings'
import { createProjectFromSourceBundle, createEmptyProject } from './project'
import { createDraftPiece, getAvailablePieceTemplates, THEME_PRESETS } from './draft'
import { buildWorkspaceFromLoadedFiles } from './sourceImport'
import { getDemoImportFiles } from './sampleData'

describe('binding state', () => {
  it('blocks PD2 export when no imported data exists', () => {
    const project = createEmptyProject()
    project.draft.selectedThemeId = THEME_PRESETS[0].id
    project.draft.pieces = [createDraftPiece(getAvailablePieceTemplates([])[0], 0, 0, 0)]

    const bindingState = getBindingState(project)
    expect(bindingState.canExportToPd2).toBe(false)
    expect(bindingState.blockers).toContain('Import extracted PD2 files in Advanced Mode before building a PD2 export bundle.')
  })

  it('binds a matching imported theme and imported room pieces', () => {
    const { sourceBundle } = buildWorkspaceFromLoadedFiles(getDemoImportFiles(), 'demo')
    const project = createProjectFromSourceBundle(sourceBundle)
    project.draft.selectedThemeId = 'hell-wastes'
    const importedTemplate = getAvailablePieceTemplates(project.roomTemplates).find((template) => template.source === 'imported')!
    project.draft.pieces = [createDraftPiece(importedTemplate, 0, 0, 0)]

    const bindingState = getBindingState(project, sourceBundle)
    expect(bindingState.themeBound).toBe(true)
    expect(bindingState.levelTypeName).toBe('Hell Wastes')
  })
})

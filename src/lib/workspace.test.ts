import { describe, expect, it } from 'vitest'
import { buildExportBundle } from './exporter'
import { buildWorkspaceFromLoadedFiles } from './sourceImport'
import { getDemoImportFiles } from './sampleData'
import { validateWorkspace } from './validation'

describe('workspace flow', () => {
  it('creates a project from demo data', () => {
    const { sourceBundle, project } = buildWorkspaceFromLoadedFiles(getDemoImportFiles(), 'demo')
    expect(Object.keys(sourceBundle.tables)).toHaveLength(4)
    expect(project.meta.name).toBe('Ember March')
    expect(project.roomTemplates.length).toBeGreaterThan(0)
  })

  it('validates and exports a workspace', () => {
    const { sourceBundle, project } = buildWorkspaceFromLoadedFiles(getDemoImportFiles(), 'demo')
    const validation = validateWorkspace(sourceBundle, project)
    const bundle = buildExportBundle(project, sourceBundle)

    expect(validation.filter((issue) => issue.severity === 'error')).toHaveLength(0)
    expect(bundle.files.map((file) => file.name)).toEqual(
      expect.arrayContaining(['Levels.txt', 'LvlMaze.txt', 'LvlPrest.txt', 'EXPORT_REPORT.md']),
    )
  })
})

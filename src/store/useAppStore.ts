import { create } from 'zustand'
import { buildExportBundle } from '../lib/exporter'
import { loadWorkspace, saveWorkspace } from '../lib/persistence'
import { createEmptyProject, createProjectFromSourceBundle, getRoomById, normalizeConnectorSides, normalizeProject } from '../lib/project'
import { getDemoImportFiles } from '../lib/sampleData'
import { buildWorkspaceFromLoadedFiles, loadFilesFromSelection } from '../lib/sourceImport'
import { validateWorkspace } from '../lib/validation'
import { draftPlacementsFromProject, projectForPd2Export } from '../lib/bindings'
import {
  STARTER_PIECE_TEMPLATES,
  createDraftPiece,
  findBestRotationForPlacement,
  findPieceAt,
  findPieceTemplate,
  getAvailablePieceTemplates,
  getThemePreset,
} from '../lib/draft'
import type {
  ConnectorSide,
  DraftPiece,
  ExportBundle,
  MapDraft,
  MapProject,
  PersistedWorkspace,
  SourceBundle,
  UserPreferences,
} from '../types/map'

type ImportStatus = 'idle' | 'loading' | 'ready' | 'error'

interface AppState {
  sourceBundle?: SourceBundle
  project: MapProject
  preferences: UserPreferences
  exportBundle?: ExportBundle
  importStatus: ImportStatus
  importError?: string
  hydrated: boolean
  lastSavedAt?: string
  zoom: number
  pan: {
    x: number
    y: number
  }
  selectedAdvancedRoomTemplateId?: string
  hydrateFromIndexedDb: () => Promise<void>
  setGuidedMode: (guidedMode: boolean) => void
  importBrowserFiles: (files: File[]) => Promise<void>
  loadDemoProject: () => void
  startQuickStart: () => void
  updateMeta: (patch: Partial<MapProject['meta']>) => void
  selectTheme: (themeId: string) => void
  selectImportedLevelType: (levelTypeId?: string) => void
  selectPieceTemplate: (templateId?: string) => void
  selectDraftPiece: (pieceId?: string) => void
  placePiece: (x: number, y: number) => void
  movePiece: (pieceId: string, x: number, y: number) => void
  rotateDraftPiece: (pieceId: string) => void
  duplicateDraftPiece: (pieceId: string) => void
  deleteDraftPiece: (pieceId: string) => void
  updateDraftPiece: (pieceId: string, patch: Partial<DraftPiece>) => void
  updateDraftNotes: (notes: string) => void
  saveDraftVariant: () => void
  loadDraftVariant: (variantId: string) => void
  deleteDraftVariant: (variantId: string) => void
  clearDraft: () => void
  selectRoomTemplate: (roomId?: string) => void
  updateRoomTemplate: (roomId: string, patch: Partial<MapProject['roomTemplates'][number]>) => void
  toggleRoomConnector: (roomId: string, side: ConnectorSide) => void
  buildExport: () => void
  clearExport: () => void
  runValidation: () => void
  setZoom: (zoom: number) => void
  nudgePan: (deltaX: number, deltaY: number) => void
}

function nextRotation(rotation: DraftPiece['rotation']): DraftPiece['rotation'] {
  const order: DraftPiece['rotation'][] = [0, 90, 180, 270]
  const index = order.indexOf(rotation)
  return order[(index + 1) % order.length]
}

function nextProject(project: MapProject, sourceBundle?: SourceBundle): MapProject {
  const normalized = normalizeProject(project, sourceBundle)
  const placements = draftPlacementsFromProject(normalized)
  const exportCandidate = projectForPd2Export({ ...normalized, placements }, sourceBundle)
  const validationTarget = exportCandidate ?? { ...normalized, placements }

  return {
    ...normalized,
    placements,
    validation: validateWorkspace(sourceBundle, validationTarget),
    lastEditedAt: new Date().toISOString(),
  }
}

function nearestFreeCell(project: MapProject, x: number, y: number): { x: number; y: number } {
  const candidates = [
    { x: x + 1, y },
    { x: x - 1, y },
    { x, y: y + 1 },
    { x, y: y - 1 },
    { x: x + 1, y: y + 1 },
    { x: x - 1, y: y - 1 },
  ]
  return candidates.find((candidate) => !findPieceAt(project.draft.pieces, candidate.x, candidate.y)) ?? { x: x + 1, y }
}

const defaultPreferences: UserPreferences = {
  guidedMode: true,
  setupComplete: false,
}

function cloneDraft(draft: MapDraft): MapDraft {
  return {
    ...draft,
    pieces: draft.pieces.map((piece) => ({ ...piece })),
  }
}

function nextVariantName(project: MapProject): string {
  let nextNumber = project.variants.length + 1
  while (project.variants.some((variant) => variant.name === `Variation ${nextNumber}`)) {
    nextNumber += 1
  }
  return `Variation ${nextNumber}`
}

export const useAppStore = create<AppState>((set, get) => {
  const persist = async (
    project = get().project,
    sourceBundle = get().sourceBundle,
    preferences = get().preferences,
  ) => {
    const snapshot: PersistedWorkspace = {
      id: 'latest',
      sourceBundle,
      project,
      preferences,
      updatedAt: new Date().toISOString(),
    }
    await saveWorkspace(snapshot)
    set({ lastSavedAt: snapshot.updatedAt })
  }

  const commitProject = (project: MapProject) => {
    const sourceBundle = get().sourceBundle
    const normalized = nextProject(project, sourceBundle)
    set({ project: normalized, exportBundle: undefined })
    void persist(normalized, sourceBundle, get().preferences)
  }

  const replaceWorkspace = (
    project: MapProject,
    sourceBundle?: SourceBundle,
    preferencePatch?: Partial<UserPreferences>,
  ) => {
    const normalized = nextProject(project, sourceBundle)
    const preferences = { ...get().preferences, ...preferencePatch }
    set({
      sourceBundle,
      project: normalized,
      preferences,
      selectedAdvancedRoomTemplateId: normalized.roomTemplates[0]?.id,
      exportBundle: undefined,
      importStatus: sourceBundle ? 'ready' : 'idle',
      importError: undefined,
    })
    void persist(normalized, sourceBundle, preferences)
  }

  return {
    sourceBundle: undefined,
    project: createEmptyProject(),
    preferences: defaultPreferences,
    exportBundle: undefined,
    importStatus: 'idle',
    importError: undefined,
    hydrated: false,
    lastSavedAt: undefined,
    zoom: 1,
    pan: { x: 0, y: 0 },
    selectedAdvancedRoomTemplateId: undefined,

    async hydrateFromIndexedDb() {
      if (get().hydrated) {
        return
      }
      const workspace = await loadWorkspace('latest')
      if (workspace) {
        const project = nextProject(workspace.project, workspace.sourceBundle)
        const preferences = {
          ...defaultPreferences,
          ...(workspace.preferences ?? {}),
          setupComplete:
            workspace.preferences?.setupComplete ??
            Boolean(workspace.sourceBundle || project.draft.selectedThemeId || project.draft.pieces.length),
        }
        set({
          sourceBundle: workspace.sourceBundle,
          project,
          preferences,
          selectedAdvancedRoomTemplateId: project.roomTemplates[0]?.id,
          lastSavedAt: workspace.updatedAt,
          importStatus: workspace.sourceBundle ? 'ready' : 'idle',
        })
      }
      set({ hydrated: true })
    },

    setGuidedMode(guidedMode) {
      const preferences = {
        ...get().preferences,
        guidedMode,
      }
      set({ preferences })
      void persist(get().project, get().sourceBundle, preferences)
    },

    async importBrowserFiles(files) {
      set({ importStatus: 'loading', importError: undefined })
      try {
        const { files: loadedFiles, origin } = await loadFilesFromSelection(files)
        const { sourceBundle, project } = buildWorkspaceFromLoadedFiles(loadedFiles, origin)
        replaceWorkspace(project, sourceBundle, { setupComplete: true })
      } catch (error) {
        set({
          importStatus: 'error',
          importError: error instanceof Error ? error.message : 'Import failed.',
        })
      }
    },

    loadDemoProject() {
      const { sourceBundle, project } = buildWorkspaceFromLoadedFiles(getDemoImportFiles(), 'demo')
      replaceWorkspace(project, sourceBundle, { setupComplete: true })
    },

    startQuickStart() {
      const sourceBundle = get().sourceBundle
      const baseProject = sourceBundle ? createProjectFromSourceBundle(sourceBundle) : createEmptyProject()
      replaceWorkspace(
        {
          ...baseProject,
          meta: {
            ...baseProject.meta,
            name: sourceBundle ? baseProject.meta.name : 'New Map Draft',
            description: 'Plan your map visually with starter rooms and corridors first.',
          },
          draft: {
            ...baseProject.draft,
            mode: 'quick-start',
            selectedPieceTemplateId: STARTER_PIECE_TEMPLATES[0].id,
            selectedPieceId: undefined,
            pieces: [],
            notes: '',
          },
        },
        sourceBundle,
        { setupComplete: true },
      )
    },

    updateMeta(patch) {
      commitProject({
        ...get().project,
        meta: {
          ...get().project.meta,
          ...patch,
        },
      })
    },

    selectTheme(themeId) {
      const theme = getThemePreset(themeId)
      commitProject({
        ...get().project,
        draft: {
          ...get().project.draft,
          selectedThemeId: themeId,
        },
        meta: {
          ...get().project.meta,
          theme: theme?.name ?? get().project.meta.theme,
          exportName: get().project.meta.exportName || theme?.id || get().project.meta.exportName,
        },
      })
    },

    selectImportedLevelType(levelTypeId) {
      commitProject({
        ...get().project,
        draft: {
          ...get().project.draft,
          selectedImportedLevelTypeId: levelTypeId,
        },
        meta: {
          ...get().project.meta,
          levelTypeId: levelTypeId ?? '',
        },
      })
    },

    selectPieceTemplate(templateId) {
      commitProject({
        ...get().project,
        draft: {
          ...get().project.draft,
          selectedPieceTemplateId: templateId,
        },
      })
    },

    selectDraftPiece(pieceId) {
      commitProject({
        ...get().project,
        draft: {
          ...get().project.draft,
          selectedPieceId: pieceId,
        },
      })
    },

    placePiece(x, y) {
      const project = get().project
      const templates = getAvailablePieceTemplates(project.roomTemplates)
      const selectedTemplate = findPieceTemplate(templates, project.draft.selectedPieceTemplateId)
      if (!selectedTemplate) {
        return
      }

      const rotation = findBestRotationForPlacement(selectedTemplate, x, y, project.draft.pieces, templates)
      const pieces = project.draft.pieces.filter((piece) => !(piece.x === x && piece.y === y))
      const newPiece = createDraftPiece(selectedTemplate, x, y, rotation)
      pieces.push(newPiece)

      commitProject({
        ...project,
        draft: {
          ...project.draft,
          pieces,
          selectedPieceId: newPiece.id,
        },
      })
    },

    movePiece(pieceId, x, y) {
      const project = get().project
      const piece = project.draft.pieces.find((item) => item.id === pieceId)
      if (!piece) {
        return
      }
      const occupied = project.draft.pieces.find((item) => item.id !== pieceId && item.x === x && item.y === y)
      if (occupied) {
        return
      }

      commitProject({
        ...project,
        draft: {
          ...project.draft,
          pieces: project.draft.pieces.map((item) => (item.id === pieceId ? { ...item, x, y } : item)),
          selectedPieceId: pieceId,
        },
      })
    },

    rotateDraftPiece(pieceId) {
      commitProject({
        ...get().project,
        draft: {
          ...get().project.draft,
          pieces: get().project.draft.pieces.map((piece) =>
            piece.id === pieceId ? { ...piece, rotation: nextRotation(piece.rotation) } : piece,
          ),
        },
      })
    },

    duplicateDraftPiece(pieceId) {
      const project = get().project
      const piece = project.draft.pieces.find((item) => item.id === pieceId)
      if (!piece) {
        return
      }

      const templates = getAvailablePieceTemplates(project.roomTemplates)
      const template = findPieceTemplate(templates, piece.templateId)
      if (!template) {
        return
      }

      const nextCell = nearestFreeCell(project, piece.x, piece.y)
      const duplicate = createDraftPiece(template, nextCell.x, nextCell.y, piece.rotation)
      duplicate.label = piece.label
      duplicate.notes = piece.notes
      duplicate.name = `${piece.name} Copy`

      commitProject({
        ...project,
        draft: {
          ...project.draft,
          pieces: [...project.draft.pieces, duplicate],
          selectedPieceId: duplicate.id,
        },
      })
    },

    deleteDraftPiece(pieceId) {
      const project = get().project
      commitProject({
        ...project,
        draft: {
          ...project.draft,
          pieces: project.draft.pieces.filter((piece) => piece.id !== pieceId),
          selectedPieceId: project.draft.selectedPieceId === pieceId ? undefined : project.draft.selectedPieceId,
        },
      })
    },

    updateDraftPiece(pieceId, patch) {
      commitProject({
        ...get().project,
        draft: {
          ...get().project.draft,
          pieces: get().project.draft.pieces.map((piece) =>
            piece.id === pieceId ? { ...piece, ...patch, id: piece.id, templateId: piece.templateId } : piece,
          ),
        },
      })
    },

    updateDraftNotes(notes) {
      commitProject({
        ...get().project,
        draft: {
          ...get().project.draft,
          notes,
        },
      })
    },

    saveDraftVariant() {
      const project = get().project
      const savedAt = new Date().toISOString()
      commitProject({
        ...project,
        variants: [
          {
            id: `variant-${Date.now().toString(36)}`,
            name: nextVariantName(project),
            savedAt,
            draft: cloneDraft(project.draft),
          },
          ...project.variants,
        ],
      })
    },

    loadDraftVariant(variantId) {
      const project = get().project
      const variant = project.variants.find((item) => item.id === variantId)
      if (!variant) {
        return
      }

      commitProject({
        ...project,
        draft: {
          ...cloneDraft(variant.draft),
          selectedPieceId: undefined,
        },
      })
    },

    deleteDraftVariant(variantId) {
      const project = get().project
      commitProject({
        ...project,
        variants: project.variants.filter((variant) => variant.id !== variantId),
      })
    },

    clearDraft() {
      commitProject({
        ...get().project,
        draft: {
          ...get().project.draft,
          pieces: [],
          selectedPieceId: undefined,
          selectedPieceTemplateId: STARTER_PIECE_TEMPLATES[0].id,
          notes: '',
        },
      })
    },

    selectRoomTemplate(roomId) {
      set({ selectedAdvancedRoomTemplateId: roomId })
    },

    updateRoomTemplate(roomId, patch) {
      commitProject({
        ...get().project,
        roomTemplates: get().project.roomTemplates.map((room) =>
          room.id === roomId
            ? {
                ...room,
                ...patch,
                connectorSides: patch.connectorSides ? normalizeConnectorSides(patch.connectorSides) : room.connectorSides,
              }
            : room,
        ),
      })
    },

    toggleRoomConnector(roomId, side) {
      const room = getRoomById(get().project, roomId)
      if (!room) {
        return
      }
      const nextSides = room.connectorSides.includes(side)
        ? room.connectorSides.filter((item) => item !== side)
        : [...room.connectorSides, side]
      get().updateRoomTemplate(roomId, { connectorSides: nextSides })
    },

    buildExport() {
      const exportProject = projectForPd2Export(get().project, get().sourceBundle)
      if (!exportProject) {
        set({ exportBundle: undefined })
        return
      }

      const exportBundle = buildExportBundle(exportProject, get().sourceBundle)
      set({ exportBundle })
      void persist(get().project, get().sourceBundle, get().preferences)
    },

    clearExport() {
      set({ exportBundle: undefined })
    },

    runValidation() {
      commitProject({ ...get().project })
    },

    setZoom(zoom) {
      set({ zoom })
    },

    nudgePan(deltaX, deltaY) {
      set({
        pan: {
          x: get().pan.x + deltaX,
          y: get().pan.y + deltaY,
        },
      })
    },
  }
})

import { create } from 'zustand'
import { buildExportBundle } from '../lib/exporter'
import { generateLayoutCandidates } from '../lib/generator'
import { loadWorkspace, saveWorkspace } from '../lib/persistence'
import { createEmptyProject, createWarp, getRoomById, normalizeConnectorSides } from '../lib/project'
import { getDemoImportFiles } from '../lib/sampleData'
import { buildWorkspaceFromLoadedFiles, loadFilesFromSelection } from '../lib/sourceImport'
import { validateWorkspace } from '../lib/validation'
import type {
  ConnectorSide,
  ExportBundle,
  GeneratedLayoutCandidate,
  MapProject,
  PersistedWorkspace,
  SourceBundle,
  WarpDefinition,
} from '../types/map'

type ImportStatus = 'idle' | 'loading' | 'ready' | 'error'

interface AppState {
  sourceBundle?: SourceBundle
  project: MapProject
  generatorCandidates: GeneratedLayoutCandidate[]
  activeCandidateIndex: number
  selectedRoomTemplateId?: string
  selectedPlacementId?: string
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
  hydrateFromIndexedDb: () => Promise<void>
  importBrowserFiles: (files: File[]) => Promise<void>
  loadDemoProject: () => void
  updateMeta: (patch: Partial<MapProject['meta']>) => void
  selectRoomTemplate: (roomId?: string) => void
  updateRoomTemplate: (roomId: string, patch: Partial<MapProject['roomTemplates'][number]>) => void
  toggleRoomConnector: (roomId: string, side: ConnectorSide) => void
  placeSelectedRoom: (x: number, y: number) => void
  selectPlacement: (placementId?: string) => void
  updatePlacement: (placementId: string, patch: Partial<MapProject['placements'][number]>) => void
  removePlacement: (placementId: string) => void
  addWarpOverride: (placementId: string, direction: ConnectorSide) => void
  updateWarpOverride: (placementId: string, warpId: string, patch: Partial<WarpDefinition>) => void
  removeWarpOverride: (placementId: string, warpId: string) => void
  updateGeneratorRules: (patch: Partial<MapProject['generatorRules']>) => void
  generateCandidates: () => void
  applyCandidate: (index: number) => void
  runValidation: () => void
  buildExport: () => void
  setZoom: (zoom: number) => void
  nudgePan: (deltaX: number, deltaY: number) => void
}

function nextProject(project: MapProject, sourceBundle?: SourceBundle): MapProject {
  return {
    ...project,
    validation: validateWorkspace(sourceBundle, project),
    lastEditedAt: new Date().toISOString(),
  }
}

export const useAppStore = create<AppState>((set, get) => {
  const persist = async (project = get().project, sourceBundle = get().sourceBundle) => {
    const snapshot: PersistedWorkspace = {
      id: 'latest',
      sourceBundle,
      project,
      updatedAt: new Date().toISOString(),
    }
    await saveWorkspace(snapshot)
    set({ lastSavedAt: snapshot.updatedAt })
  }

  const commitProject = (project: MapProject) => {
    const sourceBundle = get().sourceBundle
    const normalized = nextProject(project, sourceBundle)
    set({ project: normalized, exportBundle: undefined })
    void persist(normalized, sourceBundle)
  }

  const replaceWorkspace = (project: MapProject, sourceBundle?: SourceBundle) => {
    const normalized = nextProject(project, sourceBundle)
    set({
      sourceBundle,
      project: normalized,
      generatorCandidates: [],
      activeCandidateIndex: 0,
      selectedRoomTemplateId: normalized.roomTemplates[0]?.id,
      selectedPlacementId: undefined,
      exportBundle: undefined,
      importStatus: 'ready',
      importError: undefined,
    })
    void persist(normalized, sourceBundle)
  }

  return {
    sourceBundle: undefined,
    project: createEmptyProject(),
    generatorCandidates: [],
    activeCandidateIndex: 0,
    selectedRoomTemplateId: undefined,
    selectedPlacementId: undefined,
    exportBundle: undefined,
    importStatus: 'idle',
    importError: undefined,
    hydrated: false,
    lastSavedAt: undefined,
    zoom: 1,
    pan: { x: 0, y: 0 },

    async hydrateFromIndexedDb() {
      if (get().hydrated) {
        return
      }
      const workspace = await loadWorkspace('latest')
      if (workspace) {
        set({
          sourceBundle: workspace.sourceBundle,
          project: nextProject(workspace.project, workspace.sourceBundle),
          selectedRoomTemplateId: workspace.project.roomTemplates[0]?.id,
          lastSavedAt: workspace.updatedAt,
          importStatus: workspace.sourceBundle ? 'ready' : 'idle',
        })
      }
      set({ hydrated: true })
    },

    async importBrowserFiles(files) {
      set({ importStatus: 'loading', importError: undefined })
      try {
        const { files: loadedFiles, origin } = await loadFilesFromSelection(files)
        const { sourceBundle, project } = buildWorkspaceFromLoadedFiles(loadedFiles, origin)
        replaceWorkspace(project, sourceBundle)
      } catch (error) {
        set({
          importStatus: 'error',
          importError: error instanceof Error ? error.message : 'Import failed.',
        })
      }
    },

    loadDemoProject() {
      const { sourceBundle, project } = buildWorkspaceFromLoadedFiles(getDemoImportFiles(), 'demo')
      replaceWorkspace(project, sourceBundle)
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

    selectRoomTemplate(roomId) {
      set({ selectedRoomTemplateId: roomId })
    },

    updateRoomTemplate(roomId, patch) {
      commitProject({
        ...get().project,
        roomTemplates: get().project.roomTemplates.map((room) =>
          room.id === roomId
            ? {
                ...room,
                ...patch,
                connectorSides: patch.connectorSides
                  ? normalizeConnectorSides(patch.connectorSides)
                  : room.connectorSides,
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

    placeSelectedRoom(x, y) {
      const roomId = get().selectedRoomTemplateId
      if (!roomId) {
        return
      }
      const nextPlacements = get().project.placements.filter((placement) => !(placement.x === x && placement.y === y && !placement.locked))
      nextPlacements.push({
        placementId: `placement-${roomId}-${x}-${y}-${Date.now().toString(36)}`,
        roomTemplateId: roomId,
        x,
        y,
        rotation: 0,
        locked: false,
        warpOverrides: [],
      })
      commitProject({
        ...get().project,
        placements: nextPlacements,
      })
    },

    selectPlacement(placementId) {
      set({ selectedPlacementId: placementId })
    },

    updatePlacement(placementId, patch) {
      commitProject({
        ...get().project,
        placements: get().project.placements.map((placement) =>
          placement.placementId === placementId ? { ...placement, ...patch } : placement,
        ),
      })
    },

    removePlacement(placementId) {
      commitProject({
        ...get().project,
        placements: get().project.placements.filter((placement) => placement.placementId !== placementId),
      })
      if (get().selectedPlacementId === placementId) {
        set({ selectedPlacementId: undefined })
      }
    },

    addWarpOverride(placementId, direction) {
      commitProject({
        ...get().project,
        placements: get().project.placements.map((placement) =>
          placement.placementId === placementId
            ? {
                ...placement,
                warpOverrides: [...placement.warpOverrides, createWarp(direction)],
              }
            : placement,
        ),
      })
    },

    updateWarpOverride(placementId, warpId, patch) {
      commitProject({
        ...get().project,
        placements: get().project.placements.map((placement) =>
          placement.placementId === placementId
            ? {
                ...placement,
                warpOverrides: placement.warpOverrides.map((warp) =>
                  warp.id === warpId ? { ...warp, ...patch } : warp,
                ),
              }
            : placement,
        ),
      })
    },

    removeWarpOverride(placementId, warpId) {
      commitProject({
        ...get().project,
        placements: get().project.placements.map((placement) =>
          placement.placementId === placementId
            ? {
                ...placement,
                warpOverrides: placement.warpOverrides.filter((warp) => warp.id !== warpId),
              }
            : placement,
        ),
      })
    },

    updateGeneratorRules(patch) {
      commitProject({
        ...get().project,
        generatorRules: {
          ...get().project.generatorRules,
          ...patch,
          roomCount: {
            ...get().project.generatorRules.roomCount,
            ...(patch.roomCount ?? {}),
          },
          sizeTarget: {
            ...get().project.generatorRules.sizeTarget,
            ...(patch.sizeTarget ?? {}),
          },
          connectorRules: {
            ...get().project.generatorRules.connectorRules,
            ...(patch.connectorRules ?? {}),
          },
        },
      })
    },

    generateCandidates() {
      const generatorCandidates = generateLayoutCandidates(get().project)
      set({
        generatorCandidates,
        activeCandidateIndex: 0,
      })
    },

    applyCandidate(index) {
      const candidate = get().generatorCandidates[index]
      if (!candidate) {
        return
      }
      commitProject({
        ...get().project,
        placements: candidate.placements,
      })
      set({ activeCandidateIndex: index })
    },

    runValidation() {
      commitProject({ ...get().project })
    },

    buildExport() {
      const exportBundle = buildExportBundle(get().project, get().sourceBundle)
      set({ exportBundle })
      void persist(get().project, get().sourceBundle)
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

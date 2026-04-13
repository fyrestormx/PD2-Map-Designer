export type ConnectorSide = 'north' | 'east' | 'south' | 'west'
export type IssueSeverity = 'error' | 'warning' | 'info'
export type ImportOrigin = 'folder' | 'zip' | 'demo'
export type RoomSource = 'imported' | 'generated' | 'demo'

export type TableRow = Record<string, string>

export interface SourceTable {
  name: string
  path: string
  headers: string[]
  rows: TableRow[]
  text: string
}

export interface LoadedImportFile {
  path: string
  name: string
  extension: string
  size: number
  lastModified: number
  kind: 'text' | 'binary'
  text?: string
}

export interface SourceFileManifest {
  path: string
  kind: 'text' | 'binary'
  size: number
}

export interface Ds1FileRecord {
  path: string
  name: string
  size: number
  linkedPresetIds: string[]
}

export interface ValidationIssue {
  id: string
  severity: IssueSeverity
  code: string
  message: string
  details?: string
  path?: string
}

export interface WarpDefinition {
  id: string
  label: string
  direction: ConnectorSide
  targetLevelId?: string
  uniqueId?: string
}

export interface RoomTemplate {
  id: string
  name: string
  ds1Path: string
  linkedPresetId?: string
  levelTypeId?: string
  size: {
    x: number
    y: number
  }
  connectorSides: ConnectorSide[]
  tags: string[]
  warpDefs: WarpDefinition[]
  spawnHints: string[]
  notes: string
  source: RoomSource
}

export interface MapProjectMeta {
  name: string
  description: string
  areaLevelId: string
  levelTypeId: string
  theme: string
  author: string
  version: string
  exportName: string
}

export interface GeneratorRuleSet {
  seed: string
  themeFilters: string[]
  roomCount: {
    min: number
    max: number
  }
  sizeTarget: {
    width: number
    height: number
  }
  connectorRules: {
    requireLoop: boolean
    allowDeadEnds: boolean
  }
  requiredRoomIds: string[]
  branchLimit: number
  exportName: string
}

export interface PlacedRoom {
  placementId: string
  roomTemplateId: string
  x: number
  y: number
  rotation: 0 | 90 | 180 | 270
  locked: boolean
  warpOverrides: WarpDefinition[]
}

export interface GeneratedLayoutCandidate {
  id: string
  seed: string
  score: number
  placements: PlacedRoom[]
  summary: string[]
}

export interface ExportTextFile {
  name: string
  content: string
}

export interface ExportBundle {
  files: ExportTextFile[]
  report: string
  projectJson: string
}

export interface SourceBundle {
  origin: ImportOrigin
  importedAt: string
  tables: Record<string, SourceTable>
  ds1Files: Ds1FileRecord[]
  rawFiles: SourceFileManifest[]
  issues: ValidationIssue[]
}

export interface MapProject {
  meta: MapProjectMeta
  roomTemplates: RoomTemplate[]
  placements: PlacedRoom[]
  generatorRules: GeneratorRuleSet
  validation: ValidationIssue[]
  lastEditedAt: string
}

export interface PersistedWorkspace {
  id: string
  sourceBundle?: SourceBundle
  project: MapProject
  updatedAt: string
}

export interface PlacementConnectorState {
  placementId: string
  side: ConnectorSide
  state: 'open' | 'matched' | 'conflict'
}

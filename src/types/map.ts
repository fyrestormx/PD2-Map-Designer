export type ConnectorSide = 'north' | 'east' | 'south' | 'west'
export type IssueSeverity = 'error' | 'warning' | 'info'
export type ImportOrigin = 'folder' | 'zip' | 'demo'
export type RoomSource = 'imported' | 'generated' | 'demo'
export type Rotation = 0 | 90 | 180 | 270
export type MapPieceKind =
  | 'room'
  | 'corridor-straight'
  | 'corridor-corner'
  | 'junction-t'
  | 'junction-cross'
  | 'entrance'
  | 'exit'
  | 'boss-room'

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

export interface ThemePreset {
  id: string
  name: string
  description: string
  mood: string
  preview: string
  palette: {
    panel: string
    ink: string
    accent: string
    grid: string
  }
  keywords: string[]
  levelTypeKeywords: string[]
}

export interface MapPieceTemplate {
  id: string
  kind: MapPieceKind
  name: string
  description: string
  baseConnectors: ConnectorSide[]
  source: 'starter' | 'imported'
  importedRoomId?: string
  accent: string
}

export interface DraftPiece {
  id: string
  templateId: string
  kind: MapPieceKind
  name: string
  x: number
  y: number
  rotation: Rotation
  notes: string
  label: string
  source: 'starter' | 'imported'
  importedRoomId?: string
}

export interface MapDraft {
  mode: 'quick-start' | 'advanced-import'
  selectedThemeId?: string
  selectedPieceTemplateId?: string
  selectedPieceId?: string
  pieces: DraftPiece[]
  notes: string
}

export interface BindingState {
  hasImportedData: boolean
  themeBound: boolean
  levelTypeId?: string
  levelTypeName?: string
  blockers: string[]
  warnings: string[]
  openConnectorCount: number
  importedPieceCount: number
  starterPieceCount: number
  canExportToPd2: boolean
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
  rotation: Rotation
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
  draft: MapDraft
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

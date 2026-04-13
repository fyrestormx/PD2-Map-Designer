import { CONNECTOR_SIDES } from './constants'
import type {
  ConnectorSide,
  DraftPiece,
  MapDraft,
  MapPieceKind,
  MapPieceTemplate,
  Rotation,
  RoomTemplate,
  ThemePreset,
} from '../types/map'

export const THEME_PRESETS: ThemePreset[] = [
  {
    id: 'hell-wastes',
    name: 'Hell Wastes',
    description: 'Burned ground, infernal stone, and open combat space.',
    mood: 'Aggressive outdoor map with red-hot contrast.',
    preview: 'Ash dunes, scorched pillars, ember-lit paths',
    palette: {
      panel: '#3c1e17',
      ink: '#ffe6d3',
      accent: '#ff7c43',
      grid: '#7a3724',
    },
    keywords: ['hell', 'wastes', 'ember', 'ash', 'infernal'],
    levelTypeKeywords: ['hell', 'waste', 'lava', 'fire'],
  },
  {
    id: 'crypt-depths',
    name: 'Crypt Depths',
    description: 'Claustrophobic rooms, hard corners, and heavy undead vibes.',
    mood: 'Dark indoor map with tight routes.',
    preview: 'Cold stone, tomb walls, narrow turns',
    palette: {
      panel: '#1e222a',
      ink: '#e6edf8',
      accent: '#8eb0ff',
      grid: '#44506b',
    },
    keywords: ['crypt', 'catacomb', 'tomb', 'grave', 'undead'],
    levelTypeKeywords: ['crypt', 'catacomb', 'tomb'],
  },
  {
    id: 'jungle-overgrowth',
    name: 'Jungle Overgrowth',
    description: 'Broken ruins mixed with thick jungle lanes.',
    mood: 'Outdoor map with winding paths and side pockets.',
    preview: 'Dense green cover, stone ruins, humid paths',
    palette: {
      panel: '#1f3424',
      ink: '#eff9e8',
      accent: '#82d46f',
      grid: '#406c47',
    },
    keywords: ['jungle', 'overgrowth', 'ruin', 'vine', 'swamp'],
    levelTypeKeywords: ['jungle', 'marsh', 'swamp', 'ruin'],
  },
  {
    id: 'desert-ruins',
    name: 'Desert Ruins',
    description: 'Wide sightlines with ancient stone anchors.',
    mood: 'Sun-bleached outdoor map with structured routes.',
    preview: 'Sandstone, open plazas, collapsed arches',
    palette: {
      panel: '#5a4022',
      ink: '#fff3dc',
      accent: '#ffbe63',
      grid: '#93652d',
    },
    keywords: ['desert', 'sand', 'ruins', 'sun', 'dune'],
    levelTypeKeywords: ['desert', 'sand', 'tomb'],
  },
  {
    id: 'ice-cavern',
    name: 'Ice Cavern',
    description: 'Frozen halls, slick branches, and high contrast blue light.',
    mood: 'Cold map with layered loops and choke points.',
    preview: 'Blue crystal, snow drift, frozen stone',
    palette: {
      panel: '#163147',
      ink: '#ebf8ff',
      accent: '#77d4ff',
      grid: '#2c678c',
    },
    keywords: ['ice', 'frozen', 'snow', 'cavern', 'glacier'],
    levelTypeKeywords: ['ice', 'snow', 'glacier', 'cave'],
  },
]

export const STARTER_PIECE_TEMPLATES: MapPieceTemplate[] = [
  {
    id: 'starter-room',
    kind: 'room',
    name: 'Room',
    description: 'Basic combat room with four-way routing.',
    baseConnectors: ['north', 'east', 'south', 'west'],
    source: 'starter',
    accent: '#ff9b47',
  },
  {
    id: 'starter-corridor-straight',
    kind: 'corridor-straight',
    name: 'Straight Corridor',
    description: 'Simple path segment between two points.',
    baseConnectors: ['east', 'west'],
    source: 'starter',
    accent: '#ffc857',
  },
  {
    id: 'starter-corridor-corner',
    kind: 'corridor-corner',
    name: 'Corner Corridor',
    description: 'Turn a path around a corner.',
    baseConnectors: ['north', 'east'],
    source: 'starter',
    accent: '#f29e4c',
  },
  {
    id: 'starter-junction-t',
    kind: 'junction-t',
    name: 'T Junction',
    description: 'Split one path into two branches.',
    baseConnectors: ['north', 'east', 'west'],
    source: 'starter',
    accent: '#f4a261',
  },
  {
    id: 'starter-junction-cross',
    kind: 'junction-cross',
    name: 'Cross Junction',
    description: 'Four-way branch hub.',
    baseConnectors: ['north', 'east', 'south', 'west'],
    source: 'starter',
    accent: '#f6bd60',
  },
  {
    id: 'starter-entrance',
    kind: 'entrance',
    name: 'Entrance',
    description: 'Where the player enters the map.',
    baseConnectors: ['south'],
    source: 'starter',
    accent: '#71d287',
  },
  {
    id: 'starter-exit',
    kind: 'exit',
    name: 'Exit',
    description: 'Goal room or portal out.',
    baseConnectors: ['north'],
    source: 'starter',
    accent: '#6ec5ff',
  },
  {
    id: 'starter-boss-room',
    kind: 'boss-room',
    name: 'Boss Room',
    description: 'Large encounter room for final pressure.',
    baseConnectors: ['south'],
    source: 'starter',
    accent: '#ff6b6b',
  },
]

export function slugify(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'pd2-map'
}

export function rotateSide(side: ConnectorSide, rotation: Rotation): ConnectorSide {
  const order: ConnectorSide[] = ['north', 'east', 'south', 'west']
  const offset = rotation / 90
  const index = order.indexOf(side)
  return order[(index + offset) % order.length]
}

export function rotateConnectors(connectors: ConnectorSide[], rotation: Rotation): ConnectorSide[] {
  return connectors.map((side) => rotateSide(side, rotation))
}

export function getThemePreset(themeId?: string): ThemePreset | undefined {
  return themeId ? THEME_PRESETS.find((theme) => theme.id === themeId) : undefined
}

export function suggestThemePresetId(name: string): string | undefined {
  const haystack = name.toLowerCase()
  const match = THEME_PRESETS
    .map((theme) => ({
      themeId: theme.id,
      score: theme.keywords.filter((keyword) => haystack.includes(keyword)).length,
    }))
    .sort((left, right) => right.score - left.score)[0]

  return match && match.score > 0 ? match.themeId : undefined
}

export function getImportedPieceTemplates(roomTemplates: RoomTemplate[]): MapPieceTemplate[] {
  return roomTemplates.map((room) => ({
    id: `imported-${room.id}`,
    kind: 'room',
    name: room.name,
    description: room.notes || `Imported DS1 room from ${room.ds1Path}`,
    baseConnectors: room.connectorSides,
    source: 'imported',
    importedRoomId: room.id,
    accent: room.tags.includes('boss') ? '#ff7b6e' : room.tags.includes('outdoor') ? '#82d46f' : '#7fb0ff',
  }))
}

export function getAvailablePieceTemplates(roomTemplates: RoomTemplate[]): MapPieceTemplate[] {
  return [...STARTER_PIECE_TEMPLATES, ...getImportedPieceTemplates(roomTemplates)]
}

export function findPieceTemplate(templates: MapPieceTemplate[], templateId?: string): MapPieceTemplate | undefined {
  return templateId ? templates.find((template) => template.id === templateId) : undefined
}

function createPieceId(template: MapPieceTemplate, x: number, y: number): string {
  return `piece-${template.kind}-${x}-${y}-${Date.now().toString(36)}`
}

export function createDraftPiece(
  template: MapPieceTemplate,
  x: number,
  y: number,
  rotation: Rotation,
): DraftPiece {
  return {
    id: createPieceId(template, x, y),
    templateId: template.id,
    kind: template.kind,
    name: template.name,
    x,
    y,
    rotation,
    notes: '',
    label: '',
    source: template.source,
    importedRoomId: template.importedRoomId,
  }
}

export function getPieceConnectors(piece: DraftPiece, templates: MapPieceTemplate[]): ConnectorSide[] {
  const template = findPieceTemplate(templates, piece.templateId)
  return template ? rotateConnectors(template.baseConnectors, piece.rotation) : []
}

export function findPieceAt(pieces: DraftPiece[], x: number, y: number): DraftPiece | undefined {
  return pieces.find((piece) => piece.x === x && piece.y === y)
}

function neighborCoordinate(x: number, y: number, side: ConnectorSide): { x: number; y: number } {
  switch (side) {
    case 'north':
      return { x, y: y - 1 }
    case 'east':
      return { x: x + 1, y }
    case 'south':
      return { x, y: y + 1 }
    case 'west':
      return { x: x - 1, y }
  }
}

function oppositeSide(side: ConnectorSide): ConnectorSide {
  const opposites: Record<ConnectorSide, ConnectorSide> = {
    north: 'south',
    east: 'west',
    south: 'north',
    west: 'east',
  }
  return opposites[side]
}

export function findBestRotationForPlacement(
  template: MapPieceTemplate,
  x: number,
  y: number,
  pieces: DraftPiece[],
  templates: MapPieceTemplate[],
): Rotation {
  const rotations: Rotation[] = [0, 90, 180, 270]
  const ranked = rotations.map((rotation) => {
    const connectors = rotateConnectors(template.baseConnectors, rotation)
    let matches = 0

    connectors.forEach((side) => {
      const neighborPos = neighborCoordinate(x, y, side)
      const neighbor = findPieceAt(pieces, neighborPos.x, neighborPos.y)
      if (!neighbor) {
        return
      }

      const neighborConnectors = getPieceConnectors(neighbor, templates)
      if (neighborConnectors.includes(oppositeSide(side))) {
        matches += 1
      }
    })

    return { rotation, matches }
  })

  return ranked.sort((left, right) => right.matches - left.matches)[0]?.rotation ?? 0
}

export interface PieceConnectorState {
  pieceId: string
  side: ConnectorSide
  state: 'open' | 'matched' | 'conflict'
}

export function getDraftConnectorStates(
  draft: MapDraft,
  templates: MapPieceTemplate[],
): PieceConnectorState[] {
  const states: PieceConnectorState[] = []

  draft.pieces.forEach((piece) => {
    const connectors = getPieceConnectors(piece, templates)
    connectors.forEach((side) => {
      const neighborPos = neighborCoordinate(piece.x, piece.y, side)
      const neighbor = findPieceAt(draft.pieces, neighborPos.x, neighborPos.y)
      if (!neighbor) {
        states.push({ pieceId: piece.id, side, state: 'open' })
        return
      }

      const neighborConnectors = getPieceConnectors(neighbor, templates)
      states.push({
        pieceId: piece.id,
        side,
        state: neighborConnectors.includes(oppositeSide(side)) ? 'matched' : 'conflict',
      })
    })
  })

  return states
}

export function countDraftKinds(pieces: DraftPiece[]): Record<MapPieceKind, number> {
  return pieces.reduce(
    (counts, piece) => {
      counts[piece.kind] += 1
      return counts
    },
    {
      room: 0,
      'corridor-straight': 0,
      'corridor-corner': 0,
      'junction-t': 0,
      'junction-cross': 0,
      entrance: 0,
      exit: 0,
      'boss-room': 0,
    } as Record<MapPieceKind, number>,
  )
}

export function getGridBounds(pieces: DraftPiece[]): { width: number; height: number } {
  if (pieces.length === 0) {
    return { width: 0, height: 0 }
  }

  const minX = Math.min(...pieces.map((piece) => piece.x))
  const maxX = Math.max(...pieces.map((piece) => piece.x))
  const minY = Math.min(...pieces.map((piece) => piece.y))
  const maxY = Math.max(...pieces.map((piece) => piece.y))
  return {
    width: maxX - minX + 1,
    height: maxY - minY + 1,
  }
}

export function nextConnectorLabel(side: ConnectorSide): string {
  return side.charAt(0).toUpperCase() + side.slice(1)
}

export const GRID_DIRECTIONS = CONNECTOR_SIDES

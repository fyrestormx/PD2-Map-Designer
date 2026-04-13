import type { ConnectorSide } from '../types/map'

export const REQUIRED_TABLES = [
  'Levels.txt',
  'LvlMaze.txt',
  'LvlPrest.txt',
  'LvlTypes.txt',
] as const

export const CONNECTOR_SIDES: ConnectorSide[] = [
  'north',
  'east',
  'south',
  'west',
]

export const ROOM_TAG_OPTIONS = [
  'entry',
  'exit',
  'hub',
  'boss',
  'event',
  'dead-end',
  'corridor',
  'treasure',
  'outdoor',
  'indoor',
  'dense',
  'safe-start',
] as const

export const ROOM_HINT_OPTIONS = [
  'dense monsters',
  'ranged pressure',
  'melee lane',
  'boss arena',
  'event trigger',
  'open sightline',
  'tight choke',
] as const

export const DEFAULT_CANVAS_SIZE = 12

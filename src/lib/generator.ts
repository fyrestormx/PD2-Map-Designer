import seedrandom from 'seedrandom'
import { getOppositeSide, getRoomById } from './project'
import type {
  ConnectorSide,
  GeneratedLayoutCandidate,
  MapProject,
  PlacedRoom,
  RoomTemplate,
} from '../types/map'

interface Frontier {
  sourcePlacementId: string
  sourceRoomId: string
  side: ConnectorSide
  x: number
  y: number
}

function nextCoordinate(x: number, y: number, side: ConnectorSide): { x: number; y: number } {
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

function makePlacement(roomId: string, x: number, y: number, locked = false): PlacedRoom {
  return {
    placementId: `placement-${roomId}-${x}-${y}-${Math.random().toString(36).slice(2, 8)}`,
    roomTemplateId: roomId,
    x,
    y,
    rotation: 0,
    locked,
    warpOverrides: [],
  }
}

function selectRoomsForGeneration(project: MapProject): RoomTemplate[] {
  const { roomTemplates, generatorRules } = project
  if (generatorRules.themeFilters.length === 0) {
    return roomTemplates
  }

  return roomTemplates.filter((room) => {
    const haystack = `${room.name} ${room.tags.join(' ')} ${room.levelTypeId ?? ''}`.toLowerCase()
    return generatorRules.themeFilters.some((filter) => haystack.includes(filter.toLowerCase()))
  })
}

function scoreCandidate(placements: PlacedRoom[], requiredRoomIds: string[], usedDeadEnds: number): number {
  const uniqueRooms = new Set(placements.map((placement) => placement.roomTemplateId))
  const requiredHits = requiredRoomIds.filter((id) => uniqueRooms.has(id)).length
  return placements.length * 12 + requiredHits * 8 - usedDeadEnds * 3
}

function buildSummary(placements: PlacedRoom[], score: number, deadEnds: number, seed: string): string[] {
  return [
    `Seed ${seed}`,
    `${placements.length} room placements`,
    deadEnds === 0 ? 'All generated exits were matched.' : `${deadEnds} open connectors left for manual cleanup.`,
    `Score ${score}`,
  ]
}

function buildFrontier(room: RoomTemplate, placement: PlacedRoom): Frontier[] {
  return room.connectorSides.map((side) => ({
    sourcePlacementId: placement.placementId,
    sourceRoomId: room.id,
    side,
    ...nextCoordinate(placement.x, placement.y, side),
  }))
}

function withinBounds(x: number, y: number, width: number, height: number): boolean {
  return x >= 0 && y >= 0 && x < width && y < height
}

export function generateLayoutCandidates(project: MapProject, count = 4): GeneratedLayoutCandidate[] {
  const pool = selectRoomsForGeneration(project)
  const candidates: GeneratedLayoutCandidate[] = []
  if (pool.length === 0) {
    return candidates
  }

  for (let candidateIndex = 0; candidateIndex < count; candidateIndex += 1) {
    const rng = seedrandom(`${project.generatorRules.seed}:${candidateIndex}`)
    const targetCount =
      project.generatorRules.roomCount.min +
      Math.floor(rng() * Math.max(1, project.generatorRules.roomCount.max - project.generatorRules.roomCount.min + 1))
    const placements = project.placements.filter((placement) => placement.locked).map((placement) => ({ ...placement }))
    const occupied = new Set(placements.map((placement) => `${placement.x},${placement.y}`))
    const frontier: Frontier[] = []
    let deadEnds = 0

    if (placements.length === 0) {
      const firstRoom =
        pool.find((room) => project.generatorRules.requiredRoomIds.includes(room.id)) ??
        pool[Math.floor(rng() * pool.length)]

      if (!firstRoom) {
        continue
      }

      const startPlacement = makePlacement(firstRoom.id, 1, 1, false)
      placements.push(startPlacement)
      occupied.add('1,1')
      frontier.push(...buildFrontier(firstRoom, startPlacement))
    } else {
      for (const placement of placements) {
        const room = getRoomById(project, placement.roomTemplateId)
        if (room) {
          frontier.push(...buildFrontier(room, placement))
        }
      }
    }

    while (placements.length < targetCount && frontier.length > 0) {
      const frontierIndex = Math.floor(rng() * frontier.length)
      const connection = frontier.splice(frontierIndex, 1)[0]
      const neededSide = getOppositeSide(connection.side)
      const candidatesForCell = pool.filter((room) => room.connectorSides.includes(neededSide))
      const choicePool = candidatesForCell.length > 0 ? candidatesForCell : pool
      const nextRoom = choicePool[Math.floor(rng() * choicePool.length)]
      const key = `${connection.x},${connection.y}`

      if (!nextRoom || occupied.has(key)) {
        deadEnds += 1
        continue
      }

      if (!withinBounds(connection.x, connection.y, project.generatorRules.sizeTarget.width, project.generatorRules.sizeTarget.height)) {
        deadEnds += 1
        continue
      }

      const nextPlacement = makePlacement(nextRoom.id, connection.x, connection.y, false)
      placements.push(nextPlacement)
      occupied.add(key)

      for (const nextFrontier of buildFrontier(nextRoom, nextPlacement)) {
        if (
          nextFrontier.x === connection.x &&
          nextFrontier.y === connection.y &&
          nextFrontier.side === neededSide
        ) {
          continue
        }

        frontier.push(nextFrontier)
      }
    }

    if (!project.generatorRules.connectorRules.allowDeadEnds && frontier.length > 0) {
      deadEnds += frontier.length
    }

    const score = scoreCandidate(placements, project.generatorRules.requiredRoomIds, deadEnds)
    candidates.push({
      id: `candidate-${candidateIndex}`,
      seed: `${project.generatorRules.seed}:${candidateIndex}`,
      score,
      placements,
      summary: buildSummary(placements, score, deadEnds, `${project.generatorRules.seed}:${candidateIndex}`),
    })
  }

  return candidates.sort((left, right) => right.score - left.score)
}

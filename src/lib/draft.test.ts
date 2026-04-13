import { describe, expect, it } from 'vitest'
import { createDraftPiece, findBestRotationForPlacement, getDraftConnectorStates, STARTER_PIECE_TEMPLATES } from './draft'

describe('draft helpers', () => {
  it('rotates a straight corridor to match a neighboring room', () => {
    const roomTemplate = STARTER_PIECE_TEMPLATES.find((template) => template.id === 'starter-room')!
    const corridorTemplate = STARTER_PIECE_TEMPLATES.find((template) => template.id === 'starter-corridor-straight')!
    const templates = STARTER_PIECE_TEMPLATES
    const room = createDraftPiece(roomTemplate, 1, 1, 0)
    const rotation = findBestRotationForPlacement(corridorTemplate, 1, 0, [room], templates)

    expect(rotation).toBe(90)
  })

  it('reports open connector warnings for unmatched pieces', () => {
    const roomTemplate = STARTER_PIECE_TEMPLATES.find((template) => template.id === 'starter-room')!
    const draft = {
      mode: 'quick-start' as const,
      selectedThemeId: undefined,
      selectedPieceTemplateId: undefined,
      selectedPieceId: undefined,
      pieces: [createDraftPiece(roomTemplate, 0, 0, 0)],
      notes: '',
    }

    const states = getDraftConnectorStates(draft, STARTER_PIECE_TEMPLATES)
    expect(states.filter((state) => state.state === 'open')).toHaveLength(4)
  })
})

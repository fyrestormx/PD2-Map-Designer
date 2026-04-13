import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'
import { createEmptyProject } from '../lib/project'
import { BuildPage } from './BuildPage'
import { useAppStore } from '../store/useAppStore'

function resetStore() {
  useAppStore.setState({
    sourceBundle: undefined,
    project: createEmptyProject(),
    preferences: {
      guidedMode: true,
      setupComplete: false,
    },
    exportBundle: undefined,
    importStatus: 'idle',
    importError: undefined,
    hydrated: true,
    lastSavedAt: undefined,
    zoom: 1,
    pan: { x: 0, y: 0 },
    selectedAdvancedRoomTemplateId: undefined,
  })
  useAppStore.getState().startQuickStart()
  useAppStore.getState().selectTheme('hell-wastes')
}

describe('BuildPage', () => {
  beforeEach(() => {
    resetStore()
  })

  it('places a starter room on the canvas', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter>
        <BuildPage />
      </MemoryRouter>,
    )

    await user.click(screen.getByRole('button', { name: 'Place Room at 0,0' }))

    expect(screen.getByText('Selected item')).toBeInTheDocument()
    expect(useAppStore.getState().project.draft.pieces).toHaveLength(1)
  })
})

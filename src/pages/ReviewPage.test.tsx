import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'
import { createEmptyProject } from '../lib/project'
import { ReviewPage } from './ReviewPage'
import { useAppStore } from '../store/useAppStore'

function resetStore() {
  useAppStore.setState({
    sourceBundle: undefined,
    project: createEmptyProject(),
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
}

describe('ReviewPage', () => {
  beforeEach(() => {
    resetStore()
  })

  it('shows plain-English blockers when export is not ready', () => {
    render(
      <MemoryRouter>
        <ReviewPage />
      </MemoryRouter>,
    )

    expect(screen.getByText(/not ready for PD2 export yet/i)).toBeInTheDocument()
    expect(screen.getByText(/import extracted PD2 files/i)).toBeInTheDocument()
  })
})

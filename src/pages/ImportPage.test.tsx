import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { createEmptyProject } from '../lib/project'
import { ImportPage } from './ImportPage'
import { useAppStore } from '../store/useAppStore'

function resetStore() {
  useAppStore.setState({
    sourceBundle: undefined,
    project: createEmptyProject(),
    generatorCandidates: [],
    activeCandidateIndex: 0,
    selectedRoomTemplateId: undefined,
    selectedPlacementId: undefined,
    exportBundle: undefined,
    importStatus: 'idle',
    importError: undefined,
    hydrated: true,
    lastSavedAt: undefined,
    zoom: 1,
    pan: { x: 0, y: 0 },
  })
}

describe('ImportPage', () => {
  beforeEach(() => {
    resetStore()
  })

  it('loads the demo workspace from the page action', async () => {
    const user = userEvent.setup()
    render(<ImportPage />)

    await user.click(screen.getByRole('button', { name: /load demo workspace/i }))

    await waitFor(() => {
      expect(screen.getByText('Ember March')).toBeInTheDocument()
    })
    expect(screen.getByText('global/excel/Levels.txt')).toBeInTheDocument()
  })
})

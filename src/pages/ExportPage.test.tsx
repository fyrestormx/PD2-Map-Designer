import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { createEmptyProject } from '../lib/project'
import { ExportPage } from './ExportPage'
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

describe('ExportPage', () => {
  beforeEach(() => {
    resetStore()
    useAppStore.getState().loadDemoProject()
  })

  it('builds an export bundle from the page action', async () => {
    const user = userEvent.setup()
    render(<ExportPage />)

    await user.click(screen.getByRole('button', { name: /build export bundle/i }))

    await waitFor(() => {
      expect(screen.getByText('Levels.txt')).toBeInTheDocument()
    })
    expect(screen.getByText('EXPORT_REPORT.md')).toBeInTheDocument()
  })
})

import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'
import { createEmptyProject } from '../lib/project'
import { HomePage } from './HomePage'
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
}

describe('HomePage', () => {
  beforeEach(() => {
    resetStore()
  })

  it('asks for local files first', () => {
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>,
    )

    expect(screen.getByRole('heading', { name: /start here/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /where are your files/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /choose folder/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /i only want to sketch a map/i })).toBeInTheDocument()
  })
})

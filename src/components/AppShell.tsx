import { useEffect, type PropsWithChildren } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { useShallow } from 'zustand/react/shallow'
import { getBindingState } from '../lib/bindings'
import { getThemePreset } from '../lib/draft'
import { useAppStore } from '../store/useAppStore'

const routes = [
  { to: '/', label: 'Start', hint: 'Local files or blank sketch' },
  { to: '/theme', label: 'Theme', hint: 'Choose map visuals' },
  { to: '/build', label: 'Build', hint: 'Place rooms and corridors' },
  { to: '/review', label: 'Review', hint: 'Check route and blockers' },
  { to: '/export', label: 'Export', hint: 'Save planner or PD2 files' },
  { to: '/advanced', label: 'Advanced', hint: 'Imports and raw bindings' },
]

export function AppShell({ children }: PropsWithChildren) {
  const location = useLocation()
  const {
    hydrateFromIndexedDb,
    hydrated,
    project,
    preferences,
    sourceBundle,
    lastSavedAt,
    setGuidedMode,
  } = useAppStore(
    useShallow((state) => ({
      hydrateFromIndexedDb: state.hydrateFromIndexedDb,
      hydrated: state.hydrated,
      project: state.project,
      preferences: state.preferences,
      sourceBundle: state.sourceBundle,
      lastSavedAt: state.lastSavedAt,
      setGuidedMode: state.setGuidedMode,
    })),
  )

  useEffect(() => {
    void hydrateFromIndexedDb()
  }, [hydrateFromIndexedDb])

  const bindingState = getBindingState(project, sourceBundle)
  const selectedTheme = getThemePreset(project.draft.selectedThemeId)

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">PD2 Mapper</div>
          <h1>Map Designer</h1>
          <p>Guided local map planning first. Real PD2 files and export stay available when you need them.</p>
          <div className="button-row">
            <button
              type="button"
              className="btn-ghost"
              onClick={() => setGuidedMode(!preferences.guidedMode)}
            >
              {preferences.guidedMode ? 'Hide guide' : 'Show guide'}
            </button>
          </div>
        </div>

        <nav className="nav-list" aria-label="Primary">
          {routes.map((route, index) => (
            <NavLink
              key={route.to}
              to={route.to}
              className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
            >
              <strong>
                <span className="step-chip">{index + 1}</span>
                {route.label}
              </strong>
              <span>{route.hint}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-summary">
          <section className="summary-card">
            <h2>Draft</h2>
            <p className="muted">
              {hydrated ? project.meta.name : 'Loading your saved workspace...'}
            </p>
            <div className="summary-grid">
              <div className="summary-stat">
                <span>Theme</span>
                <strong>{selectedTheme?.name ?? 'None'}</strong>
              </div>
              <div className="summary-stat">
                <span>Pieces</span>
                <strong>{project.draft.pieces.length}</strong>
              </div>
              <div className="summary-stat">
                <span>Imports</span>
                <strong>{sourceBundle ? sourceBundle.ds1Files.length : 0}</strong>
              </div>
              <div className="summary-stat">
                <span>Ready</span>
                <strong>{bindingState.canExportToPd2 ? 'Yes' : 'No'}</strong>
              </div>
            </div>
          </section>

          <section className="summary-card">
            <h3>Status</h3>
            <div className="plain-list">
              <div>Page: {location.pathname === '/' ? 'start' : location.pathname.replace('/', '')}</div>
              <div>Open connectors: {bindingState.openConnectorCount}</div>
              <div>Import loaded: {sourceBundle ? 'yes' : 'no'}</div>
              <div>Guide: {preferences.guidedMode ? 'on' : 'off'}</div>
              <div>Saved: {lastSavedAt ? new Date(lastSavedAt).toLocaleTimeString() : 'Not yet'}</div>
            </div>
          </section>
        </div>
      </aside>

      <main className="main-panel">{children}</main>
    </div>
  )
}

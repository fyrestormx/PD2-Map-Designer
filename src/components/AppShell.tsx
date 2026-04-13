import { useEffect, type PropsWithChildren } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { useShallow } from 'zustand/react/shallow'
import { useAppStore } from '../store/useAppStore'

const routes = [
  { to: '/import', label: 'Import', hint: 'Bring in extracted files' },
  { to: '/library', label: 'Room Library', hint: 'Tag DS1 room templates' },
  { to: '/composer', label: 'Composer', hint: 'Lay out rooms on a grid' },
  { to: '/generator', label: 'Generator', hint: 'Roll seeded layouts' },
  { to: '/validation', label: 'Validation', hint: 'Catch broken links early' },
  { to: '/export', label: 'Export', hint: 'Build table files and report' },
]

export function AppShell({ children }: PropsWithChildren) {
  const location = useLocation()
  const {
    hydrateFromIndexedDb,
    hydrated,
    importStatus,
    project,
    sourceBundle,
    lastSavedAt,
  } = useAppStore(
    useShallow((state) => ({
      hydrateFromIndexedDb: state.hydrateFromIndexedDb,
      hydrated: state.hydrated,
      importStatus: state.importStatus,
      project: state.project,
      sourceBundle: state.sourceBundle,
      lastSavedAt: state.lastSavedAt,
    })),
  )

  useEffect(() => {
    void hydrateFromIndexedDb()
  }, [hydrateFromIndexedDb])

  const errorCount = project.validation.filter((issue) => issue.severity === 'error').length
  const warningCount = project.validation.filter((issue) => issue.severity === 'warning').length

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">PD2 Mapper</div>
          <h1>Map Designer</h1>
          <p>Guided room composition and table export for Project Diablo 2 maps.</p>
        </div>

        <nav className="nav-list" aria-label="Primary">
          {routes.map((route) => (
            <NavLink
              key={route.to}
              to={route.to}
              className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
            >
              <strong>{route.label}</strong>
              <span>{route.hint}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-summary">
          <section className="summary-card">
            <h2>Workspace</h2>
            <p className="muted">
              {sourceBundle
                ? `${sourceBundle.origin.toUpperCase()} bundle loaded`
                : hydrated
                  ? 'No source bundle loaded yet'
                  : 'Checking IndexedDB...'}
            </p>
            <div className="summary-grid">
              <div className="summary-stat">
                <span>Tables</span>
                <strong>{Object.keys(sourceBundle?.tables ?? {}).length}</strong>
              </div>
              <div className="summary-stat">
                <span>DS1 files</span>
                <strong>{sourceBundle?.ds1Files.length ?? 0}</strong>
              </div>
              <div className="summary-stat">
                <span>Rooms</span>
                <strong>{project.roomTemplates.length}</strong>
              </div>
              <div className="summary-stat">
                <span>Placed</span>
                <strong>{project.placements.length}</strong>
              </div>
            </div>
          </section>

          <section className="summary-card">
            <h3>Status</h3>
            <div className="plain-list">
              <div>Page: {location.pathname.replace('/', '') || 'import'}</div>
              <div>Import: {importStatus}</div>
              <div>Errors: {errorCount}</div>
              <div>Warnings: {warningCount}</div>
              <div>Saved: {lastSavedAt ? new Date(lastSavedAt).toLocaleTimeString() : 'Not yet'}</div>
            </div>
          </section>
        </div>
      </aside>

      <main className="main-panel">{children}</main>
    </div>
  )
}

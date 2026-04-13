import { useNavigate } from 'react-router-dom'
import { useShallow } from 'zustand/react/shallow'
import { useAppStore } from '../store/useAppStore'

export function HomePage() {
  const navigate = useNavigate()
  const { startQuickStart, loadDemoProject, sourceBundle, project } = useAppStore(
    useShallow((state) => ({
      startQuickStart: state.startQuickStart,
      loadDemoProject: state.loadDemoProject,
      sourceBundle: state.sourceBundle,
      project: state.project,
    })),
  )

  return (
    <div className="page">
      <section className="page-hero">
        <h1>Make a map without fighting the data files</h1>
        <p>
          Start with a simple visual blockout. Pick a theme, place rooms and corridors, review the route, then export
          when you are ready. Advanced imports stay available when you need real PD2 bindings.
        </p>
      </section>

      <div className="stats-row">
        <div className="stat-card">
          <span>Current draft</span>
          <strong>{project.meta.name}</strong>
        </div>
        <div className="stat-card">
          <span>Placed pieces</span>
          <strong>{project.draft.pieces.length}</strong>
        </div>
        <div className="stat-card">
          <span>Imported data</span>
          <strong>{sourceBundle ? 'Loaded' : 'Not loaded'}</strong>
        </div>
      </div>

      <div className="home-grid">
        <section className="path-card">
          <span className="path-step">1</span>
          <h2>Quick Start</h2>
          <p>Start with blank rooms and corridors right away. No extracted files needed yet.</p>
          <ul className="helper-list">
            <li>Best for planning layout fast.</li>
            <li>Choose a visual theme first.</li>
            <li>Import real files later when you want PD2 export.</li>
          </ul>
          <div className="button-row">
            <button
              type="button"
              className="btn"
              onClick={() => {
                startQuickStart()
                navigate('/theme')
              }}
            >
              Start blank map
            </button>
          </div>
        </section>

        <section className="path-card">
          <span className="path-step">2</span>
          <h2>Import Existing Data</h2>
          <p>Load extracted PD2 files, imported room templates, and advanced export bindings.</p>
          <ul className="helper-list">
            <li>Use this when you already have extracted tables and DS1 files.</li>
            <li>Imported rooms can appear in the visual builder as advanced pieces.</li>
            <li>Required for final PD2-ready table export.</li>
          </ul>
          <div className="button-row">
            <button type="button" className="btn-secondary" onClick={() => navigate('/advanced')}>
              Open advanced mode
            </button>
          </div>
        </section>
      </div>

      <section className="panel">
        <div className="status-banner">
          <div>
            <strong>Need a guided example?</strong>
            <p className="muted">Load the demo workspace, then step through Theme, Build, Review, and Export.</p>
          </div>
          <button
            type="button"
            className="btn-ghost"
            onClick={() => {
              loadDemoProject()
              navigate('/theme')
            }}
          >
            Load demo workspace
          </button>
        </div>
      </section>
    </div>
  )
}

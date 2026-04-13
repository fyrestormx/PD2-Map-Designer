import { useNavigate } from 'react-router-dom'
import { useShallow } from 'zustand/react/shallow'
import { FileDropZone } from '../components/FileDropZone'
import { REQUIRED_TABLES } from '../lib/constants'
import { useAppStore } from '../store/useAppStore'

export function HomePage() {
  const navigate = useNavigate()
  const {
    sourceBundle,
    project,
    preferences,
    importStatus,
    importError,
    importBrowserFiles,
    loadDemoProject,
    startQuickStart,
  } = useAppStore(
    useShallow((state) => ({
      sourceBundle: state.sourceBundle,
      project: state.project,
      preferences: state.preferences,
      importStatus: state.importStatus,
      importError: state.importError,
      importBrowserFiles: state.importBrowserFiles,
      loadDemoProject: state.loadDemoProject,
      startQuickStart: state.startQuickStart,
    })),
  )

  return (
    <div className="page">
      <section className="page-hero">
        <h1>Start here</h1>
        <p>
          First question: where are your Diablo II or PD2 extracted files? If you do not have them ready yet, you can
          still sketch a map right now and add local files later.
        </p>
      </section>

      <div className="setup-grid">
        <section className="panel">
          <h2>1. Where are your files?</h2>
          <p className="muted">
            Choose your extracted folder or a zip made from it. The app reads your local files in the browser and does
            not need a server.
          </p>

          <FileDropZone
            title="Choose extracted folder"
            description="Pick the folder that contains Levels.txt, LvlMaze.txt, LvlPrest.txt, LvlTypes.txt, and any DS1 files you want to use."
            directory
            disabled={importStatus === 'loading'}
            buttonLabel={importStatus === 'loading' ? 'Loading...' : 'Choose folder'}
            onFiles={(files) => void importBrowserFiles(files)}
          />

          <FileDropZone
            title="Use a zip instead"
            description="If your extracted files are zipped already, you can choose the zip file here."
            accept=".zip,application/zip"
            disabled={importStatus === 'loading'}
            buttonLabel="Choose zip"
            onFiles={(files) => void importBrowserFiles(files)}
          />

          <div className="piece-summary">
            {REQUIRED_TABLES.map((tableName) => (
              <span key={tableName} className={`tag${sourceBundle?.tables[tableName] ? ' success' : ''}`}>
                {tableName}
              </span>
            ))}
          </div>

          {sourceBundle ? (
            <div className="callout success">
              <strong>Your local files are loaded.</strong>
              <p>
                Found {Object.keys(sourceBundle.tables).length} tables and {sourceBundle.ds1Files.length} DS1 files.
                Next step: choose a theme and, if you want, a local tileset.
              </p>
            </div>
          ) : null}

          {importError ? (
            <div className="callout warning">
              <strong>Import error</strong>
              <p>{importError}</p>
            </div>
          ) : null}
        </section>

        <section className="panel">
          <h2>2. Choose the easy path</h2>
          <div className="guide-card-grid">
            <button
              type="button"
              className="path-card action-card"
              onClick={() => {
                startQuickStart()
                navigate('/theme')
              }}
            >
              <span className="path-step">A</span>
              <h3>I only want to sketch a map</h3>
              <p>Start blank. Pick a theme, place rooms and corridors, and learn the builder first.</p>
            </button>

            <button
              type="button"
              className="path-card action-card"
              disabled={!sourceBundle}
              onClick={() => navigate('/theme')}
            >
              <span className="path-step">B</span>
              <h3>My files are loaded</h3>
              <p>Use your own local data so you can pick a real tileset and work toward PD2 export.</p>
            </button>

            <button
              type="button"
              className="path-card action-card"
              onClick={() => {
                loadDemoProject()
                navigate('/theme')
              }}
            >
              <span className="path-step">C</span>
              <h3>Teach me with an example</h3>
              <p>Load a safe demo workspace and walk through the guided flow before touching your real files.</p>
            </button>
          </div>

          <div className="callout">
            <strong>{preferences.guidedMode ? 'Guide mode is on' : 'Guide mode is off'}</strong>
            <p>
              {preferences.guidedMode
                ? 'Each step will tell you exactly what to do next.'
                : 'Use the sidebar when you want to jump straight to a page.'}
            </p>
          </div>

          {preferences.setupComplete ? (
            <div className="status-banner">
              <div>
                <strong>Last draft</strong>
                <p className="muted">{project.meta.name}</p>
              </div>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => navigate(project.draft.selectedThemeId ? '/build' : '/theme')}
              >
                Open current map
              </button>
            </div>
          ) : null}
        </section>
      </div>

      <section className="panel">
        <h2>What happens next</h2>
        <div className="checklist">
          <div className="checklist-group">
            <h3>Theme</h3>
            <p className="muted">Pick a mood first. If your local files are loaded, choose the exact tileset there too.</p>
          </div>
          <div className="checklist-group">
            <h3>Build</h3>
            <p className="muted">Place rooms and corridors on the grid. Save variations before trying a new idea.</p>
          </div>
          <div className="checklist-group">
            <h3>Review and export</h3>
            <p className="muted">Fix warnings, then download a planner file, a review packet, or a PD2 export bundle.</p>
          </div>
        </div>
      </section>
    </div>
  )
}

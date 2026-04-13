import { FileDropZone } from '../components/FileDropZone'
import { REQUIRED_TABLES } from '../lib/constants'
import { useAppStore } from '../store/useAppStore'
import { useShallow } from 'zustand/react/shallow'

export function ImportPage() {
  const {
    importBrowserFiles,
    importStatus,
    importError,
    loadDemoProject,
    sourceBundle,
    project,
  } = useAppStore(
    useShallow((state) => ({
      importBrowserFiles: state.importBrowserFiles,
      importStatus: state.importStatus,
      importError: state.importError,
      loadDemoProject: state.loadDemoProject,
      sourceBundle: state.sourceBundle,
      project: state.project,
    })),
  )

  const isBusy = importStatus === 'loading'

  return (
    <div className="page">
      <section className="page-hero">
        <h1>Import extracted map data</h1>
        <p>
          Load your own extracted `Levels.txt`, `LvlMaze.txt`, `LvlPrest.txt`, `LvlTypes.txt`, and DS1 room files.
          The app keeps assets local in your browser and stores the workspace in IndexedDB.
        </p>
      </section>

      <section className="stats-row">
        <div className="stat-card">
          <span>Map name</span>
          <strong>{project.meta.name}</strong>
        </div>
        <div className="stat-card">
          <span>Imported files</span>
          <strong>{sourceBundle?.rawFiles.length ?? 0}</strong>
        </div>
        <div className="stat-card">
          <span>Room templates</span>
          <strong>{project.roomTemplates.length}</strong>
        </div>
        <div className="stat-card">
          <span>Status</span>
          <strong>{importStatus}</strong>
        </div>
      </section>

      <div className="two-column">
        <section className="panel">
          <h2>Bring in files</h2>
          <div className="page-grid">
            <FileDropZone
              title="Import a folder"
              description="Use this for extracted folders from your PD2 or Diablo II data workspace."
              directory
              disabled={isBusy}
              buttonLabel="Choose folder"
              onFiles={(files) => void importBrowserFiles(files)}
            />
            <FileDropZone
              title="Import a zip archive"
              description="Use this when your extracted files are packed into a single zip."
              accept=".zip"
              disabled={isBusy}
              buttonLabel="Choose zip"
              onFiles={(files) => void importBrowserFiles(files)}
            />
          </div>

          <div className="button-row">
            <button type="button" className="btn" onClick={loadDemoProject} disabled={isBusy}>
              Load demo workspace
            </button>
          </div>

          {importError ? (
            <div className="status-banner">
              <strong>Import failed</strong>
              <span className="muted">{importError}</span>
            </div>
          ) : null}
        </section>

        <section className="panel">
          <h2>Import checklist</h2>
          <ul className="helper-list">
            <li>Extract the mod data into plain files first. Do not point this app at MPQ archives.</li>
            <li>Include all four required tables so validation and export have the full engine context.</li>
            <li>Include DS1 files if you want room tagging, composition, or generator previews.</li>
            <li>Use the demo workspace if you want to inspect the full flow before loading real assets.</li>
          </ul>

          <div className="button-row">
            {REQUIRED_TABLES.map((tableName) => (
              <span
                key={tableName}
                className={`tag${sourceBundle?.tables[tableName] ? ' success' : ''}`}
              >
                {tableName}
              </span>
            ))}
          </div>
        </section>
      </div>

      <div className="two-column">
        <section className="panel">
          <h2>Detected files</h2>
          {sourceBundle?.rawFiles.length ? (
            <div className="file-list">
              {sourceBundle.rawFiles.map((file) => (
                <div key={file.path} className="mini-card">
                  <span>{file.kind}</span>
                  <strong>{file.path.split('/').pop()}</strong>
                  <span>{file.path}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">No imported files yet.</div>
          )}
        </section>

        <section className="panel">
          <h2>Import issues</h2>
          {project.validation.length ? (
            <div className="issue-list">
              {project.validation.map((validationIssue) => (
                <div key={validationIssue.id} className={`issue-card ${validationIssue.severity}`}>
                  <div className="room-title">
                    <strong>{validationIssue.code}</strong>
                    <span className={`tag ${validationIssue.severity === 'error' ? 'danger' : validationIssue.severity === 'warning' ? 'warning' : 'success'}`}>
                      {validationIssue.severity}
                    </span>
                  </div>
                  <p>{validationIssue.message}</p>
                  {validationIssue.details ? <p className="muted">{validationIssue.details}</p> : null}
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">No issues yet. Import a bundle or load the demo workspace.</div>
          )}
        </section>
      </div>
    </div>
  )
}

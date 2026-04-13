import { copyTextToClipboard, downloadExportBundle, downloadTextFile } from '../lib/download'
import { useAppStore } from '../store/useAppStore'
import { useShallow } from 'zustand/react/shallow'

export function ExportPage() {
  const { project, exportBundle, buildExport } = useAppStore(
    useShallow((state) => ({
      project: state.project,
      exportBundle: state.exportBundle,
      buildExport: state.buildExport,
    })),
  )

  return (
    <div className="page">
      <section className="page-hero">
        <h1>Export bundle</h1>
        <p>
          Build updated table files, a repo-safe project JSON, and a report that lists which DS1 files the map uses.
          This version does not rewrite MPQ archives or DS1 binaries.
        </p>
      </section>

      <section className="panel">
        <div className="status-banner">
          <div>
            <strong>{project.meta.exportName || 'pd2-map-export'}</strong>
            <p className="muted">Generate an export bundle whenever you want fresh table previews.</p>
          </div>
          <button type="button" className="btn" onClick={buildExport}>
            Build export bundle
          </button>
        </div>
      </section>

      {exportBundle ? (
        <>
          <section className="panel">
            <div className="button-row">
              <button
                type="button"
                className="btn"
                onClick={() => void downloadExportBundle(exportBundle, project.meta.exportName || 'pd2-map-export')}
              >
                Download zip
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => void copyTextToClipboard(exportBundle.projectJson)}
              >
                Copy project JSON
              </button>
            </div>
          </section>

          <section className="panel">
            <h2>Files</h2>
            <div className="preview-list">
              {exportBundle.files.map((file) => (
                <article key={file.name} className="preview-card">
                  <div className="preview-title">
                    <strong>{file.name}</strong>
                    <button
                      type="button"
                      className="btn-ghost"
                      onClick={() => downloadTextFile(file.name, file.content)}
                    >
                      Download
                    </button>
                  </div>
                  <pre className="preview-block">{file.content}</pre>
                </article>
              ))}
            </div>
          </section>
        </>
      ) : (
        <section className="panel">
          <div className="empty-state">No export built yet. Click “Build export bundle” to generate previews.</div>
        </section>
      )}
    </div>
  )
}

import { Link } from 'react-router-dom'
import { useShallow } from 'zustand/react/shallow'
import { copyTextToClipboard, downloadExportBundle, downloadTextArchive, downloadTextFile } from '../lib/download'
import { getBindingState } from '../lib/bindings'
import { getThemePreset } from '../lib/draft'
import { buildReviewPacketFiles, buildReviewSummary } from '../lib/reviewPacket'
import { useAppStore } from '../store/useAppStore'

export function ExportPage() {
  const { sourceBundle, project, preferences, exportBundle, buildExport, clearExport } = useAppStore(
    useShallow((state) => ({
      sourceBundle: state.sourceBundle,
      project: state.project,
      preferences: state.preferences,
      exportBundle: state.exportBundle,
      buildExport: state.buildExport,
      clearExport: state.clearExport,
    })),
  )

  const bindingState = getBindingState(project, sourceBundle)
  const theme = getThemePreset(project.draft.selectedThemeId)
  const projectJson = JSON.stringify(project, null, 2)
  const reviewSummary = buildReviewSummary(project, sourceBundle)
  const reviewPacketFiles = buildReviewPacketFiles(project, sourceBundle, exportBundle)

  return (
    <div className="page">
      <section className="page-hero">
        <h1>Export</h1>
        <p>
          There are two export layers here. You can always save the planner project JSON. PD2-ready table export only
          unlocks when the review blockers are clear and imported bindings are present.
        </p>
      </section>

      {preferences.guidedMode ? (
        <section className="callout success">
          <strong>Do this now</strong>
          <p>Download the planner JSON if you just want to keep working. Download the review packet if you want something easy to send to the PD2 team. Build the PD2 export bundle only when the blockers are gone.</p>
        </section>
      ) : null}

      <div className="two-column">
        <section className="panel">
          <h2>Planner export</h2>
          <p className="muted">
            Save the beginner-friendly map draft even before you import PD2 files.
          </p>
          <div className="button-row">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => downloadTextFile(`${project.meta.exportName || 'pd2-map-draft'}.planner.json`, projectJson)}
            >
              Download planner JSON
            </button>
            <button
              type="button"
              className="btn-ghost"
              onClick={() => void copyTextToClipboard(projectJson)}
            >
              Copy planner JSON
            </button>
          </div>
        </section>

        <section className="panel">
          <h2>PD2 export</h2>
          <div className={`callout${bindingState.canExportToPd2 ? ' success' : ' warning'}`}>
            <strong>{bindingState.canExportToPd2 ? 'PD2 export unlocked' : 'PD2 export still blocked'}</strong>
            <p className="muted">
              {bindingState.canExportToPd2
                ? `Theme ${theme?.name ?? project.meta.theme} is bound to ${bindingState.levelTypeName ?? bindingState.levelTypeId}.`
                : bindingState.blockers[0] ?? 'Check the review screen first.'}
            </p>
          </div>

          <div className="button-row">
            <button
              type="button"
              className="btn"
              disabled={!bindingState.canExportToPd2}
              onClick={buildExport}
            >
              Build PD2 export bundle
            </button>
            <button type="button" className="btn-ghost" onClick={clearExport} disabled={!exportBundle}>
              Clear preview
            </button>
          </div>

          {!bindingState.canExportToPd2 ? (
            <ul className="helper-list">
              {bindingState.blockers.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          ) : null}
        </section>
      </div>

      <section className="panel">
        <h2>Review packet</h2>
        <p className="muted">
          This zip is the easy share option. It includes the planner JSON, a plain-English review note, and the raw PD2 export files if they are ready.
        </p>
        <div className="button-row">
          <button
            type="button"
            className="btn-secondary"
            onClick={() => void downloadTextArchive(reviewPacketFiles, `${project.meta.exportName || 'pd2-map-review'}-packet`)}
          >
            Download review packet
          </button>
          <button
            type="button"
            className="btn-ghost"
            onClick={() => void copyTextToClipboard(reviewSummary)}
          >
            Copy review summary
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
                Download PD2 zip
              </button>
            </div>
          </section>

          <section className="panel">
            <h2>Generated files</h2>
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
      ) : null}

      <section className="panel">
        <div className="button-row">
          <Link className="btn-ghost" to="/review">
            Back to review
          </Link>
          <Link className="btn-secondary" to="/advanced">
            Advanced mode
          </Link>
        </div>
      </section>
    </div>
  )
}

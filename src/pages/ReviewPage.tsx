import { Link } from 'react-router-dom'
import { useShallow } from 'zustand/react/shallow'
import { getBindingState } from '../lib/bindings'
import { countDraftKinds, getDraftConnectorStates, getGridBounds, getThemePreset, getAvailablePieceTemplates } from '../lib/draft'
import { useAppStore } from '../store/useAppStore'

export function ReviewPage() {
  const { sourceBundle, project, preferences } = useAppStore(
    useShallow((state) => ({
      sourceBundle: state.sourceBundle,
      project: state.project,
      preferences: state.preferences,
    })),
  )

  const templates = getAvailablePieceTemplates(project.roomTemplates)
  const bindingState = getBindingState(project, sourceBundle)
  const draftCounts = countDraftKinds(project.draft.pieces)
  const bounds = getGridBounds(project.draft.pieces)
  const connectorStates = getDraftConnectorStates(project.draft, templates)
  const selectedTheme = getThemePreset(project.draft.selectedThemeId)

  return (
    <div className="page">
      <section className="page-hero">
        <h1>Review the route before export</h1>
        <p>
          This screen translates the technical state into plain English. If something blocks PD2 export, the blocker
          should be obvious here.
        </p>
      </section>

      {preferences.guidedMode ? (
        <section className="callout success">
          <strong>Do this now</strong>
          <p>Read the blockers first. If something is wrong, go back to Build. If this version looks good, export a review packet so it is easy to share with the PD2 team.</p>
        </section>
      ) : null}

      <section className="review-grid">
        <div className="panel">
          <h2>Layout summary</h2>
          <div className="stats-row">
            <div className="stat-card">
              <span>Theme</span>
              <strong>{selectedTheme?.name ?? 'Not chosen'}</strong>
            </div>
            <div className="stat-card">
              <span>Total pieces</span>
              <strong>{project.draft.pieces.length}</strong>
            </div>
            <div className="stat-card">
              <span>Open warnings</span>
              <strong>{bindingState.openConnectorCount}</strong>
            </div>
            <div className="stat-card">
              <span>Grid footprint</span>
              <strong>
                {bounds.width} x {bounds.height}
              </strong>
            </div>
            <div className="stat-card">
              <span>Saved variations</span>
              <strong>{project.variants.length}</strong>
            </div>
          </div>

          <div className="piece-summary">
            <span className="tag">Rooms {draftCounts.room}</span>
            <span className="tag">Straight corridors {draftCounts['corridor-straight']}</span>
            <span className="tag">Corner corridors {draftCounts['corridor-corner']}</span>
            <span className="tag">Junctions {draftCounts['junction-t'] + draftCounts['junction-cross']}</span>
            <span className="tag">Entrance {draftCounts.entrance}</span>
            <span className="tag">Exit {draftCounts.exit}</span>
            <span className="tag">Boss rooms {draftCounts['boss-room']}</span>
          </div>
        </div>

        <div className="panel">
          <h2>PD2 export readiness</h2>
          <div className={`callout${bindingState.canExportToPd2 ? ' success' : ' warning'}`}>
            <strong>{bindingState.canExportToPd2 ? 'Ready for PD2 export' : 'Not ready for PD2 export yet'}</strong>
            <p className="muted">
              {bindingState.canExportToPd2
                ? `Theme bound to ${bindingState.levelTypeName ?? bindingState.levelTypeId}.`
                : 'You can keep designing now, but final PD2 table export still needs the blockers below resolved.'}
            </p>
          </div>

          <div className="checklist">
            <div className="checklist-group">
              <h3>Blockers</h3>
              {bindingState.blockers.length ? (
                <ul className="helper-list">
                  {bindingState.blockers.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              ) : (
                <div className="empty-state">No blockers. This layout can build a PD2 export bundle.</div>
              )}
            </div>

            <div className="checklist-group">
              <h3>Warnings</h3>
              {bindingState.warnings.length ? (
                <ul className="helper-list">
                  {bindingState.warnings.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              ) : (
                <div className="empty-state">No review warnings.</div>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="panel">
        <h2>Connection health</h2>
        {connectorStates.length ? (
          <div className="issue-list">
            {connectorStates
              .filter((item) => item.state !== 'matched')
              .map((item) => (
                <div key={`${item.pieceId}-${item.side}`} className={`issue-card ${item.state === 'conflict' ? 'error' : 'warning'}`}>
                  <div className="room-title">
                    <strong>{item.state === 'conflict' ? 'Mismatch' : 'Open connection'}</strong>
                    <span className={`tag ${item.state === 'conflict' ? 'danger' : 'warning'}`}>{item.side}</span>
                  </div>
                  <p>
                    Piece {item.pieceId} has a {item.side} connector that is {item.state === 'conflict' ? 'not matching its neighbor' : 'not connected'}.
                  </p>
                </div>
              ))}
          </div>
        ) : (
          <div className="empty-state">No pieces placed yet.</div>
        )}
      </section>

      <section className="panel">
        <div className="button-row">
          <Link className="btn-ghost" to="/build">
            Back to build
          </Link>
          <Link className="btn-secondary" to="/advanced">
            Open advanced mode
          </Link>
          <Link className="btn" to="/export">
            Continue to export
          </Link>
        </div>
      </section>
    </div>
  )
}

import { useAppStore } from '../store/useAppStore'
import { useShallow } from 'zustand/react/shallow'

export function ValidationPage() {
  const { validation, runValidation } = useAppStore(
    useShallow((state) => ({
      validation: state.project.validation,
      runValidation: state.runValidation,
    })),
  )

  const errors = validation.filter((item) => item.severity === 'error').length
  const warnings = validation.filter((item) => item.severity === 'warning').length
  const info = validation.filter((item) => item.severity === 'info').length

  return (
    <div className="page">
      <section className="page-hero">
        <h1>Validation</h1>
        <p>
          Check the imported tables, room links, connectors, and warp ids before you export anything back into your
          extracted mod workspace.
        </p>
      </section>

      <section className="stats-row">
        <div className="stat-card">
          <span>Errors</span>
          <strong>{errors}</strong>
        </div>
        <div className="stat-card">
          <span>Warnings</span>
          <strong>{warnings}</strong>
        </div>
        <div className="stat-card">
          <span>Info</span>
          <strong>{info}</strong>
        </div>
      </section>

      <section className="panel">
        <div className="status-banner">
          <div>
            <strong>Current validation pass</strong>
            <p className="muted">Run this after changing connectors, layout placements, or export metadata.</p>
          </div>
          <button type="button" className="btn" onClick={runValidation}>
            Re-run validation
          </button>
        </div>
      </section>

      <section className="panel">
        <h2>Issues</h2>
        {validation.length ? (
          <div className="issue-list">
            {validation.map((item) => (
              <article key={item.id} className={`issue-card ${item.severity}`}>
                <div className="room-title">
                  <strong>{item.code}</strong>
                  <span className={`tag ${item.severity === 'error' ? 'danger' : item.severity === 'warning' ? 'warning' : 'success'}`}>
                    {item.severity}
                  </span>
                </div>
                <p>{item.message}</p>
                {item.details ? <p className="muted">{item.details}</p> : null}
                {item.path ? <p className="muted">{item.path}</p> : null}
              </article>
            ))}
          </div>
        ) : (
          <div className="empty-state">No issues. Import a bundle or load the demo workspace to start validating.</div>
        )}
      </section>
    </div>
  )
}

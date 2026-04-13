import { useMemo, useState, type DragEvent } from 'react'
import { Link } from 'react-router-dom'
import { useShallow } from 'zustand/react/shallow'
import { getBindingState } from '../lib/bindings'
import {
  findPieceTemplate,
  getAvailablePieceTemplates,
  getDraftConnectorStates,
  getPieceConnectors,
  getThemePreset,
  GRID_DIRECTIONS,
  nextConnectorLabel,
} from '../lib/draft'
import { useAppStore } from '../store/useAppStore'

function connectorTone(state: 'open' | 'matched' | 'conflict'): string {
  if (state === 'matched') {
    return ' success'
  }
  if (state === 'conflict') {
    return ' danger'
  }
  return ' warning'
}

export function BuildPage() {
  const [draggingPieceId, setDraggingPieceId] = useState<string | undefined>()
  const {
    sourceBundle,
    project,
    preferences,
    zoom,
    pan,
    setZoom,
    nudgePan,
    selectPieceTemplate,
    selectDraftPiece,
    placePiece,
    movePiece,
    rotateDraftPiece,
    duplicateDraftPiece,
    deleteDraftPiece,
    updateDraftPiece,
    updateDraftNotes,
    saveDraftVariant,
    loadDraftVariant,
    deleteDraftVariant,
    clearDraft,
  } = useAppStore(
    useShallow((state) => ({
      sourceBundle: state.sourceBundle,
      project: state.project,
      preferences: state.preferences,
      zoom: state.zoom,
      pan: state.pan,
      setZoom: state.setZoom,
      nudgePan: state.nudgePan,
      selectPieceTemplate: state.selectPieceTemplate,
      selectDraftPiece: state.selectDraftPiece,
      placePiece: state.placePiece,
      movePiece: state.movePiece,
      rotateDraftPiece: state.rotateDraftPiece,
      duplicateDraftPiece: state.duplicateDraftPiece,
      deleteDraftPiece: state.deleteDraftPiece,
      updateDraftPiece: state.updateDraftPiece,
      updateDraftNotes: state.updateDraftNotes,
      saveDraftVariant: state.saveDraftVariant,
      loadDraftVariant: state.loadDraftVariant,
      deleteDraftVariant: state.deleteDraftVariant,
      clearDraft: state.clearDraft,
    })),
  )

  const theme = getThemePreset(project.draft.selectedThemeId)
  const templates = useMemo(() => getAvailablePieceTemplates(project.roomTemplates), [project.roomTemplates])
  const starterTemplates = templates.filter((template) => template.source === 'starter')
  const importedTemplates = templates.filter((template) => template.source === 'imported')
  const selectedTemplate = findPieceTemplate(templates, project.draft.selectedPieceTemplateId)
  const selectedPiece = project.draft.pieces.find((piece) => piece.id === project.draft.selectedPieceId)
  const selectedPieceTemplate = findPieceTemplate(templates, selectedPiece?.templateId)
  const connectorStates = getDraftConnectorStates(project.draft, templates)
  const connectorLookup = new Map(
    connectorStates.map((state) => [`${state.pieceId}:${state.side}`, state.state] as const),
  )
  const bindingState = getBindingState(project, sourceBundle)

  const onDropCell = (event: DragEvent<HTMLButtonElement>, x: number, y: number) => {
    event.preventDefault()
    if (draggingPieceId) {
      movePiece(draggingPieceId, x, y)
      setDraggingPieceId(undefined)
    }
  }

  return (
    <div className="page">
      <section className="page-hero">
        <h1>Build the route visually</h1>
        <p>
          Pick a piece from the left, click a cell to place it, or drag a placed piece to move it. Imported rooms show
          up below the starter shapes when advanced data is loaded.
        </p>
      </section>

      {preferences.guidedMode ? (
        <section className="callout success">
          <strong>Do this now</strong>
          <p>1. Choose a piece on the left. 2. Click the grid to place it. 3. Add an entrance and an exit. 4. Save a variation before trying a different route.</p>
        </section>
      ) : null}

      <div className="build-layout">
        <section className="panel compact">
          <h2>Piece palette</h2>
          <div className="palette-section">
            <h3>Starter pieces</h3>
            <div className="room-grid">
              {starterTemplates.map((template) => (
                <button
                  key={template.id}
                  type="button"
                  className={`room-card${selectedTemplate?.id === template.id ? ' active' : ''}`}
                  aria-label={`Choose ${template.name}`}
                  onClick={() => selectPieceTemplate(template.id)}
                >
                  <div className="room-title">
                    <strong>{template.name}</strong>
                    <span className="tag">{template.kind}</span>
                  </div>
                  <p className="muted">{template.description}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="palette-section">
            <h3>Imported room pieces</h3>
            {importedTemplates.length ? (
              <div className="room-grid">
                {importedTemplates.map((template) => (
                  <button
                    key={template.id}
                    type="button"
                    className={`room-card${selectedTemplate?.id === template.id ? ' active' : ''}`}
                    aria-label={`Choose ${template.name}`}
                    onClick={() => selectPieceTemplate(template.id)}
                  >
                    <div className="room-title">
                      <strong>{template.name}</strong>
                      <span className="tag success">Imported</span>
                    </div>
                    <p className="muted">{template.description}</p>
                  </button>
                ))}
              </div>
            ) : (
              <div className="empty-state">Import extracted data in Advanced Mode to unlock real room pieces here.</div>
            )}
          </div>
        </section>

        <section className="panel canvas-shell">
          <div className="canvas-toolbar">
            <div className="mini-card">
              <span>Theme</span>
              <strong>{theme?.name ?? 'Choose a theme first'}</strong>
            </div>
            <div className="mini-card">
              <span>Selected piece</span>
              <strong>{selectedTemplate?.name ?? 'None'}</strong>
            </div>
            <div className="button-row">
              <button type="button" className="btn-ghost" onClick={() => nudgePan(-40, 0)}>
                Left
              </button>
              <button type="button" className="btn-ghost" onClick={() => nudgePan(40, 0)}>
                Right
              </button>
              <button type="button" className="btn-ghost" onClick={() => nudgePan(0, -40)}>
                Up
              </button>
              <button type="button" className="btn-ghost" onClick={() => nudgePan(0, 40)}>
                Down
              </button>
            </div>
            <div className="field" style={{ minWidth: 180 }}>
              <label htmlFor="build-zoom">Zoom</label>
              <input
                id="build-zoom"
                type="range"
                min={0.7}
                max={1.6}
                step={0.1}
                value={zoom}
                onChange={(event) => setZoom(Number.parseFloat(event.target.value))}
              />
            </div>
          </div>

          <div className="canvas-wrap">
            <div
              className="canvas-grid beginner-canvas"
              style={{
                transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                backgroundImage: `linear-gradient(${theme?.palette.grid ?? 'rgba(255,255,255,0.06)'} 1px, transparent 1px), linear-gradient(90deg, ${theme?.palette.grid ?? 'rgba(255,255,255,0.06)'} 1px, transparent 1px)`,
              }}
            >
              {Array.from({ length: 14 * 10 }).map((_, index) => {
                const x = index % 14
                const y = Math.floor(index / 14)
                const piece = project.draft.pieces.find((item) => item.x === x && item.y === y)
                const pieceTemplate = piece ? findPieceTemplate(templates, piece.templateId) : undefined
                const connectors = piece ? getPieceConnectors(piece, templates) : []

                return (
                  <button
                    key={`${x}-${y}`}
                    type="button"
                    className="canvas-cell build-cell"
                    aria-label={
                      piece
                        ? `Select ${piece.name} at ${x},${y}`
                        : `Place ${selectedTemplate?.name ?? 'piece'} at ${x},${y}`
                    }
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={(event) => onDropCell(event, x, y)}
                    onClick={() => {
                      if (piece) {
                        selectDraftPiece(piece.id)
                      } else {
                        placePiece(x, y)
                      }
                    }}
                  >
                    {piece && pieceTemplate ? (
                      <div
                        className={`draft-piece${project.draft.selectedPieceId === piece.id ? ' selected' : ''}`}
                        draggable
                        onDragStart={() => setDraggingPieceId(piece.id)}
                        onDragEnd={() => setDraggingPieceId(undefined)}
                        style={{
                          borderColor: pieceTemplate.accent,
                          background: `linear-gradient(180deg, ${pieceTemplate.accent}22, rgba(17, 13, 13, 0.88))`,
                        }}
                      >
                        <span className="draft-piece-kind">{piece.name}</span>
                        <span className="draft-piece-label">
                          {piece.label || piece.kind.replace('-', ' ')}
                        </span>
                        <div className="room-connectors">
                          {GRID_DIRECTIONS.map((side) =>
                            connectors.includes(side) ? (
                              <span
                                key={`${piece.id}-${side}`}
                                className={`connector-dot ${side}${connectorTone(
                                  connectorLookup.get(`${piece.id}:${side}`) ?? 'matched',
                                )}`}
                              />
                            ) : null,
                          )}
                        </div>
                      </div>
                    ) : (
                      <span className="muted">
                        {x},{y}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="callout warning">
            <strong>{bindingState.openConnectorCount} connection warnings</strong>
            <p>
              {bindingState.openConnectorCount === 0
                ? 'Every connector currently has a matching neighbor.'
                : 'Open or mismatched connectors show on the canvas in amber or red.'}
            </p>
          </div>
        </section>

        <section className="panel compact">
          <h2>Selected item</h2>
          {selectedPiece && selectedPieceTemplate ? (
            <>
              <div className="mini-card">
                <span>Piece type</span>
                <strong>{selectedPieceTemplate.name}</strong>
                <span>{selectedPiece.source === 'imported' ? 'Imported room binding' : 'Starter planning shape'}</span>
              </div>

              <div className="field">
                <label htmlFor="piece-name">Piece name</label>
                <input
                  id="piece-name"
                  value={selectedPiece.name}
                  onChange={(event) => updateDraftPiece(selectedPiece.id, { name: event.target.value })}
                />
              </div>

              <div className="field">
                <label htmlFor="piece-label">Visible label</label>
                <input
                  id="piece-label"
                  value={selectedPiece.label}
                  onChange={(event) => updateDraftPiece(selectedPiece.id, { label: event.target.value })}
                  placeholder="Boss, reward room, side path..."
                />
              </div>

              <div className="field">
                <label htmlFor="piece-notes">Notes</label>
                <textarea
                  id="piece-notes"
                  value={selectedPiece.notes}
                  onChange={(event) => updateDraftPiece(selectedPiece.id, { notes: event.target.value })}
                />
              </div>

              <div className="piece-summary">
                {getPieceConnectors(selectedPiece, templates).map((side) => {
                  const state = connectorLookup.get(`${selectedPiece.id}:${side}`) ?? 'matched'
                  return (
                    <span key={`${selectedPiece.id}-${side}`} className={`tag${connectorTone(state)}`}>
                      {nextConnectorLabel(side)} {state}
                    </span>
                  )
                })}
              </div>

              <div className="button-row">
                <button type="button" className="btn-secondary" onClick={() => rotateDraftPiece(selectedPiece.id)}>
                  Rotate
                </button>
                <button type="button" className="btn-ghost" onClick={() => duplicateDraftPiece(selectedPiece.id)}>
                  Duplicate
                </button>
                <button type="button" className="btn-danger" onClick={() => deleteDraftPiece(selectedPiece.id)}>
                  Delete
                </button>
              </div>
            </>
          ) : (
            <div className="empty-state">Select a piece on the canvas to rename it, rotate it, or add notes.</div>
          )}

          <h3>Whole draft notes</h3>
          <div className="field">
            <label htmlFor="draft-notes">Route notes</label>
            <textarea
              id="draft-notes"
              value={project.draft.notes}
              onChange={(event) => updateDraftNotes(event.target.value)}
              placeholder="Explain the route flow, reward spots, boss idea, or pacing."
            />
          </div>

          <div className="button-row">
            <button type="button" className="btn-ghost" onClick={clearDraft}>
              Clear canvas
            </button>
          </div>

          <h3>Variations</h3>
          <p className="muted">Save a copy of this layout before you try a different version.</p>

          <div className="button-row">
            <button type="button" className="btn-secondary" onClick={saveDraftVariant}>
              Save current layout as variation
            </button>
          </div>

          {project.variants.length ? (
            <div className="variant-list">
              {project.variants.map((variant) => (
                <article key={variant.id} className="room-card">
                  <div className="room-title">
                    <strong>{variant.name}</strong>
                    <span className="tag">{variant.draft.pieces.length} pieces</span>
                  </div>
                  <p className="muted">Saved {new Date(variant.savedAt).toLocaleString()}</p>
                  <div className="button-row">
                    <button type="button" className="btn-ghost" onClick={() => loadDraftVariant(variant.id)}>
                      Load
                    </button>
                    <button type="button" className="btn-danger" onClick={() => deleteDraftVariant(variant.id)}>
                      Delete
                    </button>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="empty-state">No saved variations yet.</div>
          )}
        </section>
      </div>

      <section className="panel">
        <div className="button-row">
          <Link className="btn-ghost" to="/theme">
            Back to theme
          </Link>
          <Link className="btn-secondary" to="/advanced">
            Advanced mode
          </Link>
          <Link className="btn" to="/review">
            Continue to review
          </Link>
        </div>
      </section>
    </div>
  )
}

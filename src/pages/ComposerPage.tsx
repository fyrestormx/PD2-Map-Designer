import { CONNECTOR_SIDES, DEFAULT_CANVAS_SIZE } from '../lib/constants'
import { getRoomById } from '../lib/project'
import { getPlacementConnectorStates } from '../lib/validation'
import { useAppStore } from '../store/useAppStore'
import { useShallow } from 'zustand/react/shallow'

function connectorStateClass(state: 'open' | 'matched' | 'conflict'): string {
  if (state === 'conflict') {
    return ' conflict'
  }
  if (state === 'open') {
    return ' warning'
  }
  return ''
}

export function ComposerPage() {
  const {
    project,
    selectedRoomTemplateId,
    selectedPlacementId,
    selectRoomTemplate,
    placeSelectedRoom,
    selectPlacement,
    updatePlacement,
    removePlacement,
    updateMeta,
    addWarpOverride,
    updateWarpOverride,
    removeWarpOverride,
    zoom,
    setZoom,
    pan,
    nudgePan,
  } = useAppStore(
    useShallow((state) => ({
      project: state.project,
      selectedRoomTemplateId: state.selectedRoomTemplateId,
      selectedPlacementId: state.selectedPlacementId,
      selectRoomTemplate: state.selectRoomTemplate,
      placeSelectedRoom: state.placeSelectedRoom,
      selectPlacement: state.selectPlacement,
      updatePlacement: state.updatePlacement,
      removePlacement: state.removePlacement,
      updateMeta: state.updateMeta,
      addWarpOverride: state.addWarpOverride,
      updateWarpOverride: state.updateWarpOverride,
      removeWarpOverride: state.removeWarpOverride,
      zoom: state.zoom,
      setZoom: state.setZoom,
      pan: state.pan,
      nudgePan: state.nudgePan,
    })),
  )

  const connectorStates = getPlacementConnectorStates(project)
  const connectorLookup = new Map(
    connectorStates.map((state) => [`${state.placementId}:${state.side}`, state.state] as const),
  )
  const selectedPlacement = project.placements.find((placement) => placement.placementId === selectedPlacementId)
  const selectedRoom = getRoomById(project, selectedRoomTemplateId)
  const selectedPlacementRoom = getRoomById(project, selectedPlacement?.roomTemplateId)

  return (
    <div className="page">
      <section className="page-hero">
        <h1>Composer</h1>
        <p>
          Snap tagged rooms onto a grid, lock key placements, and edit map metadata without touching raw tiles.
          The colored dots show connector health: green matched, amber open, red mismatched.
        </p>
      </section>

      <div className="composer-layout">
        <section className="panel compact">
          <h2>Room picker</h2>
          {project.roomTemplates.length ? (
            <div className="room-grid">
              {project.roomTemplates.map((room) => (
                <button
                  key={room.id}
                  type="button"
                  className={`room-card${selectedRoom?.id === room.id ? ' active' : ''}`}
                  onClick={() => selectRoomTemplate(room.id)}
                >
                  <div className="room-title">
                    <strong>{room.name}</strong>
                    <span className="tag">{room.size.x}x{room.size.y}</span>
                  </div>
                  <p className="muted">{room.ds1Path.split('/').pop()}</p>
                  <div className="tag-list">
                    {room.connectorSides.map((side) => (
                      <span key={`${room.id}-${side}`} className="tag">
                        {side}
                      </span>
                    ))}
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="empty-state">Import a source bundle first so you have rooms to place.</div>
          )}
        </section>

        <section className="panel canvas-shell">
          <div className="canvas-toolbar">
            <div className="mini-card">
              <span>Selected room</span>
              <strong>{selectedRoom?.name ?? 'None'}</strong>
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
            <div className="field" style={{ minWidth: 160 }}>
              <label htmlFor="zoom-range">Zoom</label>
              <input
                id="zoom-range"
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
              className="canvas-grid"
              style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }}
            >
              {Array.from({ length: DEFAULT_CANVAS_SIZE * DEFAULT_CANVAS_SIZE }).map((_, index) => {
                const x = index % DEFAULT_CANVAS_SIZE
                const y = Math.floor(index / DEFAULT_CANVAS_SIZE)
                const placement = project.placements.find((item) => item.x === x && item.y === y)
                const room = placement ? getRoomById(project, placement.roomTemplateId) : undefined

                return (
                  <button
                    key={`${x}-${y}`}
                    type="button"
                    className="canvas-cell"
                    onClick={() => {
                      if (placement) {
                        selectPlacement(placement.placementId)
                      } else {
                        placeSelectedRoom(x, y)
                      }
                    }}
                  >
                    {placement && room ? (
                      <div className={`placed-room${selectedPlacementId === placement.placementId ? ' selected' : ''}`}>
                        <strong>{room.name}</strong>
                        <span className="muted">
                          {x},{y}
                        </span>
                        <div className="room-connectors">
                          {CONNECTOR_SIDES.map((side) =>
                            room.connectorSides.includes(side) ? (
                              <span
                                key={`${placement.placementId}-${side}`}
                                className={`connector-dot ${side}${connectorStateClass(
                                  connectorLookup.get(`${placement.placementId}:${side}`) ?? 'matched',
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
        </section>

        <section className="panel compact">
          <h2>Details</h2>
          <div className="field-grid">
            <div className="field">
              <label htmlFor="map-name">Map name</label>
              <input
                id="map-name"
                value={project.meta.name}
                onChange={(event) => updateMeta({ name: event.target.value })}
              />
            </div>
            <div className="field">
              <label htmlFor="map-theme">Theme</label>
              <input
                id="map-theme"
                value={project.meta.theme}
                onChange={(event) => updateMeta({ theme: event.target.value })}
              />
            </div>
          </div>
          <div className="field">
            <label htmlFor="map-description">Description</label>
            <textarea
              id="map-description"
              value={project.meta.description}
              onChange={(event) => updateMeta({ description: event.target.value })}
            />
          </div>

          {selectedPlacement && selectedPlacementRoom ? (
            <>
              <h3>Selected placement</h3>
              <div className="field-grid">
                <div className="field">
                  <label htmlFor="placement-x">Grid X</label>
                  <input
                    id="placement-x"
                    type="number"
                    value={selectedPlacement.x}
                    onChange={(event) =>
                      updatePlacement(selectedPlacement.placementId, {
                        x: Number.parseInt(event.target.value, 10) || 0,
                      })
                    }
                  />
                </div>
                <div className="field">
                  <label htmlFor="placement-y">Grid Y</label>
                  <input
                    id="placement-y"
                    type="number"
                    value={selectedPlacement.y}
                    onChange={(event) =>
                      updatePlacement(selectedPlacement.placementId, {
                        y: Number.parseInt(event.target.value, 10) || 0,
                      })
                    }
                  />
                </div>
              </div>

              <div className="checkbox-grid">
                <label className="check-pill">
                  <input
                    type="checkbox"
                    checked={selectedPlacement.locked}
                    onChange={(event) =>
                      updatePlacement(selectedPlacement.placementId, { locked: event.target.checked })
                    }
                  />
                  Lock this room
                </label>
              </div>

              <div className="button-row">
                <button
                  type="button"
                  className="btn-danger"
                  onClick={() => removePlacement(selectedPlacement.placementId)}
                >
                  Remove placement
                </button>
              </div>

              <h3>Warp overrides</h3>
              <div className="button-row">
                {CONNECTOR_SIDES.map((side) => (
                  <button
                    key={`add-warp-${side}`}
                    type="button"
                    className="btn-secondary"
                    onClick={() => addWarpOverride(selectedPlacement.placementId, side)}
                  >
                    Add {side} warp
                  </button>
                ))}
              </div>

              {selectedPlacement.warpOverrides.length ? (
                <div className="warp-list">
                  {selectedPlacement.warpOverrides.map((warp) => (
                    <div key={warp.id} className="preview-card">
                      <div className="field">
                        <label>Label</label>
                        <input
                          value={warp.label}
                          onChange={(event) =>
                            updateWarpOverride(selectedPlacement.placementId, warp.id, {
                              label: event.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="field">
                        <label>Target level id</label>
                        <input
                          value={warp.targetLevelId ?? ''}
                          onChange={(event) =>
                            updateWarpOverride(selectedPlacement.placementId, warp.id, {
                              targetLevelId: event.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="field">
                        <label>Unique id</label>
                        <input
                          value={warp.uniqueId ?? ''}
                          onChange={(event) =>
                            updateWarpOverride(selectedPlacement.placementId, warp.id, {
                              uniqueId: event.target.value,
                            })
                          }
                        />
                      </div>
                      <button
                        type="button"
                        className="btn-ghost"
                        onClick={() => removeWarpOverride(selectedPlacement.placementId, warp.id)}
                      >
                        Remove warp
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">No warp overrides on this placement yet.</div>
              )}
            </>
          ) : (
            <div className="empty-state">Select a placed room on the canvas to edit it.</div>
          )}
        </section>
      </div>
    </div>
  )
}

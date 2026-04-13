import { useMemo, useState } from 'react'
import { CONNECTOR_SIDES, ROOM_HINT_OPTIONS, ROOM_TAG_OPTIONS } from '../lib/constants'
import { useAppStore } from '../store/useAppStore'
import { useShallow } from 'zustand/react/shallow'

export function LibraryPage() {
  const [query, setQuery] = useState('')
  const {
    roomTemplates,
    selectedRoomTemplateId,
    selectRoomTemplate,
    updateRoomTemplate,
    toggleRoomConnector,
  } = useAppStore(
    useShallow((state) => ({
      roomTemplates: state.project.roomTemplates,
      selectedRoomTemplateId: state.selectedRoomTemplateId,
      selectRoomTemplate: state.selectRoomTemplate,
      updateRoomTemplate: state.updateRoomTemplate,
      toggleRoomConnector: state.toggleRoomConnector,
    })),
  )

  const filteredRooms = useMemo(() => {
    const lowered = query.trim().toLowerCase()
    if (!lowered) {
      return roomTemplates
    }
    return roomTemplates.filter((room) =>
      `${room.name} ${room.ds1Path} ${room.tags.join(' ')} ${room.notes}`.toLowerCase().includes(lowered),
    )
  }, [query, roomTemplates])

  const selectedRoom =
    filteredRooms.find((room) => room.id === selectedRoomTemplateId) ??
    roomTemplates.find((room) => room.id === selectedRoomTemplateId) ??
    roomTemplates[0]

  return (
    <div className="page">
      <section className="page-hero">
        <h1>Room library</h1>
        <p>
          Tag imported DS1 rooms by connectors, purpose, and spawn hints. The generator uses these tags to build
          layouts that stay closer to the way Diablo II level presets are assembled.
        </p>
      </section>

      <div className="two-column">
        <section className="panel">
          <h2>Imported rooms</h2>
          <div className="field">
            <label htmlFor="room-search">Search rooms</label>
            <input
              id="room-search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Filter by name, path, or tags"
            />
          </div>

          {filteredRooms.length ? (
            <div className="room-grid">
              {filteredRooms.map((room) => (
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
                  <p className="muted">{room.ds1Path}</p>
                  <div className="tag-list">
                    {room.connectorSides.map((side) => (
                      <span key={`${room.id}-${side}`} className="tag">
                        {side}
                      </span>
                    ))}
                    {room.tags.map((tag) => (
                      <span key={`${room.id}-${tag}`} className="tag">
                        {tag}
                      </span>
                    ))}
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="empty-state">No rooms match that search.</div>
          )}
        </section>

        <section className="panel">
          <h2>Selected room</h2>
          {selectedRoom ? (
            <>
              <div className="field-grid">
                <div className="field">
                  <label htmlFor="room-name">Name</label>
                  <input
                    id="room-name"
                    value={selectedRoom.name}
                    onChange={(event) => updateRoomTemplate(selectedRoom.id, { name: event.target.value })}
                  />
                </div>
                <div className="field">
                  <label htmlFor="room-width">Width</label>
                  <input
                    id="room-width"
                    type="number"
                    min={1}
                    value={selectedRoom.size.x}
                    onChange={(event) =>
                      updateRoomTemplate(selectedRoom.id, {
                        size: {
                          ...selectedRoom.size,
                          x: Number.parseInt(event.target.value, 10) || 1,
                        },
                      })
                    }
                  />
                </div>
                <div className="field">
                  <label htmlFor="room-height">Height</label>
                  <input
                    id="room-height"
                    type="number"
                    min={1}
                    value={selectedRoom.size.y}
                    onChange={(event) =>
                      updateRoomTemplate(selectedRoom.id, {
                        size: {
                          ...selectedRoom.size,
                          y: Number.parseInt(event.target.value, 10) || 1,
                        },
                      })
                    }
                  />
                </div>
              </div>

              <div className="field">
                <label>Connector sides</label>
                <div className="checkbox-grid">
                  {CONNECTOR_SIDES.map((side) => (
                    <label key={side} className="check-pill">
                      <input
                        type="checkbox"
                        checked={selectedRoom.connectorSides.includes(side)}
                        onChange={() => toggleRoomConnector(selectedRoom.id, side)}
                      />
                      {side}
                    </label>
                  ))}
                </div>
              </div>

              <div className="field">
                <label>Room tags</label>
                <div className="checkbox-grid">
                  {ROOM_TAG_OPTIONS.map((tag) => (
                    <label key={tag} className="check-pill">
                      <input
                        type="checkbox"
                        checked={selectedRoom.tags.includes(tag)}
                        onChange={(event) => {
                          const nextTags = event.target.checked
                            ? [...selectedRoom.tags, tag]
                            : selectedRoom.tags.filter((item) => item !== tag)
                          updateRoomTemplate(selectedRoom.id, { tags: nextTags })
                        }}
                      />
                      {tag}
                    </label>
                  ))}
                </div>
              </div>

              <div className="field">
                <label>Spawn hints</label>
                <div className="checkbox-grid">
                  {ROOM_HINT_OPTIONS.map((hint) => (
                    <label key={hint} className="check-pill">
                      <input
                        type="checkbox"
                        checked={selectedRoom.spawnHints.includes(hint)}
                        onChange={(event) => {
                          const nextHints = event.target.checked
                            ? [...selectedRoom.spawnHints, hint]
                            : selectedRoom.spawnHints.filter((item) => item !== hint)
                          updateRoomTemplate(selectedRoom.id, { spawnHints: nextHints })
                        }}
                      />
                      {hint}
                    </label>
                  ))}
                </div>
              </div>

              <div className="field">
                <label htmlFor="room-notes">Notes</label>
                <textarea
                  id="room-notes"
                  value={selectedRoom.notes}
                  onChange={(event) => updateRoomTemplate(selectedRoom.id, { notes: event.target.value })}
                />
              </div>

              <div className="mini-card">
                <span>DS1 path</span>
                <strong>{selectedRoom.ds1Path}</strong>
                <span>Preset id: {selectedRoom.linkedPresetId ?? 'not linked yet'}</span>
              </div>
            </>
          ) : (
            <div className="empty-state">Import a bundle first so the room library has something to edit.</div>
          )}
        </section>
      </div>
    </div>
  )
}

import { useMemo, useState } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { FileDropZone } from '../components/FileDropZone'
import { getBindingState } from '../lib/bindings'
import { CONNECTOR_SIDES, REQUIRED_TABLES } from '../lib/constants'
import { useAppStore } from '../store/useAppStore'

export function AdvancedPage() {
  const [query, setQuery] = useState('')
  const {
    sourceBundle,
    project,
    importStatus,
    importError,
    importBrowserFiles,
    loadDemoProject,
    selectedAdvancedRoomTemplateId,
    selectRoomTemplate,
    updateRoomTemplate,
    toggleRoomConnector,
    buildExport,
    exportBundle,
    runValidation,
  } = useAppStore(
    useShallow((state) => ({
      sourceBundle: state.sourceBundle,
      project: state.project,
      importStatus: state.importStatus,
      importError: state.importError,
      importBrowserFiles: state.importBrowserFiles,
      loadDemoProject: state.loadDemoProject,
      selectedAdvancedRoomTemplateId: state.selectedAdvancedRoomTemplateId,
      selectRoomTemplate: state.selectRoomTemplate,
      updateRoomTemplate: state.updateRoomTemplate,
      toggleRoomConnector: state.toggleRoomConnector,
      buildExport: state.buildExport,
      exportBundle: state.exportBundle,
      runValidation: state.runValidation,
    })),
  )

  const filteredRooms = useMemo(() => {
    const lowered = query.trim().toLowerCase()
    if (!lowered) {
      return project.roomTemplates
    }
    return project.roomTemplates.filter((room) =>
      `${room.name} ${room.ds1Path} ${room.tags.join(' ')} ${room.notes}`.toLowerCase().includes(lowered),
    )
  }, [project.roomTemplates, query])

  const selectedRoom =
    filteredRooms.find((room) => room.id === selectedAdvancedRoomTemplateId) ??
    project.roomTemplates.find((room) => room.id === selectedAdvancedRoomTemplateId) ??
    project.roomTemplates[0]

  const bindingState = getBindingState(project, sourceBundle)

  return (
    <div className="page">
      <section className="page-hero">
        <h1>Advanced mode</h1>
        <p>
          This keeps the extracted-file workflow available without making it the default experience. Use it to import
          real PD2 data, edit imported room connectors, run raw validation, and build table exports.
        </p>
      </section>

      <div className="advanced-grid">
        <section className="panel">
          <h2>Import extracted files</h2>
          <FileDropZone
            title="Import extracted folder"
            description="Choose a folder that contains Levels.txt, LvlMaze.txt, LvlPrest.txt, LvlTypes.txt, and optional DS1 files."
            directory
            disabled={importStatus === 'loading'}
            buttonLabel="Choose folder"
            onFiles={(files) => void importBrowserFiles(files)}
          />
          <div className="button-row">
            <button type="button" className="btn-secondary" onClick={loadDemoProject}>
              Load demo workspace
            </button>
          </div>
          {importError ? <div className="callout warning"><strong>Import error</strong><p>{importError}</p></div> : null}
          <div className="piece-summary">
            {REQUIRED_TABLES.map((tableName) => (
              <span key={tableName} className={`tag${sourceBundle?.tables[tableName] ? ' success' : ''}`}>
                {tableName}
              </span>
            ))}
          </div>
        </section>

        <section className="panel">
          <h2>Imported room bindings</h2>
          <div className="field">
            <label htmlFor="advanced-room-search">Search imported rooms</label>
            <input
              id="advanced-room-search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Filter by room name or path"
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
                    <span className="tag">{room.connectorSides.length} links</span>
                  </div>
                  <p className="muted">{room.ds1Path}</p>
                </button>
              ))}
            </div>
          ) : (
            <div className="empty-state">No imported rooms match that search.</div>
          )}
        </section>
      </div>

      <div className="two-column">
        <section className="panel">
          <h2>Selected imported room</h2>
          {selectedRoom ? (
            <>
              <div className="field-grid">
                <div className="field">
                  <label htmlFor="advanced-room-name">Name</label>
                  <input
                    id="advanced-room-name"
                    value={selectedRoom.name}
                    onChange={(event) => updateRoomTemplate(selectedRoom.id, { name: event.target.value })}
                  />
                </div>
                <div className="field">
                  <label htmlFor="advanced-room-note">Notes</label>
                  <input
                    id="advanced-room-note"
                    value={selectedRoom.notes}
                    onChange={(event) => updateRoomTemplate(selectedRoom.id, { notes: event.target.value })}
                  />
                </div>
              </div>

              <div className="piece-summary">
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

              <div className="mini-card">
                <span>Optional palette use</span>
                <strong>This imported room can now appear in the beginner build palette.</strong>
              </div>
            </>
          ) : (
            <div className="empty-state">Import DS1-linked rooms first.</div>
          )}
        </section>

        <section className="panel">
          <h2>Raw validation and export</h2>
          <div className="button-row">
            <button type="button" className="btn-secondary" onClick={runValidation}>
              Re-run validation
            </button>
            <button type="button" className="btn" disabled={!bindingState.canExportToPd2} onClick={buildExport}>
              Build raw PD2 export
            </button>
          </div>

          {!bindingState.canExportToPd2 ? (
            <ul className="helper-list">
              {bindingState.blockers.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          ) : null}

          {project.validation.length ? (
            <div className="issue-list">
              {project.validation.map((item) => (
                <div key={item.id} className={`issue-card ${item.severity}`}>
                  <div className="room-title">
                    <strong>{item.code}</strong>
                    <span className={`tag ${item.severity === 'error' ? 'danger' : item.severity === 'warning' ? 'warning' : 'success'}`}>
                      {item.severity}
                    </span>
                  </div>
                  <p>{item.message}</p>
                  {item.details ? <p className="muted">{item.details}</p> : null}
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">No raw validation issues right now.</div>
          )}

          {exportBundle ? (
            <div className="mini-card">
              <span>Latest raw export</span>
              <strong>{exportBundle.files.length} files ready for download in Export.</strong>
            </div>
          ) : null}
        </section>
      </div>
    </div>
  )
}

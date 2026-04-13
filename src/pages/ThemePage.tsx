import { useNavigate } from 'react-router-dom'
import { useShallow } from 'zustand/react/shallow'
import { getBindingState } from '../lib/bindings'
import { findImportedLevelTypeOption, getImportedLevelTypeOptions } from '../lib/levelTypes'
import { getThemePreset, THEME_PRESETS } from '../lib/draft'
import { useAppStore } from '../store/useAppStore'

export function ThemePage() {
  const navigate = useNavigate()
  const { sourceBundle, project, preferences, selectTheme, selectImportedLevelType, updateMeta } = useAppStore(
    useShallow((state) => ({
      sourceBundle: state.sourceBundle,
      project: state.project,
      preferences: state.preferences,
      selectTheme: state.selectTheme,
      selectImportedLevelType: state.selectImportedLevelType,
      updateMeta: state.updateMeta,
    })),
  )

  const bindingState = getBindingState(project, sourceBundle)
  const selectedTheme = getThemePreset(project.draft.selectedThemeId)
  const importedLevelTypes = getImportedLevelTypeOptions(sourceBundle)
  const selectedImportedLevelType = findImportedLevelTypeOption(sourceBundle, project.draft.selectedImportedLevelTypeId)

  return (
    <div className="page">
      <section className="page-hero">
        <h1>Choose the look and feel</h1>
        <p>
          Pick the visual mood first. The theme picker stays simple for now and uses placeholder previews, but if
          imported data exists the app will try to match that choice to a real LevelType behind the scenes.
        </p>
      </section>

      {preferences.guidedMode ? (
        <section className="callout success">
          <strong>Do this now</strong>
          <p>1. Name the map. 2. Pick a mood card. 3. If your files are loaded, pick the local tileset that should drive the real map graphics.</p>
        </section>
      ) : null}

      <section className="panel">
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
            <label htmlFor="map-description">Short goal</label>
            <input
              id="map-description"
              value={project.meta.description}
              onChange={(event) => updateMeta({ description: event.target.value })}
            />
          </div>
        </div>
      </section>

      <section className="theme-grid">
        {THEME_PRESETS.map((theme) => {
          const isSelected = theme.id === project.draft.selectedThemeId
          return (
            <button
              key={theme.id}
              type="button"
              className={`theme-card${isSelected ? ' active' : ''}`}
              style={{
                background: `linear-gradient(160deg, ${theme.palette.panel}, rgba(10, 8, 8, 0.96))`,
                color: theme.palette.ink,
              }}
              onClick={() => selectTheme(theme.id)}
            >
              <span className="theme-preview">{theme.preview}</span>
              <div className="theme-header">
                <strong>{theme.name}</strong>
                {isSelected ? <span className="tag success">Selected</span> : null}
              </div>
              <p>{theme.description}</p>
              <p className="muted">{theme.mood}</p>
              <div className="theme-swatches">
                <span style={{ backgroundColor: theme.palette.panel }} />
                <span style={{ backgroundColor: theme.palette.accent }} />
                <span style={{ backgroundColor: theme.palette.grid }} />
              </div>
            </button>
          )
        })}
      </section>

      <section className="panel">
        <h2>Local tilesets from your files</h2>
        <p className="muted">
          These come from your imported <code>LvlTypes.txt</code>. This file controls which tile graphics files are used for map building.
        </p>

        {importedLevelTypes.length ? (
          <div className="theme-grid">
            {importedLevelTypes.map((levelType) => {
              const isSelected = levelType.id === project.draft.selectedImportedLevelTypeId
              return (
                <button
                  key={levelType.id}
                  type="button"
                  className={`theme-card${isSelected ? ' active' : ''}`}
                  onClick={() => selectImportedLevelType(levelType.id)}
                >
                  <div className="theme-header">
                    <strong>{levelType.name}</strong>
                    {isSelected ? <span className="tag success">Using this tileset</span> : null}
                  </div>
                  <p>{levelType.summary}</p>
                  <p className="muted">Local LevelType ID: {levelType.id}</p>
                </button>
              )
            })}
          </div>
        ) : (
          <div className="empty-state">
            Load your local extracted files on the Start page if you want to choose real map tiles and graphics.
          </div>
        )}
      </section>

      <section className="panel">
        <div className="status-banner">
          <div>
            <strong>{selectedTheme ? selectedTheme.name : 'No theme selected yet'}</strong>
            <p className="muted">
              {selectedTheme
                ? sourceBundle
                  ? bindingState.themeBound
                    ? `Imported binding matched: ${bindingState.levelTypeName ?? bindingState.levelTypeId}`
                    : 'Imported data is loaded, but this theme does not match a LevelType yet.'
                  : 'You can keep building without imports. PD2 export stays locked until you import extracted files.'
                : 'Pick a theme so the build step has a clear visual direction.'}
            </p>
            {selectedImportedLevelType ? (
              <p className="muted">Local tileset selected: {selectedImportedLevelType.name}</p>
            ) : null}
          </div>
          <div className="button-row">
            <button type="button" className="btn-ghost" onClick={() => navigate('/')}>
              Back
            </button>
            <button
              type="button"
              className="btn"
              disabled={!selectedTheme}
              onClick={() => navigate('/build')}
            >
              Continue to build
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}

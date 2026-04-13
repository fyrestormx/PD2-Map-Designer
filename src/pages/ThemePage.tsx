import { useNavigate } from 'react-router-dom'
import { useShallow } from 'zustand/react/shallow'
import { getBindingState } from '../lib/bindings'
import { getThemePreset, THEME_PRESETS } from '../lib/draft'
import { useAppStore } from '../store/useAppStore'

export function ThemePage() {
  const navigate = useNavigate()
  const { sourceBundle, project, selectTheme, updateMeta } = useAppStore(
    useShallow((state) => ({
      sourceBundle: state.sourceBundle,
      project: state.project,
      selectTheme: state.selectTheme,
      updateMeta: state.updateMeta,
    })),
  )

  const bindingState = getBindingState(project, sourceBundle)
  const selectedTheme = getThemePreset(project.draft.selectedThemeId)

  return (
    <div className="page">
      <section className="page-hero">
        <h1>Choose the look and feel</h1>
        <p>
          Pick the visual mood first. The theme picker stays simple for now and uses placeholder previews, but if
          imported data exists the app will try to match that choice to a real LevelType behind the scenes.
        </p>
      </section>

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

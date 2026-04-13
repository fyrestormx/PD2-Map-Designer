import { useAppStore } from '../store/useAppStore'
import { useShallow } from 'zustand/react/shallow'

export function GeneratorPage() {
  const {
    project,
    generatorCandidates,
    activeCandidateIndex,
    updateGeneratorRules,
    generateCandidates,
    applyCandidate,
  } = useAppStore(
    useShallow((state) => ({
      project: state.project,
      generatorCandidates: state.generatorCandidates,
      activeCandidateIndex: state.activeCandidateIndex,
      updateGeneratorRules: state.updateGeneratorRules,
      generateCandidates: state.generateCandidates,
      applyCandidate: state.applyCandidate,
    })),
  )

  const rules = project.generatorRules

  return (
    <div className="page">
      <section className="page-hero">
        <h1>Template-based generator</h1>
        <p>
          Build repeatable layouts from tagged room presets. The generator keeps locked placements, uses a seed, and
          prefers rooms that match the current theme filters.
        </p>
      </section>

      <div className="two-column">
        <section className="panel">
          <h2>Generator rules</h2>
          <div className="field-grid">
            <div className="field">
              <label htmlFor="generator-seed">Seed</label>
              <input
                id="generator-seed"
                value={rules.seed}
                onChange={(event) => updateGeneratorRules({ seed: event.target.value })}
              />
            </div>
            <div className="field">
              <label htmlFor="room-min">Min rooms</label>
              <input
                id="room-min"
                type="number"
                min={1}
                value={rules.roomCount.min}
                onChange={(event) =>
                  updateGeneratorRules({
                    roomCount: {
                      ...rules.roomCount,
                      min: Number.parseInt(event.target.value, 10) || 1,
                    },
                  })
                }
              />
            </div>
            <div className="field">
              <label htmlFor="room-max">Max rooms</label>
              <input
                id="room-max"
                type="number"
                min={1}
                value={rules.roomCount.max}
                onChange={(event) =>
                  updateGeneratorRules({
                    roomCount: {
                      ...rules.roomCount,
                      max: Number.parseInt(event.target.value, 10) || 1,
                    },
                  })
                }
              />
            </div>
            <div className="field">
              <label htmlFor="size-width">Grid width</label>
              <input
                id="size-width"
                type="number"
                min={2}
                value={rules.sizeTarget.width}
                onChange={(event) =>
                  updateGeneratorRules({
                    sizeTarget: {
                      ...rules.sizeTarget,
                      width: Number.parseInt(event.target.value, 10) || 2,
                    },
                  })
                }
              />
            </div>
            <div className="field">
              <label htmlFor="size-height">Grid height</label>
              <input
                id="size-height"
                type="number"
                min={2}
                value={rules.sizeTarget.height}
                onChange={(event) =>
                  updateGeneratorRules({
                    sizeTarget: {
                      ...rules.sizeTarget,
                      height: Number.parseInt(event.target.value, 10) || 2,
                    },
                  })
                }
              />
            </div>
            <div className="field">
              <label htmlFor="branch-limit">Branch limit</label>
              <input
                id="branch-limit"
                type="number"
                min={0}
                value={rules.branchLimit}
                onChange={(event) => updateGeneratorRules({ branchLimit: Number.parseInt(event.target.value, 10) || 0 })}
              />
            </div>
          </div>

          <div className="field">
            <label htmlFor="theme-filters">Theme filters</label>
            <input
              id="theme-filters"
              value={rules.themeFilters.join(', ')}
              onChange={(event) =>
                updateGeneratorRules({
                  themeFilters: event.target.value
                    .split(',')
                    .map((item) => item.trim())
                    .filter(Boolean),
                })
              }
              placeholder="hell wastes, outdoor, boss"
            />
          </div>

          <div className="checkbox-grid">
            <label className="check-pill">
              <input
                type="checkbox"
                checked={rules.connectorRules.allowDeadEnds}
                onChange={(event) =>
                  updateGeneratorRules({
                    connectorRules: {
                      ...rules.connectorRules,
                      allowDeadEnds: event.target.checked,
                    },
                  })
                }
              />
              Allow dead ends
            </label>
            <label className="check-pill">
              <input
                type="checkbox"
                checked={rules.connectorRules.requireLoop}
                onChange={(event) =>
                  updateGeneratorRules({
                    connectorRules: {
                      ...rules.connectorRules,
                      requireLoop: event.target.checked,
                    },
                  })
                }
              />
              Prefer loops
            </label>
          </div>

          <div className="field">
            <label>Required rooms</label>
            <div className="checkbox-grid">
              {project.roomTemplates.slice(0, 12).map((room) => (
                <label key={room.id} className="check-pill">
                  <input
                    type="checkbox"
                    checked={rules.requiredRoomIds.includes(room.id)}
                    onChange={(event) => {
                      const requiredRoomIds = event.target.checked
                        ? [...rules.requiredRoomIds, room.id]
                        : rules.requiredRoomIds.filter((item) => item !== room.id)
                      updateGeneratorRules({ requiredRoomIds })
                    }}
                  />
                  {room.name}
                </label>
              ))}
            </div>
          </div>

          <div className="button-row">
            <button type="button" className="btn" onClick={generateCandidates}>
              Generate candidates
            </button>
          </div>
        </section>

        <section className="panel">
          <h2>Generated candidates</h2>
          {generatorCandidates.length ? (
            <div className="candidate-list">
              {generatorCandidates.map((candidate, index) => (
                <article
                  key={candidate.id}
                  className={`candidate-card${activeCandidateIndex === index ? ' active' : ''}`}
                >
                  <div className="candidate-title">
                    <strong>{candidate.seed}</strong>
                    <span className="tag">Score {candidate.score}</span>
                  </div>
                  <ul className="helper-list">
                    {candidate.summary.map((line) => (
                      <li key={`${candidate.id}-${line}`}>{line}</li>
                    ))}
                  </ul>
                  <div className="button-row">
                    <button type="button" className="btn-secondary" onClick={() => applyCandidate(index)}>
                      Apply candidate
                    </button>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              No candidates yet. Set your rules and run the generator.
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

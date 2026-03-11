import { useState, useEffect } from 'react'
import { SectionHead } from '../components/shared'
import { LinkIcon, CogIcon, ChartIcon, SearchIcon } from '../components/icons'
import { ForestBanner, KodamaRow, MiyazakiBackground } from '../components/MiyazakiDecor'
import { crossValidatedPatterns, dimensionalScores, narrativeArc } from '../data/loader'

export default function DashboardView() {
  const [name, setName] = useState('')
  const [goal, setGoal] = useState('')
  const [progress, setProgress] = useState(0)

  const navigate = (view: string) => {
    window.dispatchEvent(new CustomEvent('navigate', { detail: view }))
  }

  // Get narrative phase from synthesis data
  const narrativePhase = narrativeArc?.currentChapter || 'Exploring'

  // Categorize dimensions into Active vs Exploring based on scores
  const dimensionCategories = {
    active: [] as Array<{ name: string; score: number }>,
    exploring: [] as Array<{ name: string; score: number }>,
  }

  Object.entries(dimensionalScores).forEach(([dimension, data]) => {
    const score = data.score || 0
    const item = { name: dimension, score }
    // Dimensions with score > 0.5 are "active", others are "exploring"
    if (score > 0.5) {
      dimensionCategories.active.push(item)
    } else {
      dimensionCategories.exploring.push(item)
    }
  })

  // Get recent patterns (first 4 most confident)
  const recentPatterns = crossValidatedPatterns
    .slice(0, 4)
    .map(p => ({
      id: p.id,
      label: p.label,
      confidence: p.confidence,
      dimension: p.dimension,
    }))

  useEffect(() => {
    let p = 0
    if (name) p += 50
    if (goal) p += 50
    setProgress(p)
  }, [name, goal])

  return (
    <>
      <MiyazakiBackground />

      <div
        style={{
          position: 'relative',
          zIndex: 1,
          maxWidth: '38rem',
          margin: '0 auto',
          padding: '3rem 1.25rem 4rem',
        }}
      >
        {/* Top greeting with name + narrative phase */}
        {name && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '2rem',
              padding: '1.25rem 1.4rem',
              background: 'linear-gradient(135deg, rgba(255, 240, 220, 0.6), rgba(245, 237, 224, 0.8))',
              border: '1px solid var(--line)',
              borderRadius: '14px',
            }}
          >
            <div>
              <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--ink-faint)', fontWeight: 500, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
                Ciao
              </p>
              <p style={{ margin: 0, fontSize: '1.35rem', fontWeight: 700, color: 'var(--ink)' }}>
                {name} <span style={{ fontSize: '1.2rem' }}>✦</span>
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ margin: 0, fontSize: '0.74rem', color: 'var(--ink-faint)', fontWeight: 500, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
                Current phase
              </p>
              <p style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: 'var(--accent)' }}>
                {narrativePhase}
              </p>
            </div>
          </div>
        )}

        <ForestBanner />

        <SectionHead
          title="Your dashboard"
          subtitle="Personalize your space, then pick a quick action to begin"
        />

        {/* Profile progress */}
        <div style={{ marginTop: '1.5rem', marginBottom: '2rem' }}>
          <div style={{ height: '4px', borderRadius: '999px', background: 'var(--line)', overflow: 'hidden' }}>
            <div
              style={{
                height: '100%',
                width: `${progress}%`,
                background: 'linear-gradient(90deg, var(--accent), #d4622a)',
                borderRadius: '999px',
              }}
            />
          </div>
          <p style={{ marginTop: '0.4rem', fontSize: '0.7rem', color: 'var(--ink-faint)', letterSpacing: '0.1em' }}>
            Profile {progress}% complete
          </p>
        </div>

        {/* Inputs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem', marginBottom: '2.25rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
            <label style={{ fontSize: '0.69rem', fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--ink-faint)' }}>
              Name
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              style={{ width: '100%' }}
              placeholder="What should we call you?"
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
            <label style={{ fontSize: '0.69rem', fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--ink-faint)' }}>
              Today's goal
            </label>
            <input
              type="text"
              value={goal}
              onChange={e => setGoal(e.target.value)}
              style={{ width: '100%' }}
              placeholder="E.g. analyze my conversations, explore archetypes…"
            />
          </div>
        </div>

        {/* Quick actions */}
        <div style={{ marginBottom: '0.5rem' }}>
          <p style={{ fontSize: '0.69rem', fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--ink-faint)', marginBottom: '0.85rem' }}>
            Quick actions
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.65rem' }}>
            <MenuCard icon={<LinkIcon />}   label="Connect data"     sub="Link sources"         onClick={() => navigate('sources')}  />
            <MenuCard icon={<CogIcon />}    label="Run pipeline"     sub="Extract & synthesize" onClick={() => navigate('sources')}  />
            <MenuCard icon={<ChartIcon />}  label="View overview"    sub="System map"           onClick={() => navigate('overview')} />
            <MenuCard icon={<SearchIcon />} label="Explore patterns" sub="Behavioral signals"   onClick={() => navigate('patterns')} />
          </div>
        </div>

        {/* Kodama row */}
        <KodamaRow />

        {/* Dimension Cards: Active vs Exploring */}
        {name && (
          <div style={{ marginTop: '2.5rem', marginBottom: '2.5rem' }}>
            <p style={{ fontSize: '0.69rem', fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--ink-faint)', marginBottom: '1rem' }}>
              Your dimensions
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
              {/* Active Dimensions Card */}
              <div
                style={{
                  padding: '1.25rem 1.4rem',
                  background: 'var(--paper-strong)',
                  border: '1px solid var(--line)',
                  borderRadius: '14px',
                  boxShadow: 'var(--shadow-card)',
                }}
              >
                <p style={{ margin: '0 0 0.6rem 0', fontSize: '0.74rem', fontWeight: 600, color: 'var(--accent)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                  Active ({dimensionCategories.active.length})
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {dimensionCategories.active.slice(0, 3).map(dim => (
                    <div key={dim.name} style={{ fontSize: '0.82rem', color: 'var(--ink)', lineHeight: 1.4 }}>
                      <span style={{ fontWeight: 500 }}>{dim.name}</span>
                      <br />
                      <span style={{ fontSize: '0.72rem', color: 'var(--ink-soft)' }}>
                        {(dim.score * 100).toFixed(0)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Exploring Dimensions Card */}
              <div
                style={{
                  padding: '1.25rem 1.4rem',
                  background: 'var(--paper-strong)',
                  border: '1px solid var(--line)',
                  borderRadius: '14px',
                  boxShadow: 'var(--shadow-card)',
                }}
              >
                <p style={{ margin: '0 0 0.6rem 0', fontSize: '0.74rem', fontWeight: 600, color: 'var(--ink-faint)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                  Exploring ({dimensionCategories.exploring.length})
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {dimensionCategories.exploring.slice(0, 3).map(dim => (
                    <div key={dim.name} style={{ fontSize: '0.82rem', color: 'var(--ink-soft)', lineHeight: 1.4 }}>
                      <span style={{ fontWeight: 500 }}>{dim.name}</span>
                      <br />
                      <span style={{ fontSize: '0.72rem', color: 'var(--ink-faint)' }}>
                        {(dim.score * 100).toFixed(0)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Recent Patterns List */}
        {name && recentPatterns.length > 0 && (
          <div style={{ marginTop: '2.5rem' }}>
            <p style={{ fontSize: '0.69rem', fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--ink-faint)', marginBottom: '1rem' }}>
              Pattern elaborations
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {recentPatterns.map(pattern => (
                <button
                  key={pattern.id}
                  onClick={() => navigate('patterns')}
                  style={{
                    padding: '1rem 1.25rem',
                    background: 'var(--paper-strong)',
                    border: '1px solid var(--line)',
                    borderRadius: '10px',
                    textAlign: 'left',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                  onMouseEnter={e => {
                    const el = e.currentTarget as HTMLButtonElement
                    el.style.boxShadow = 'var(--shadow-hover)'
                    el.style.background = 'rgba(255, 240, 220, 0.5)'
                  }}
                  onMouseLeave={e => {
                    const el = e.currentTarget as HTMLButtonElement
                    el.style.boxShadow = 'var(--shadow-card)'
                    el.style.background = 'var(--paper-strong)'
                  }}
                >
                  <div>
                    <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 500, color: 'var(--ink)' }}>
                      {pattern.label}
                    </p>
                    <p style={{ margin: '0.35rem 0 0 0', fontSize: '0.74rem', color: 'var(--ink-faint)' }}>
                      {pattern.dimension}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--accent)' }}>
                      {(pattern.confidence * 100).toFixed(0)}%
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  )
}

function MenuCard({
  label,
  sub,
  icon,
  onClick,
}: {
  label: string
  sub?: string
  icon?: React.ReactNode
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        padding: '1rem 1.1rem',
        background: 'var(--paper-strong)',
        border: '1px solid var(--line)',
        borderRadius: '14px',
        boxShadow: 'var(--shadow-card)',
        cursor: 'pointer',
        textAlign: 'left',
        width: '100%',
        gap: '0.5rem',
      }}
      onMouseEnter={e => {
        const el = e.currentTarget as HTMLButtonElement
        el.style.boxShadow = 'var(--shadow-hover)'
        el.style.transform = 'translateY(-2px)'
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLButtonElement
        el.style.boxShadow = 'var(--shadow-card)'
        el.style.transform = 'translateY(0)'
      }}
    >
      {icon && (
        <span style={{ color: 'var(--accent)', opacity: 0.8, display: 'block', lineHeight: 1 }}>
          {icon}
        </span>
      )}
      <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--ink)', display: 'block' }}>
        {label}
      </span>
      {sub && (
        <span style={{ marginTop: '0.15rem', fontSize: '0.74rem', color: 'var(--ink-faint)', display: 'block' }}>
          {sub}
        </span>
      )}
    </button>
  )
}

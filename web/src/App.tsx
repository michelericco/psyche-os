import { useState, useEffect, lazy, Suspense } from 'react'
import type { ViewId } from './data/types'

const DashboardView = lazy(() => import('./views/DashboardView'))
const OnboardingView = lazy(() => import('./views/OnboardingView'))
const OverviewView = lazy(() => import('./views/OverviewView'))
const GenomeView = lazy(() => import('./views/GenomeView'))
const PatternsView = lazy(() => import('./views/PatternsView'))
const ArchetypesView = lazy(() => import('./views/ArchetypesView'))
const DimensionsView = lazy(() => import('./views/DimensionsView'))
const PotentialsView = lazy(() => import('./views/PotentialsView'))
const NarrativeView = lazy(() => import('./views/NarrativeView'))
const InsightsView = lazy(() => import('./views/InsightsView'))
const IQView = lazy(() => import('./views/IQView'))
const NeurodivergenceView = lazy(() => import('./views/NeurodivergenceView'))
const SemanticMapView = lazy(() => import('./views/SemanticMapView'))
const IntegrationView = lazy(() => import('./views/IntegrationView'))
const ProgressDiaryView = lazy(() => import('./views/ProgressDiaryView'))
const TimelineView      = lazy(() => import('./views/TimelineView'))

const NAV_ITEMS: { id: ViewId; label: string; note: string }[] = [
  { id: 'dashboard', label: 'Dashboard', note: 'Your personal home & next steps' },
  { id: 'sources', label: 'Setup', note: 'Connect data & run pipeline' },
  { id: 'overview', label: 'Overview', note: 'System map and structure' },
  { id: 'genome', label: 'Genome', note: 'Cognitive primitives and metabolism' },
  { id: 'dimensions', label: 'Dimensions', note: 'Six-axis profile' },
  { id: 'patterns', label: 'Patterns', note: 'Cross-validated behavioral signals' },
  { id: 'archetypes', label: 'Archetypes', note: 'Dominant psychic figures' },
  { id: 'potentials', label: 'Potentials', note: 'Latent capacities and constraints' },
  { id: 'narrative', label: 'Narrative', note: 'Story arc and current tension' },
  { id: 'insights', label: 'Insights', note: 'Development vectors' },
  { id: 'iq', label: 'IQ Estimate', note: 'Behavioral intelligence estimate' },
  { id: 'neurodivergence', label: 'Neurodivergence', note: 'Evidence-based screening, not diagnosis' },
  { id: 'map', label: 'Semantic Map', note: 'Relationship graph and vector search' },
  { id: 'integration', label: 'Integration', note: 'Export, prompts, and MCP bridge' },
  { id: 'diary',     label: 'Progress Diary', note: 'Daily progress tracking and reflections' },
  { id: 'timeline',  label: 'Timeline',       note: 'Stratification drift across pipeline runs' },
]

function App() {
  const [activeView, setActiveView] = useState<ViewId>('sources')
  const activeItem = NAV_ITEMS.find(item => item.id === activeView) ?? NAV_ITEMS[0]

  // allow views like DashboardView to request navigation without prop drilling
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<string>).detail
      if (typeof detail === 'string' && NAV_ITEMS.some(i => i.id === detail)) {
        setActiveView(detail as ViewId)
      }
    }
    window.addEventListener('navigate', handler)
    return () => window.removeEventListener('navigate', handler)
  }, [])

  const isDashboard = activeView === 'dashboard'
  // on dashboard we hide sidebar and center content; allow the panel to grow

  return (
    <div className="app-shell">
      {!isDashboard && (
        <aside className="app-sidebar">
          <div className="app-sidebar-inner">
            <header>
              <div className="app-kicker">Digital psyche operating system</div>
              <h1 className="app-brand">
                <span className="app-brand-accent">PSYCHE</span>
                <span className="app-brand-divider">/</span>
                <span>OS</span>
              </h1>
              <p className="app-brand-note">
                "Until you make the unconscious conscious,
                <br />
                it will direct your life and you will call it fate."
                <span className="app-brand-attribution">C.G. Jung</span>
              </p>
            </header>

            <nav className="app-nav" aria-label="Primary">
              {NAV_ITEMS.map((item, index) => (
                <button
                  key={item.id}
                  onClick={() => setActiveView(item.id)}
                  className={`app-nav-button ${activeView === item.id ? 'is-active' : ''}`}
                >
                  <span className="app-nav-index">{String(index + 1).padStart(2, '0')}</span>
                  <span className="app-nav-copy">
                    <span className="app-nav-label">{item.label}</span>
                    <span className="app-nav-note">{item.note}</span>
                  </span>
                </button>
              ))}
            </nav>
          </div>
        </aside>
      )}

      <main className={`app-main${isDashboard ? ' dashboard-mode' : ''}`}>
        {!isDashboard && (
          <header className="app-main-header">
            <div className="app-main-header-inner">
              <div>
                <div className="app-kicker">Current view</div>
                <h2 className="app-view-title">{activeItem.label}</h2>
              </div>
              <p className="app-view-note">{activeItem.note}</p>
            </div>
          </header>
        )}

        <div className="app-main-frame">
          <Suspense fallback={<div className="app-loading">Loading section</div>}>
            <section className="view-shell">
              {activeView === 'dashboard' && <DashboardView />}
              {activeView === 'sources' && <OnboardingView />}
              {activeView === 'overview' && <OverviewView />}
              {activeView === 'genome' && <GenomeView />}
              {activeView === 'patterns' && <PatternsView />}
              {activeView === 'archetypes' && <ArchetypesView />}
              {activeView === 'dimensions' && <DimensionsView />}
              {activeView === 'potentials' && <PotentialsView />}
              {activeView === 'narrative' && <NarrativeView />}
              {activeView === 'insights' && <InsightsView />}
              {activeView === 'iq' && <IQView />}
              {activeView === 'neurodivergence' && <NeurodivergenceView />}
              {activeView === 'map' && <SemanticMapView />}
              {activeView === 'integration' && <IntegrationView />}
              {activeView === 'diary'     && <ProgressDiaryView />}
              {activeView === 'timeline'  && <TimelineView />}
            </section>
          </Suspense>
        </div>
      </main>
    </div>
  )
}

export default App

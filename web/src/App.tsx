import { useState, useEffect, lazy, Suspense } from 'react'
import type { ViewId } from './data/types'
import { useI18n } from './i18n'

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
const SensorialView = lazy(() => import('./views/SensorialView'))
const ContactView = lazy(() => import('./views/ContactView'))

const NAV_ITEMS: { id: ViewId; key: string }[] = [
  { id: 'dashboard', key: 'dashboard' },
  { id: 'sources', key: 'sources' },
  { id: 'overview', key: 'overview' },
  { id: 'genome', key: 'genome' },
  { id: 'dimensions', key: 'dimensions' },
  { id: 'patterns', key: 'patterns' },
  { id: 'archetypes', key: 'archetypes' },
  { id: 'potentials', key: 'potentials' },
  { id: 'narrative', key: 'narrative' },
  { id: 'insights', key: 'insights' },
  { id: 'iq', key: 'iq' },
  { id: 'neurodivergence', key: 'neurodivergence' },
  { id: 'map', key: 'map' },
  { id: 'integration', key: 'integration' },
  { id: 'diary', key: 'diary' },
  { id: 'timeline', key: 'timeline' },
  { id: 'sensorial', key: 'Sensorial' },
  { id: 'sensOrial', key: 'Contact' },
]

function App() {
  const { t, language, setLanguage, languages, isRTL } = useI18n()
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
    <div className={`app-shell${isDashboard ? ' is-dashboard' : ''}`} dir={isRTL ? 'rtl' : 'ltr'} style={{ fontFamily: '"Inter var", "SF Pro Display", "Segoe UI", "Helvetica Neue", Arial, sans-serif', fontFeatureSettings: '"ss01" on, "ss02" on', letterSpacing: '0.01em', fontVariationSettings: '"wght" 500, "slnt" 0' }}>
      {!isDashboard && (
        <aside className="app-sidebar">
          <div className="app-sidebar-inner">
            <header>
              <div className="app-kicker">{t('app.kicker')}</div>
              <h1 className="app-brand">
                <span className="app-brand-accent">PSYCHE</span>
                <span className="app-brand-divider">/</span>
                <span>OS</span>
              </h1>
              <p className="app-brand-note">
                "{t('app.quote')}"
                <span className="app-brand-attribution">C.G. Jung</span>
              </p>
              <div className="app-language-wrap">
                <select
                  className="app-language-select"
                  value={language}
                  onChange={e => setLanguage(e.target.value as typeof language)}
                  aria-label={t('app.language')}
                >
                  {languages.map(lang => (
                    <option key={lang.code} value={lang.code}>
                      {lang.label}
                    </option>
                  ))}
                </select>
              </div>
            </header>

            <nav className="app-nav" aria-label={t('app.primaryNavigation')}>
              {NAV_ITEMS.map((item, index) => (
                <button
                  key={item.id}
                  onClick={() => setActiveView(item.id)}
                  className={`app-nav-button ${activeView === item.id ? 'is-active' : ''}`}
                  style={{
                    fontFamily: '"Inter var", "SF Pro Display", "Segoe UI", "Helvetica Neue", Arial, sans-serif',
                    fontVariationSettings: '"wght" 600, "slnt" 0',
                    fontSize: '1.08rem',
                    letterSpacing: '0.01em',
                    transition: 'all 0.22s cubic-bezier(.4,1.4,.6,1)',
                    color: activeView === item.id ? 'var(--accent)' : 'var(--ink)',
                    background: activeView === item.id ? 'rgba(0,0,0,0.04)' : 'transparent',
                    borderRadius: '1.2em',
                    boxShadow: activeView === item.id ? '0 2px 12px 0 rgba(0,0,0,0.07)' : 'none',
                    fontWeight: activeView === item.id ? 700 : 500,
                    transform: activeView === item.id ? 'scale(1.06)' : 'scale(1)',
                  }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.09)'}
                  onMouseLeave={e => e.currentTarget.style.transform = activeView === item.id ? 'scale(1.06)' : 'scale(1)'}
                >
                  <span className="app-nav-index" style={{ opacity: 0.7, fontWeight: 400 }}>{String(index + 1).padStart(2, '0')}</span>
                  <span className="app-nav-copy">
                    <span className="app-nav-label" style={{ letterSpacing: '0.01em', fontWeight: 600 }}>{t(`app.nav.${item.key}.label`)}</span>
                    <span className="app-nav-note" style={{ fontWeight: 400, opacity: 0.6 }}>{t(`app.nav.${item.key}.note`)}</span>
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
                <div className="app-kicker">{t('app.currentView')}</div>
                <h2 className="app-view-title">{t(`app.nav.${activeItem.key}.label`)}</h2>
              </div>
              <p className="app-view-note">{t(`app.nav.${activeItem.key}.note`)}</p>
            </div>
          </header>
        )}

        <div className="app-main-frame">
          <Suspense fallback={<div className="app-loading">{t('app.loading')}</div>}>
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
              {activeView === 'sensorial' && <SensorialView />}
              {activeView === 'sensOrial' && <ContactView />}
            </section>
          </Suspense>
        </div>
      </main>
    </div>
  )
}

export default App

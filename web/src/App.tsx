import { useState, useEffect, useMemo, useRef, lazy, Suspense } from 'react'
import type { ViewId } from './data/types'
import { useI18n } from './i18n'

// ── Daily check-in ──────────────────────────────────────────────────

const CHECKIN_MOODS = ['energia', 'umore', 'focus', 'corpo', 'connessione'] as const
type MoodKey = typeof CHECKIN_MOODS[number]

function DailyCheckIn({ onDismiss }: { onDismiss: () => void }) {
  const { t } = useI18n()
  const [values, setValues] = useState<Record<MoodKey, number>>({
    energia: 5, umore: 5, focus: 5, corpo: 5, connessione: 5,
  })
  const [submitted, setSubmitted] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)

  const handleSubmit = () => {
    const entry = { date: new Date().toISOString(), values }
    let existing: unknown[] = []
    try { existing = JSON.parse(localStorage.getItem('psyche-checkins') ?? '[]') } catch { /* corrupted */ }
    if (!Array.isArray(existing)) existing = []
    localStorage.setItem('psyche-checkins', JSON.stringify([...existing, entry]))
    localStorage.setItem('psyche-checkin-date', new Date().toDateString())
    setSubmitted(true)
    setTimeout(onDismiss, 1600)
  }

  return (
    <div className="checkin-panel" ref={panelRef} role="dialog" aria-label={t('app.checkin.dialogLabel')}>
      {submitted ? (
        <div className="checkin-thanks">
          <span className="checkin-thanks-icon">✦</span>
          <p>{t('app.checkin.thanks')}</p>
        </div>
      ) : (
        <>
          <div className="checkin-header">
            <span className="checkin-title">{t('app.checkin.title')}</span>
            <button className="checkin-close" onClick={onDismiss} aria-label={t('app.checkin.close')}>×</button>
          </div>
          <div className="checkin-sliders">
            {CHECKIN_MOODS.map((key) => (
              <label key={key} className="checkin-slider-row">
                <span className="checkin-slider-label">{t(`app.checkin.mood.${key}`)}</span>
                <input
                  type="range" min={1} max={10} step={1}
                  value={values[key]}
                  onChange={e => setValues(v => ({ ...v, [key]: Number(e.target.value) }))}
                  className="checkin-slider"
                />
                <span className="checkin-slider-val">{values[key]}</span>
              </label>
            ))}
          </div>
          <button className="checkin-submit" onClick={handleSubmit}>{t('app.checkin.submit')}</button>
        </>
      )}
    </div>
  )
}

function FoxMascot({ activeView }: { activeView: ViewId }) {
  const { t } = useI18n()
  const [reducedMotion, setReducedMotion] = useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReducedMotion(mediaQuery.matches)
    update()
    mediaQuery.addEventListener('change', update)
    return () => mediaQuery.removeEventListener('change', update)
  }, [])

  return (
    <aside className="fox-mascot" aria-live="polite" aria-label={t('app.mascot.label')}>
      <div className={`fox-mascot-avatar${reducedMotion ? ' no-motion' : ''}`} aria-hidden="true">
        <svg width="48" height="48" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 28L20 10L30 24" fill="#D98552" />
          <path d="M52 28L44 10L34 24" fill="#D98552" />
          <ellipse cx="32" cy="36" rx="20" ry="17" fill="#E99C69" />
          <ellipse cx="32" cy="42" rx="11" ry="8" fill="#F9E7D9" />
          <circle cx="24" cy="34" r="2.6" fill="#1F2930" />
          <circle cx="40" cy="34" r="2.6" fill="#1F2930" />
          <path d="M32 37L35 41H29L32 37Z" fill="#1F2930" />
          <path d="M28 44C29.5 45.6 31 46.4 32 46.4C33 46.4 34.5 45.6 36 44" stroke="#1F2930" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      </div>
      <p className="fox-mascot-bubble">{t(`app.mascot.${activeView}`)}</p>
    </aside>
  )
}

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
  { id: 'sensorial', key: 'sensorial' },
  { id: 'contact', key: 'contact' },
]

const NAV_GROUPS: Array<{ key: string; items: ViewId[] }> = [
  { key: 'foundation', items: ['dashboard', 'sources', 'overview'] },
  { key: 'analysis', items: ['genome', 'dimensions', 'patterns', 'archetypes', 'potentials', 'narrative', 'insights', 'iq', 'neurodivergence', 'map'] },
  { key: 'operations', items: ['integration', 'diary', 'timeline', 'sensorial', 'contact'] },
]

function App() {
    // Tema globale (normal, night, swift)
    const [theme, setTheme] = useState<'normal' | 'night' | 'swift'>('normal');
    useEffect(() => {
      document.body.classList.remove('sensorial-theme-normal', 'sensorial-theme-night', 'sensorial-theme-swift');
      document.body.classList.add(`sensorial-theme-${theme}`);
    }, [theme]);
  const { t, language, setLanguage, languages, isRTL } = useI18n()
  const [activeView, setActiveView] = useState<ViewId>(() => {
    const stored = localStorage.getItem('psyche-last-view')
    if (stored && NAV_ITEMS.some(item => item.id === stored)) return stored as ViewId
    return 'sources'
  })
  const [previousView, setPreviousView] = useState<ViewId | null>(() => {
    const stored = localStorage.getItem('psyche-previous-view')
    if (stored && NAV_ITEMS.some(item => item.id === stored)) return stored as ViewId
    return null
  })
  const [commandOpen, setCommandOpen] = useState(false)
  const [commandQuery, setCommandQuery] = useState('')
  const [activeCommandIndex, setActiveCommandIndex] = useState(0)
  const commandInputRef = useRef<HTMLInputElement | null>(null)
  const commandDialogRef = useRef<HTMLDivElement | null>(null)
  const commandTriggerRef = useRef<HTMLButtonElement | null>(null)
  const previouslyFocusedRef = useRef<HTMLElement | null>(null)
  const commandListboxId = 'command-palette-listbox'
  const commandHelpTextId = 'command-palette-help'
  const commandStatusId = 'command-palette-status'
  const activeItem = NAV_ITEMS.find(item => item.id === activeView) ?? NAV_ITEMS[0]

  const navigateToView = (nextView: ViewId) => {
    setActiveView(current => {
      if (current !== nextView) {
        setPreviousView(current)
        localStorage.setItem('psyche-previous-view', current)
      }
      localStorage.setItem('psyche-last-view', nextView)
      return nextView
    })
  }

  const commandItems = useMemo(() => {
    return NAV_ITEMS.map(item => {
      const group = NAV_GROUPS.find(candidate => candidate.items.includes(item.id))
      return {
        id: item.id,
        label: t(`app.nav.${item.key}.label`),
        note: t(`app.nav.${item.key}.note`),
        group: group ? t(`app.navGroup.${group.key}`) : t('app.command.groupDefault'),
      }
    })
  }, [t])

  const filteredCommandItems = useMemo(() => {
    const q = commandQuery.trim().toLowerCase()
    if (!q) return commandItems
    return commandItems.filter(item => {
      const haystack = `${item.label} ${item.note} ${item.group}`.toLowerCase()
      return haystack.includes(q)
    })
  }, [commandItems, commandQuery])

  const visibleCommandItems = filteredCommandItems.slice(0, 10)

  const closeCommandPalette = () => {
    setCommandOpen(false)
    setCommandQuery('')
    setActiveCommandIndex(0)
  }

  const openCommandPalette = () => {
    setCommandOpen(true)
    setActiveCommandIndex(0)
  }

  const activeGroup = NAV_GROUPS.find(group => group.items.includes(activeView))
  const previousItem = previousView ? NAV_ITEMS.find(item => item.id === previousView) : null

  // dark mode
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('psyche-dark-mode')
    if (saved !== null) return saved === 'true'
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  })
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light')
    localStorage.setItem('psyche-dark-mode', String(darkMode))
  }, [darkMode])

  // daily check-in
  const [showCheckIn, setShowCheckIn] = useState<boolean>(() => {
    return localStorage.getItem('psyche-checkin-date') !== new Date().toDateString()
  })

  // allow views like DashboardView to request navigation without prop drilling
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<string>).detail
      if (typeof detail === 'string' && NAV_ITEMS.some(i => i.id === detail)) {
        navigateToView(detail as ViewId)
      }
    }
    window.addEventListener('navigate', handler)
    return () => window.removeEventListener('navigate', handler)
  }, [])

  useEffect(() => {
    if (!commandOpen) return

    previouslyFocusedRef.current = document.activeElement as HTMLElement | null
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    requestAnimationFrame(() => commandInputRef.current?.focus())

    return () => {
      document.body.style.overflow = previousOverflow
      previouslyFocusedRef.current?.focus()
    }
  }, [commandOpen])

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      const isTyping = !!target?.closest('input, textarea, [contenteditable="true"]')

      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        openCommandPalette()
        return
      }

      if (!isTyping && !commandOpen && event.key === '/') {
        event.preventDefault()
        openCommandPalette()
        return
      }

      if (event.key === 'Escape') {
        closeCommandPalette()
        return
      }

      if (!commandOpen) return

      if (event.key === 'ArrowDown') {
        event.preventDefault()
        setActiveCommandIndex((current) => (visibleCommandItems.length ? (current + 1) % visibleCommandItems.length : 0))
        return
      }

      if (event.key === 'ArrowUp') {
        event.preventDefault()
        setActiveCommandIndex((current) => (visibleCommandItems.length ? (current - 1 + visibleCommandItems.length) % visibleCommandItems.length : 0))
        return
      }

      if (event.key === 'Home') {
        event.preventDefault()
        setActiveCommandIndex(0)
        return
      }

      if (event.key === 'End') {
        event.preventDefault()
        setActiveCommandIndex(Math.max(visibleCommandItems.length - 1, 0))
        return
      }

      if (event.key === 'Enter' && visibleCommandItems[activeCommandIndex]) {
        event.preventDefault()
        navigateToView(visibleCommandItems[activeCommandIndex].id)
        closeCommandPalette()
        return
      }

      if (event.key === 'Tab') {
        const focusables = commandDialogRef.current?.querySelectorAll<HTMLElement>(
          'input, button, [href], [tabindex]:not([tabindex="-1"])'
        )
        if (!focusables || focusables.length === 0) return

        const first = focusables[0]
        const last = focusables[focusables.length - 1]

        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault()
          last.focus()
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault()
          first.focus()
        }
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [activeCommandIndex, commandOpen, visibleCommandItems])

  useEffect(() => {
    if (activeCommandIndex >= visibleCommandItems.length) {
      setActiveCommandIndex(0)
    }
  }, [activeCommandIndex, visibleCommandItems.length])

  const isDashboard = activeView === 'dashboard'
  // on dashboard we hide sidebar and center content; allow the panel to grow

  return (
    <div className={`app-shell${isDashboard ? ' is-dashboard' : ''}`} dir={isRTL ? 'rtl' : 'ltr'}>
      <FoxMascot activeView={activeView} />
      {showCheckIn && <DailyCheckIn onDismiss={() => {
        localStorage.setItem('psyche-checkin-date', new Date().toDateString())
        setShowCheckIn(false)
      }} />}
      {!isDashboard && <a href="#main-content" className="skip-link">{t('app.skipToContent')}</a>}
      {!isDashboard && (
        <aside className="app-sidebar">
          <div className="app-sidebar-inner">
            <header>
              <div className="checkin-top-row">
                <div className="app-kicker">{t('app.kicker')}</div>
                  <button
                    className="material-button dark-toggle"
                    onClick={() => setDarkMode(d => !d)}
                    aria-label={darkMode ? t('app.theme.switchToLight') : t('app.theme.switchToDark')}
                    title={darkMode ? t('app.theme.light') : t('app.theme.dark')}
                    style={{marginRight: '0.5rem'}}>
                    {darkMode ? '☀' : '◑'}
                  </button>
                  <select
                    className="material-input app-header-chip ml-2"
                    value={theme}
                    onChange={e => setTheme(e.target.value as 'normal' | 'night' | 'swift')}
                    aria-label="Seleziona tema globale"
                    style={{width: 'auto', minWidth: '7rem'}}>
                    <option value="normal">Normale</option>
                    <option value="night">Night</option>
                    <option value="swift">Swift (Apple)</option>
                  </select>
              </div>
              <h1 className="app-brand">
                <span
                  className="app-brand-accent psycheos-anim"
                  tabIndex={0}
                  onClick={() => alert('La tua psiche è unica. Esplora!')}
                  onTouchStart={() => alert('La tua psiche è unica. Esplora!')}
                  style={{ cursor: 'pointer', transition: 'color 320ms, text-shadow 320ms' }}
                  onMouseEnter={e => e.currentTarget.style.textShadow = '0 2px 18px #89aebd88'}
                  onMouseLeave={e => e.currentTarget.style.textShadow = 'none'}
                >PSYCHE</span>
                <span className="app-brand-divider psycheos-anim">/</span>
                <span className="psycheos-anim">OS</span>
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
              {NAV_GROUPS.map((group) => (
                <section key={group.key} className="app-nav-group" aria-labelledby={`nav-group-${group.key}`}>
                  <h3 id={`nav-group-${group.key}`} className="app-nav-group-title">
                    {t(`app.navGroup.${group.key}`)}
                  </h3>
                  {group.items.map((viewId) => {
                    const item = NAV_ITEMS.find((candidate) => candidate.id === viewId)
                    if (!item) return null

                    const note = t(`app.nav.${item.key}.note`)
                    const globalIndex = NAV_ITEMS.findIndex((candidate) => candidate.id === item.id) + 1

                    return (
                      <button
                        key={item.id}
                        onClick={() => navigateToView(item.id)}
                        className={`app-nav-button ${activeView === item.id ? 'is-active' : ''}`}
                        aria-current={activeView === item.id ? 'page' : undefined}
                        aria-label={note ? `${t(`app.nav.${item.key}.label`)} - ${note}` : t(`app.nav.${item.key}.label`)}
                      >
                        <span className="app-nav-index">{String(globalIndex).padStart(2, '0')}</span>
                        <span className="app-nav-copy">
                          <span className="app-nav-label">{t(`app.nav.${item.key}.label`)}</span>
                          <span className="app-nav-note">{note}</span>
                        </span>
                      </button>
                    )
                  })}
                </section>
              ))}
            </nav>
          </div>
        </aside>
      )}

      <main id="main-content" className={`app-main${isDashboard ? ' dashboard-mode' : ''}`}>
          {!isDashboard && (
            <header className="app-main-header material-card material-shadow" style={{marginBottom: '1.2rem'}}>
              <div className="app-main-header-inner">
                <div className="app-header-top">
                  <p className="app-breadcrumb">
                    <span>{activeGroup ? t(`app.navGroup.${activeGroup.key}`) : t('app.view')}</span>
                    <span>/</span>
                    <span>{t(`app.nav.${activeItem.key}.label`)}</span>
                  </p>
                  <div className="app-header-actions">
                    {previousItem && previousItem.id !== activeView && (
                      <button
                        type="button"
                        className="material-button app-header-chip"
                        onClick={() => navigateToView(previousItem.id)}
                      >
                        {t('app.resume')}: {t(`app.nav.${previousItem.key}.label`)}
                      </button>
                    )}
                    <button
                      type="button"
                      className="material-button app-header-chip"
                      onClick={openCommandPalette}
                      aria-label={t('app.command.open')}
                      ref={commandTriggerRef}
                    >
                      {t('app.command.searchShortcut')}
                    </button>
                  </div>
                </div>
                <div>
                  <div className="app-kicker">{t('app.currentView')}</div>
                  <h2 className="app-view-title">{t(`app.nav.${activeItem.key}.label`)}</h2>
                </div>
                <p className="app-view-note">{t(`app.nav.${activeItem.key}.note`)}</p>
              </div>
            </header>
          )}

        <div className="app-main-frame">
            <Suspense fallback={<div className="app-loading material-card material-shadow">{t('app.loading')}</div>}>
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
                {activeView === 'contact'   && <ContactView />}
              </section>
            </Suspense>
        </div>
      </main>

      {commandOpen && (
        <div className="command-palette-backdrop" onClick={closeCommandPalette}>
          <div
            className="command-palette"
            role="dialog"
            aria-label={t('app.command.dialogLabel')}
            aria-modal="true"
            onClick={e => e.stopPropagation()}
            ref={commandDialogRef}
          >
            <input
              className="command-palette-input"
              type="search"
              placeholder={t('app.command.placeholder')}
              value={commandQuery}
              onChange={e => setCommandQuery(e.target.value)}
              role="combobox"
              aria-haspopup="listbox"
              aria-expanded={commandOpen}
              aria-controls={commandListboxId}
              aria-autocomplete="list"
              aria-activedescendant={visibleCommandItems[activeCommandIndex] ? `command-option-${visibleCommandItems[activeCommandIndex].id}` : undefined}
              aria-describedby={`${commandHelpTextId} ${commandStatusId}`}
              ref={commandInputRef}
            />
            <p id={commandHelpTextId} className="sr-only">{t('app.command.help')}</p>
            <p id={commandStatusId} className="sr-only" aria-live="polite">
              {t('app.command.resultsCount').replace('{count}', String(visibleCommandItems.length))}
            </p>
            <div className="command-palette-list" role="listbox" id={commandListboxId} aria-label={t('app.command.results')}>
              {visibleCommandItems.map((item, index) => (
                <button
                  key={item.id}
                  className="command-palette-item"
                  id={`command-option-${item.id}`}
                  role="option"
                  aria-selected={index === activeCommandIndex}
                  tabIndex={-1}
                  onClick={() => {
                    navigateToView(item.id)
                    closeCommandPalette()
                  }}
                  onMouseEnter={() => setActiveCommandIndex(index)}
                >
                  <span className="command-palette-item-main">{item.label}</span>
                  <span className="command-palette-item-meta">{item.group} • {item.note}</span>
                </button>
              ))}
              {visibleCommandItems.length === 0 && (
                <p className="command-palette-empty">{t('app.command.noResults')}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App

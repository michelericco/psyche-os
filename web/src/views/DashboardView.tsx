import { useEffect, useMemo, useState } from 'react'
import { SectionHead } from '../components/shared'
import { LinkIcon, CogIcon, ChartIcon, SearchIcon } from '../components/icons'
import { crossValidatedPatterns, dimensionalScores, narrativeArc } from '../data/loader'
import { useI18n } from '../i18n'

// ── Streak helpers ───────────────────────────────────────────────────

function getWeekKey(): string {
  const now = new Date()
  const year = now.getFullYear()
  const startOfYear = new Date(year, 0, 1)
  const week = Math.ceil(((now.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7)
  return `${year}-W${week}`
}

function computeStreak(): number {
  const stored = localStorage.getItem('psyche-visit-dates')
  let dates: string[] = []
  try { dates = stored ? JSON.parse(stored) : [] } catch { /* corrupted */ }
  if (!Array.isArray(dates)) dates = []
  const today = new Date().toDateString()
  if (!dates.includes(today)) {
    dates.push(today)
    localStorage.setItem('psyche-visit-dates', JSON.stringify(dates))
  }
  const unique = [...new Set(dates)].sort().reverse()
  let streak = 0
  const cursor = new Date()
  for (const d of unique) {
    const expected = cursor.toDateString()
    if (d === expected) {
      streak++
      cursor.setDate(cursor.getDate() - 1)
    } else {
      break
    }
  }
  return streak
}

function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)))
}

function getDayKey(date = new Date()): string {
  return date.toISOString().slice(0, 10)
}

function parseStoredJson<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback
  try {
    const parsed: unknown = JSON.parse(raw)
    // Must match the "shape" of the fallback (object vs array)
    if (typeof parsed !== typeof fallback) return fallback
    if (Array.isArray(fallback) !== Array.isArray(parsed)) return fallback
    return parsed as T
  } catch {
    return fallback
  }
}

function mergeStageHistory(
  current: StageHistoryStore,
  stages: Array<{ id: string; score: number }>,
  today: string,
): StageHistoryStore {
  let changed = false
  const next: StageHistoryStore = { ...current }

  for (const stage of stages) {
    const list = [...(next[stage.id] ?? [])]
    const existingIndex = list.findIndex((point) => point.day === today)

    if (existingIndex >= 0) {
      if (list[existingIndex].score !== stage.score) {
        list[existingIndex] = { day: today, score: stage.score }
        changed = true
      }
    } else {
      list.push({ day: today, score: stage.score })
      changed = true
    }

    next[stage.id] = list.slice(-30)
  }

  return changed ? next : current
}

function computeTrendDelta(history: StageHistoryPoint[]): number {
  if (history.length < 4) return 0
  const recent = history.slice(-3)
  const previous = history.slice(-6, -3)
  if (previous.length === 0) return 0

  const recentAvg = recent.reduce((sum, point) => sum + point.score, 0) / recent.length
  const previousAvg = previous.reduce((sum, point) => sum + point.score, 0) / previous.length
  return Math.round((recentAvg - previousAvg) * 10) / 10
}

function getStageStatus(score: number, target: number, trendDelta: number): StageStatus {
  if (score < target - 8) return 'reinforce'
  if (trendDelta >= 2.5) return 'growing'
  return 'stable'
}

function countRecentCheckins(days: number): number {
  const raw = localStorage.getItem('psyche-checkins')
  let items: Array<{ date?: string }> = []
  try { items = raw ? JSON.parse(raw) : [] } catch { /* corrupted */ }
  if (!Array.isArray(items)) items = []
  const now = Date.now()
  const windowMs = days * 24 * 60 * 60 * 1000
  return items.filter((item) => {
    if (!item?.date) return false
    const ts = new Date(item.date).getTime()
    if (Number.isNaN(ts)) return false
    return now - ts <= windowMs
  }).length
}

function countRecentVisits(days: number): number {
  const raw = localStorage.getItem('psyche-visit-dates')
  let items: string[] = []
  try { items = raw ? JSON.parse(raw) : [] } catch { /* corrupted */ }
  if (!Array.isArray(items)) items = []
  const now = Date.now()
  const windowMs = days * 24 * 60 * 60 * 1000
  const unique = [...new Set(items)]
  return unique.filter((item) => {
    const ts = new Date(item).getTime()
    if (Number.isNaN(ts)) return false
    return now - ts <= windowMs
  }).length
}

type DimensionStat = { name: string; score: number }
type StageStatus = 'growing' | 'stable' | 'reinforce'
type StageHistoryPoint = { day: string; score: number }
type StageTargets = Record<string, number>
type StageHistoryStore = Record<string, StageHistoryPoint[]>
type TraceabilityStage = {
  id: string
  label: string
  score: number
  evidence: string
  suggestion: string
  view: string
  target: number
  status: StageStatus
  trendDelta: number
  history: StageHistoryPoint[]
}

const STAGE_COMPARE_COLORS: Record<string, string> = {
  observe: '#4285f4',
  understand: '#a142f4',
  act: '#34a853',
  verify: '#fbbc05',
}

export default function DashboardView() {
  const { t } = useI18n()
  const [name, setName] = useState('')
  const [goal, setGoal] = useState('')
  const [intention, setIntention] = useState<string>(() => {
    const weekKey = `psyche-intention-${getWeekKey()}`
    return localStorage.getItem(weekKey) ?? ''
  })
  const [intentionSaved, setIntentionSaved] = useState(false)
  const [streak] = useState<number>(computeStreak)
  const [stageTargets, setStageTargets] = useState<StageTargets>(() => {
    return parseStoredJson<StageTargets>(localStorage.getItem('psyche-traceability-targets'), {
      observe: 65,
      understand: 70,
      act: 68,
      verify: 64,
    })
  })
  const [stageHistory] = useState<StageHistoryStore>(() => {
    return parseStoredJson<StageHistoryStore>(localStorage.getItem('psyche-traceability-history'), {})
  })
  const [trendWindowDays, setTrendWindowDays] = useState<7 | 30>(7)
  const [selectedStageId, setSelectedStageId] = useState<string>('observe')
  const [glassMode, setGlassMode] = useState<'soft' | 'intense'>(() => {
    const saved = localStorage.getItem('psyche-dashboard-glass')
    return saved === 'intense' ? 'intense' : 'soft'
  })

  useEffect(() => {
    localStorage.setItem('psyche-dashboard-glass', glassMode)
  }, [glassMode])

  useEffect(() => {
    localStorage.setItem('psyche-traceability-targets', JSON.stringify(stageTargets))
  }, [stageTargets])

  const saveIntention = () => {
    const weekKey = `psyche-intention-${getWeekKey()}`
    localStorage.setItem(weekKey, intention)
    setIntentionSaved(true)
    setTimeout(() => setIntentionSaved(false), 2000)
  }

  const navigate = (view: string) => {
    window.dispatchEvent(new CustomEvent('navigate', { detail: view }))
  }

  const stats = useMemo(() => {
    const dimensions = Object.entries(dimensionalScores).map(([k, v]) => ({
      name: k,
      score: v.score ?? 0,
    }))

    const active = dimensions.filter(d => d.score >= 0.5)
    const exploring = dimensions.filter(d => d.score < 0.5)
    const patterns = crossValidatedPatterns.slice(0, 4)
    const progress = (name ? 50 : 0) + (goal ? 50 : 0)

    return {
      active,
      exploring,
      patterns,
      progress,
      chapter: narrativeArc?.currentChapter ?? t('dashboard.stat.narrative'),
    }
  }, [name, goal, t])

  const baseStages = useMemo(() => {
    const checkins7d = countRecentCheckins(7)
    const visits14d = countRecentVisits(14)
    const hasIntention = intention.trim().length > 0

    const observeScore = clampScore((checkins7d / 7) * 70 + Math.min(streak, 7) * 4)
    const understandScore = clampScore((stats.patterns.length / 4) * 55 + (stats.active.length / 6) * 45)
    const actScore = clampScore((stats.progress / 100) * 60 + (hasIntention ? 25 : 0) + Math.min(streak, 5) * 3)
    const verifyScore = clampScore((visits14d / 14) * 60 + (checkins7d / 7) * 40)

    return [
      {
        id: 'observe',
        label: t('dashboard.trace.observe'),
        score: observeScore,
        evidence: t('dashboard.trace.observeEvidence').replace('{count}', String(checkins7d)),
        suggestion: t('dashboard.trace.observeSuggestion'),
        view: 'sensorial',
      },
      {
        id: 'understand',
        label: t('dashboard.trace.understand'),
        score: understandScore,
        evidence: t('dashboard.trace.understandEvidence')
          .replace('{patterns}', String(stats.patterns.length))
          .replace('{dimensions}', String(stats.active.length)),
        suggestion: t('dashboard.trace.understandSuggestion'),
        view: 'insights',
      },
      {
        id: 'act',
        label: t('dashboard.trace.act'),
        score: actScore,
        evidence: hasIntention
          ? t('dashboard.trace.actEvidenceWithIntention').replace('{progress}', String(stats.progress))
          : t('dashboard.trace.actEvidence').replace('{progress}', String(stats.progress)),
        suggestion: t('dashboard.trace.actSuggestion'),
        view: 'diary',
      },
      {
        id: 'verify',
        label: t('dashboard.trace.verify'),
        score: verifyScore,
        evidence: t('dashboard.trace.verifyEvidence').replace('{count}', String(visits14d)),
        suggestion: t('dashboard.trace.verifySuggestion'),
        view: 'timeline',
      },
    ]
  }, [intention, stats.active.length, stats.patterns.length, stats.progress, streak, t])

  const stageHistoryWithToday = useMemo(() => {
    return mergeStageHistory(stageHistory, baseStages, getDayKey())
  }, [baseStages, stageHistory])

  useEffect(() => {
    localStorage.setItem('psyche-traceability-history', JSON.stringify(stageHistoryWithToday))
  }, [stageHistoryWithToday])

  const traceabilityStages = useMemo<TraceabilityStage[]>(() => {
    return baseStages.map((stage) => {
      const target = stageTargets[stage.id] ?? 65
      const history = (stageHistoryWithToday[stage.id] ?? []).slice(-trendWindowDays)
      const trendDelta = computeTrendDelta(history)
      const status = getStageStatus(stage.score, target, trendDelta)

      return {
        ...stage,
        target,
        status,
        trendDelta,
        history,
      }
    })
  }, [baseStages, stageHistoryWithToday, stageTargets, trendWindowDays])

  const selectedStage = traceabilityStages.find((stage) => stage.id === selectedStageId) ?? traceabilityStages[0]

  return (
    <div className={`dashboard-glass-root glass-${glassMode} mx-auto w-full max-w-[92rem] space-y-10 px-4 py-8 sm:px-8 lg:space-y-12 lg:px-10 xl:px-12`}>
      <SectionHead
        title={t('dashboard.title')}
        subtitle={t('dashboard.subtitle')}
      />

      {/* Streak + weekly intention */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-[auto_1fr]">
        <div className="material-card flex flex-col items-center justify-center gap-2 rounded-[var(--radius-lg)] border border-[color:var(--line)] bg-[color:var(--panel)] px-8 py-6 shadow-[var(--shadow-card)] min-w-[9rem]">
          <span className="text-5xl font-bold tabular-nums text-[color:var(--accent)]" style={{letterSpacing:'0.02em'}}>{streak}</span>
          <span className="text-base font-semibold uppercase tracking-[0.18em] text-[color:var(--ink-soft)]">
            {streak === 1 ? t('dashboard.reflectionDay') : t('dashboard.reflectionDays')}
          </span>
          <span className="mt-1 text-[0.95rem] text-[color:var(--ink-faint)]">{t('dashboard.continuity')}</span>
        </div>

        <div className="material-card rounded-[var(--radius-lg)] border border-[color:var(--line)] bg-[color:var(--panel)] p-7 shadow-[var(--shadow-card)]">
          <h3 className="text-lg font-semibold uppercase tracking-[0.14em] text-[color:var(--ink-soft)]">{t('dashboard.weeklyIntention')}</h3>
          <p className="mt-1 mb-4 text-[1.02rem] text-[color:var(--ink-faint)]">{t('dashboard.weeklyIntentionHint')}</p>
          <div className="flex gap-3">
            <input
              type="text"
              value={intention}
              onChange={e => setIntention(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && saveIntention()}
              placeholder={t('dashboard.weeklyIntentionPlaceholder')}
              className="material-input blue flex-1 rounded-[var(--radius-md)] bg-[color:var(--paper-strong)] px-4 py-3 text-[1.08rem] text-[color:var(--ink)]"
            />
            <button
              onClick={saveIntention}
              className="material-button blue px-4 py-3 text-[1.08rem] font-semibold transition-colors"
            >
              {intentionSaved ? '✓' : t('dashboard.save')}
            </button>
          </div>
        </div>
      </section>

      <section className="-mt-4 flex justify-end">
        <div className="liquid-glass-chip inline-flex items-center gap-1 rounded-full p-1">
          <span className="px-2 text-xs font-semibold uppercase tracking-[0.14em] text-[color:var(--ink-faint)]">
            {t('dashboard.glassMode')}
          </span>
          <button
            type="button"
            onClick={() => setGlassMode('soft')}
            className={`rounded-full px-3 py-1 text-sm transition-colors ${glassMode === 'soft' ? 'bg-[color:var(--accent)] text-white' : 'text-[color:var(--ink-soft)]'}`}
          >
            {t('dashboard.glass.soft')}
          </button>
          <button
            type="button"
            onClick={() => setGlassMode('intense')}
            className={`rounded-full px-3 py-1 text-sm transition-colors ${glassMode === 'intense' ? 'bg-[color:var(--accent)] text-white' : 'text-[color:var(--ink-soft)]'}`}
          >
            {t('dashboard.glass.intense')}
          </button>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-4">
        <StatCard label={t('dashboard.stat.profile')} value={`${stats.progress}%`} hint={t('dashboard.stat.completion')} />
        <StatCard label={t('dashboard.stat.phase')} value={stats.chapter} hint={t('dashboard.stat.narrative')} />
        <StatCard label={t('dashboard.stat.active')} value={String(stats.active.length)} hint={t('dashboard.stat.dimensions')} />
        <StatCard label={t('dashboard.stat.signals')} value={String(stats.patterns.length)} hint={t('dashboard.stat.topPatterns')} />
      </section>

      <section className="liquid-glass-panel rounded-2xl border border-[color:var(--line)] bg-[color:var(--panel)] p-6 shadow-[var(--shadow-card)]">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <h3 className="text-lg font-semibold text-[color:var(--ink)]">{t('dashboard.trace.title')}</h3>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-[0.14em] text-[color:var(--ink-faint)]">{t('dashboard.trace.path')}</span>
            <div className="liquid-glass-chip inline-flex rounded-full border border-[color:var(--line-strong)] p-0.5">
              <button
                type="button"
                onClick={() => setTrendWindowDays(7)}
                className={`rounded-full px-2 py-0.5 text-[11px] ${trendWindowDays === 7 ? 'bg-[color:var(--accent)] text-white' : 'text-[color:var(--ink-soft)]'}`}
              >
                7g
              </button>
              <button
                type="button"
                onClick={() => setTrendWindowDays(30)}
                className={`rounded-full px-2 py-0.5 text-[11px] ${trendWindowDays === 30 ? 'bg-[color:var(--accent)] text-white' : 'text-[color:var(--ink-soft)]'}`}
              >
                30g
              </button>
            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-4">
          {traceabilityStages.map((stage, index) => (
            <div
              key={stage.id}
              className={`liquid-glass-card relative rounded-xl border bg-[color:var(--paper-strong)] p-4 ${selectedStageId === stage.id ? 'border-[color:var(--accent)]' : 'border-[color:var(--line)]'}`}
            >
              {index < traceabilityStages.length - 1 && (
                <span className="hidden lg:block absolute right-[-0.9rem] top-1/2 -translate-y-1/2 text-[color:var(--ink-faint)]">→</span>
              )}

              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-[0.14em] text-[color:var(--ink-faint)]">{stage.label}</span>
                <span className="text-sm font-semibold text-[color:var(--accent)]">{stage.score}%</span>
              </div>

              <div className="mt-2 flex items-center justify-between gap-2">
                <span className={`text-[11px] font-medium ${stage.status === 'growing' ? 'text-emerald-600' : stage.status === 'reinforce' ? 'text-amber-600' : 'text-[color:var(--ink-faint)]'}`}>
                  {t(`dashboard.trace.status.${stage.status}`)}
                </span>
                <span className="text-[11px] text-[color:var(--ink-faint)]">
                  {t('dashboard.trace.trend')} {stage.trendDelta >= 0 ? '+' : ''}{stage.trendDelta}
                </span>
              </div>

              <div className="mt-2">
                <Sparkline values={stage.history.map(point => point.score)} />
              </div>

              <div className="mt-2 h-2 overflow-hidden rounded-full bg-[color:var(--line)]">
                <div
                  className="h-full rounded-full bg-[color:var(--accent)] transition-[width] duration-300"
                  style={{ width: `${stage.score}%` }}
                />
              </div>

              <div className="mt-2 flex items-center gap-2">
                <label className="text-[11px] text-[color:var(--ink-faint)]">{t('dashboard.trace.threshold')}</label>
                <input
                  type="range"
                  min={40}
                  max={90}
                  step={1}
                  value={stage.target}
                  onChange={(event) => {
                    const value = Number(event.target.value)
                    setStageTargets((current) => ({ ...current, [stage.id]: value }))
                  }}
                  className="flex-1"
                />
                <span className="text-[11px] font-medium text-[color:var(--ink-soft)]">{stage.target}%</span>
              </div>

              <p className="mt-2 text-xs text-[color:var(--ink-faint)]">{stage.evidence}</p>

              <button
                onClick={() => navigate(stage.view)}
                className="mt-3 text-xs font-medium text-[color:var(--accent)] hover:underline"
              >
                {stage.suggestion}
              </button>

              <button
                onClick={() => setSelectedStageId(stage.id)}
                className="mt-2 block text-[11px] text-[color:var(--ink-faint)] hover:text-[color:var(--accent)]"
              >
                {t('dashboard.trace.detailAction')}
              </button>
            </div>
          ))}
        </div>

        {selectedStage && (
          <div className="mt-4 rounded-xl border border-[color:var(--line)] bg-[color:var(--paper-strong)] p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h4 className="text-sm font-semibold text-[color:var(--ink)]">{t('dashboard.trace.detailTitle')}: {selectedStage.label}</h4>
              <span className="text-xs text-[color:var(--ink-faint)]">{t('dashboard.trace.window').replace('{days}', String(trendWindowDays))}</span>
            </div>

            <div className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <DetailPill label={t('dashboard.trace.score')} value={`${selectedStage.score}%`} />
              <DetailPill label={t('dashboard.trace.threshold')} value={`${selectedStage.target}%`} />
              <DetailPill label={t('dashboard.trace.statusLabel')} value={t(`dashboard.trace.status.${selectedStage.status}`)} />
              <DetailPill label={t('dashboard.trace.trendLabel')} value={`${selectedStage.trendDelta >= 0 ? '+' : ''}${selectedStage.trendDelta}`} />
            </div>

            <div className="mt-3">
              <Sparkline values={selectedStage.history.map((point) => point.score)} />
            </div>

            <div className="mt-3 grid grid-cols-1 gap-1 sm:grid-cols-2">
              {selectedStage.history.slice(-6).reverse().map((point) => (
                <div key={`${selectedStage.id}-${point.day}`} className="flex items-center justify-between text-[11px] text-[color:var(--ink-faint)]">
                  <span>{point.day}</span>
                  <span className="font-medium text-[color:var(--ink-soft)]">{point.score}%</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-4 rounded-xl border border-[color:var(--line)] bg-[color:var(--paper-strong)] p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h4 className="text-sm font-semibold text-[color:var(--ink)]">{t('dashboard.trace.compareTitle')}</h4>
            <span className="text-xs text-[color:var(--ink-faint)]">{t('dashboard.trace.compareSubtitle').replace('{days}', String(trendWindowDays))}</span>
          </div>

          <div className="mt-3">
            <ComparisonSparkline stages={traceabilityStages} />
          </div>

          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {traceabilityStages.map((stage) => (
              <div key={`legend-${stage.id}`} className="flex items-center justify-between rounded-md border border-[color:var(--line)] bg-[color:var(--panel)] px-2.5 py-1.5 text-xs">
                <span className="inline-flex items-center gap-2 text-[color:var(--ink-soft)]">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: STAGE_COMPARE_COLORS[stage.id] ?? '#4285f4' }} />
                  {stage.label}
                </span>
                <span className="font-medium text-[color:var(--ink)]">{stage.score}%</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
        <div className="liquid-glass-panel rounded-2xl border border-[color:var(--line)] bg-[color:var(--panel)] p-6 shadow-[var(--shadow-card)]">
          <h3 className="text-lg font-semibold text-[color:var(--ink)]">{t('dashboard.profileSetup')}</h3>
          <p className="mt-1 text-sm text-[color:var(--ink-faint)]">{t('dashboard.profileHint')}</p>

          <div className="mt-5 space-y-4">
            <Field
              label={t('dashboard.name')}
              value={name}
              placeholder={t('dashboard.namePlaceholder')}
              onChange={setName}
            />
            <Field
              label={t('dashboard.goal')}
              value={goal}
              placeholder={t('dashboard.goalPlaceholder')}
              onChange={setGoal}
            />
          </div>

          <div className="mt-6 h-2 overflow-hidden rounded-full bg-[color:var(--line)]">
            <div
              className="h-full rounded-full bg-[color:var(--accent)] transition-[width] duration-300"
              style={{ width: `${stats.progress}%` }}
            />
          </div>
        </div>

        <div className="liquid-glass-panel rounded-2xl border border-[color:var(--line)] bg-[color:var(--panel)] p-6 shadow-[var(--shadow-card)]">
          <h3 className="text-lg font-semibold text-[color:var(--ink)]">{t('dashboard.quickActions')}</h3>
          <p className="mt-1 text-sm text-[color:var(--ink-faint)]">{t('dashboard.quickHint')}</p>

          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <MenuCard icon={<LinkIcon />} label={t('dashboard.action.connect')} sub={t('dashboard.action.connectSub')} onClick={() => navigate('sources')} />
            <MenuCard icon={<CogIcon />} label={t('dashboard.action.run')} sub={t('dashboard.action.runSub')} onClick={() => navigate('sources')} />
            <MenuCard icon={<ChartIcon />} label={t('dashboard.action.overview')} sub={t('dashboard.action.overviewSub')} onClick={() => navigate('overview')} />
            <MenuCard icon={<SearchIcon />} label={t('dashboard.action.patterns')} sub={t('dashboard.action.patternsSub')} onClick={() => navigate('patterns')} />
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <DimensionBlock title={t('dashboard.activeDimensions')} data={stats.active} tone="active" />
        <DimensionBlock title={t('dashboard.exploringDimensions')} data={stats.exploring} tone="soft" />
      </section>

      <section className="liquid-glass-panel rounded-2xl border border-[color:var(--line)] bg-[color:var(--panel)] p-6 shadow-[var(--shadow-card)]">
        <h3 className="text-lg font-semibold text-[color:var(--ink)]">{t('dashboard.recentSignals')}</h3>
        <div className="mt-4 flex flex-wrap gap-2">
          {stats.patterns.map(pattern => (
            <button
              key={pattern.id}
              onClick={() => navigate('patterns')}
              className="liquid-glass-chip rounded-full border border-[color:var(--line-strong)] bg-[color:var(--paper-strong)] px-3 py-1 text-sm text-[color:var(--ink-soft)] transition-colors hover:border-[color:var(--accent)] hover:text-[color:var(--accent)]"
            >
              {pattern.label}
            </button>
          ))}
        </div>
      </section>
    </div>
  )
}

function DetailPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[color:var(--line)] bg-[color:var(--panel)] px-3 py-2">
      <p className="text-[10px] uppercase tracking-[0.12em] text-[color:var(--ink-faint)]">{label}</p>
      <p className="text-sm font-semibold text-[color:var(--ink)]">{value}</p>
    </div>
  )
}

function ComparisonSparkline({ stages }: { stages: TraceabilityStage[] }) {
  const { t } = useI18n()
  const width = 560
  const height = 130
  const gridLines = [0, 25, 50, 75, 100]

  const toPolyline = (values: number[]) => {
    const points = values.length > 1 ? values : [values[0] ?? 0, values[0] ?? 0]
    const step = width / (points.length - 1)
    return points
      .map((value, index) => {
        const x = index * step
        const y = height - (Math.max(0, Math.min(100, value)) / 100) * height
        return `${x},${y}`
      })
      .join(' ')
  }

  return (
    <svg width="100%" height="130" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" aria-label={t('dashboard.trace.compareAria')}>
      {gridLines.map((line) => {
        const y = height - (line / 100) * height
        return (
          <line
            key={`grid-${line}`}
            x1={0}
            y1={y}
            x2={width}
            y2={y}
            stroke="var(--line)"
            strokeWidth="1"
            strokeDasharray="3 4"
          />
        )
      })}

      {stages.map((stage) => {
        const values = stage.history.map((point) => point.score)
        const polyline = toPolyline(values)
        return (
          <polyline
            key={`cmp-${stage.id}`}
            fill="none"
            stroke={STAGE_COMPARE_COLORS[stage.id] ?? '#4285f4'}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={polyline}
            opacity="0.95"
          />
        )
      })}
    </svg>
  )
}

function Sparkline({ values }: { values: number[] }) {
  const points = values.length > 1 ? values : [values[0] ?? 0, values[0] ?? 0]
  const width = 120
  const height = 32
  const step = width / (points.length - 1)
  const polyline = points
    .map((value, index) => {
      const x = index * step
      const y = height - (Math.max(0, Math.min(100, value)) / 100) * height
      return `${x},${y}`
    })
    .join(' ')

  return (
    <svg width="100%" height="32" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" aria-hidden="true">
      <polyline
        fill="none"
        stroke="var(--accent)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={polyline}
      />
    </svg>
  )
}

function Field({
  label,
  value,
  placeholder,
  onChange,
}: {
  label: string
  value: string
  placeholder: string
  onChange: (v: string) => void
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold uppercase tracking-[0.14em] text-[color:var(--ink-faint)]">
        {label}
      </span>
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="liquid-glass-input block w-full rounded-lg border border-[color:var(--line-strong)] bg-white px-3 py-2"
      />
    </label>
  )
}

function StatCard({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div
      className="liquid-glass-card rounded-xl border border-[color:var(--line)] bg-[color:var(--panel)] px-4 py-3 shadow-[var(--shadow-card)] transition-all duration-300 hover:border-[color:var(--accent)] focus-within:border-[color:var(--accent)] relative group"
      tabIndex={0}
      aria-label={label + ' ' + value}
      title={hint}
      role="region"
    >
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--ink-faint)]">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-[color:var(--ink)]" aria-live="polite">{value}</p>
      <p className="text-sm text-[color:var(--ink-faint)]" aria-label={hint}>{hint}</p>
      {/* Tooltip visibile al focus/hover */}
      <span className="absolute left-1/2 top-0 z-10 mt-[-2.2rem] w-max max-w-[14rem] -translate-x-1/2 rounded-lg bg-[color:var(--accent)] px-3 py-1 text-xs text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-within:opacity-100" role="tooltip">
        {label}: {hint}
      </span>
    </div>
  )
}

function MenuCard({
  icon,
  label,
  sub,
  onClick,
}: {
  icon: React.ReactNode
  label: string
  sub: string
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="liquid-glass-card rounded-xl border border-[color:var(--line)] bg-[color:var(--paper-strong)] p-4 text-left shadow-[var(--shadow-card)] transition-transform duration-200 hover:-translate-y-[1px] hover:shadow-[var(--shadow-hover)]"
    >
      <span className="mb-2 inline-flex text-[color:var(--accent)]">{icon}</span>
      <span className="block text-base font-semibold text-[color:var(--ink)]">{label}</span>
      <span className="mt-0.5 block text-sm text-[color:var(--ink-faint)]">{sub}</span>
    </button>
  )
}

function DimensionBlock({
  title,
  data,
  tone,
}: {
  title: string
  data: DimensionStat[]
  tone: 'active' | 'soft'
}) {
  const color = tone === 'active' ? 'text-[color:var(--accent)]' : 'text-[color:var(--ink-soft)]'

  return (
    <div className="liquid-glass-panel rounded-2xl border border-[color:var(--line)] bg-[color:var(--panel)] p-6 shadow-[var(--shadow-card)]">
      <h3 className={`text-lg font-semibold ${color}`}>{title}</h3>
      <div className="mt-4 space-y-3">
        {data.slice(0, 4).map(item => (
          <div key={item.name} className="liquid-glass-chip flex items-center justify-between rounded-lg bg-[color:var(--paper-strong)] px-3 py-2">
            <span className="text-sm text-[color:var(--ink)]">{item.name}</span>
            <span className="text-sm font-medium text-[color:var(--ink-faint)]">{Math.round(item.score * 100)}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}

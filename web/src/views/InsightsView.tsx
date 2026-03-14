import { useEffect, useMemo, useState } from 'react'
import { SectionHead, Expandable, TwoCol, Cite, References, ConfidenceBar, ExploreButton } from '../components/shared'
import { directionalVector } from '../data/loader'
import { useI18n } from '../i18n'

const INSIGHTS_TOC = ['ins-breath', 'ins-directional', 'ins-growth', 'ins-frameworks', 'ins-evolution', 'ins-patterns', 'ins-resources'] as const

const DAILY_PHASES = [
  { id: 'contemplative', start: 6, end: 9, color: 'bg-violet-500/30' },
  { id: 'technical', start: 9, end: 14, color: 'bg-indigo-500/30' },
  { id: 'mixed', start: 14, end: 19, color: 'bg-slate-500/30' },
  { id: 'decompression', start: 19, end: 23, color: 'bg-slate-700/30' },
] as const

const LIFE_PHASES = [
  { id: 'engineer', color: 'bg-slate-500', period: '2012-2018' },
  { id: 'digitalTransition', color: 'bg-blue-500', period: '2018-2021' },
  { id: 'builder', color: 'bg-indigo-500', period: '2021-2023' },
  { id: 'artist', color: 'bg-violet-500', period: '2022-2024' },
  { id: 'seeker', color: 'bg-purple-500', period: '2024-2025' },
  { id: 'throughline', color: 'bg-emerald-500', period: '2025-present' },
] as const

type ReferenceItem = {
  author: string
  work: string
  year: string
  detail: string
}

function valueOrUndefined(value: string, key: string): string | undefined {
  return value === key ? undefined : value
}

function Practice({ text }: { text: string }) {
  const { t } = useI18n()

  return (
    <div className="border-l-2 border-indigo-400 pl-4 mt-3">
      <span className="text-xs font-medium uppercase tracking-wider text-[color:var(--accent)]">{t('insights.practice')}</span>
      <p className="mt-1 text-sm leading-relaxed text-[color:var(--ink-soft)]">{text}</p>
    </div>
  )
}

function TraitBar({ trait, score, note }: { trait: string; score: number; note: string }) {
  return (
    <div className="space-y-1">
      <div className="flex items-baseline justify-between">
        <span className="text-sm text-[color:var(--ink)]">{trait}</span>
        <span className="text-xs tabular-nums text-[color:var(--ink-faint)]">{Math.round(score * 100)}%</span>
      </div>
      <ConfidenceBar value={score} />
      <p className="text-xs text-[color:var(--ink-faint)]">{note}</p>
    </div>
  )
}

function DailyRhythmBar() {
  const { t } = useI18n()

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-medium text-[color:var(--ink)]">{t('insights.dailyRhythm')}</h4>
      <div className="flex h-8 w-full overflow-hidden rounded-md">
        {DAILY_PHASES.map((phase) => {
          const width = ((phase.end - phase.start) / 17) * 100
          return (
            <div key={phase.id} className={`${phase.color} flex items-center justify-center`} style={{ width: `${width}%` }}>
              <span className="text-[10px] text-[color:var(--ink-soft)]">{t(`insights.dailyPhases.${phase.id}.label`)}</span>
            </div>
          )
        })}
      </div>
      <div className="flex justify-between text-[10px] text-[color:var(--ink-faint)]">
        <span>6:00</span>
        <span>12:00</span>
        <span>18:00</span>
        <span>23:00</span>
      </div>
    </div>
  )
}

function DirectionalVectorSection() {
  const { t } = useI18n()
  if (!directionalVector) return null

  const { axes, heading, constraints, attractors, antiVectors, nextExperimentSurfaces } = directionalVector

  return (
    <section id="ins-directional" tabIndex={-1}>
      <SectionHead title={t('insights.directional.title')} subtitle={directionalVector.summary} />

      <div className="rounded-lg border border-slate-700/60 bg-[color:var(--panel)] p-5 space-y-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1">
            <span className="text-[10px] font-mono uppercase tracking-widest text-[color:var(--ink-faint)]">{t('insights.directional.from')}</span>
            <p className="text-sm text-[color:var(--ink-soft)] leading-relaxed">{heading.from}</p>
          </div>
          <div className="space-y-1">
            <span className="text-[10px] font-mono uppercase tracking-widest text-[color:var(--accent)]">{t('insights.directional.through')}</span>
            <p className="text-sm text-[color:var(--ink)] leading-relaxed font-medium">{heading.through}</p>
          </div>
          <div className="space-y-1">
            <span className="text-[10px] font-mono uppercase tracking-widest text-[color:var(--ink-faint)]">{t('insights.directional.toward')}</span>
            <p className="text-sm text-[color:var(--ink-soft)] leading-relaxed">{heading.toward}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 pt-2 border-t border-[color:var(--line)]">
          <ConfidenceBar value={heading.confidence} />
          <span className="text-[10px] text-[color:var(--ink-faint)] shrink-0">{Math.round(heading.confidence * 100)}% {t('insights.directional.confidence')}</span>
        </div>
      </div>

      <div className="space-y-2 mb-6">
        {axes.map((axis) => (
          <div key={axis.axis} className="rounded-md border border-slate-700/40 p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[color:var(--ink)]">{axis.axis}</span>
              <div className="flex items-center gap-2 text-[10px] text-[color:var(--ink-faint)]">
                <span>{t('insights.directional.current')}: {axis.current > 0 ? '+' : ''}{axis.current.toFixed(2)}</span>
                <span className={axis.recommendedDrift > 0 ? 'text-emerald-500/80' : 'text-amber-500/80'}>
                  {t('insights.directional.drift')}: {axis.recommendedDrift > 0 ? '+' : ''}{axis.recommendedDrift.toFixed(2)}
                </span>
              </div>
            </div>

            <div className="relative h-2 rounded-full bg-[color:var(--panel)] overflow-visible">
              <div className="absolute top-0 h-2 w-2 rounded-full bg-[color:var(--accent)]" style={{ left: `${((axis.current + 1) / 2) * 100}%`, transform: 'translateX(-50%)' }} />
              <div className="absolute top-0 h-2 w-2 rounded-full border-2 border-emerald-500/80 bg-transparent" style={{ left: `${((axis.current + axis.recommendedDrift + 1) / 2) * 100}%`, transform: 'translateX(-50%)' }} />
            </div>

            <div className="flex justify-between text-[10px] text-[color:var(--ink-faint)]">
              <span>{axis.leftPole}</span>
              <span>{axis.rightPole}</span>
            </div>
            <p className="text-xs text-[color:var(--ink-faint)] leading-relaxed">{axis.rationale}</p>
          </div>
        ))}
      </div>

      <div className="space-y-2">
        <Expandable title={t('insights.directional.constraints')} summary={t('insights.directional.constraintsSummary').replace('{count}', String(constraints.length))}>
          <ul className="space-y-1.5">
            {constraints.map((constraint, index) => (
              <li key={`${constraint}-${index}`} className="flex items-start gap-2">
                <span className="text-amber-500/70 text-xs mt-0.5 shrink-0">{String(index + 1).padStart(2, '0')}</span>
                <span className="text-xs text-[color:var(--ink-soft)] leading-relaxed">{constraint}</span>
              </li>
            ))}
          </ul>
        </Expandable>

        <Expandable title={t('insights.directional.attractors')} summary={t('insights.directional.attractorsSummary').replace('{count}', String(attractors.length))}>
          <ul className="space-y-1.5">
            {attractors.map((attractor, index) => (
              <li key={`${attractor}-${index}`} className="flex items-start gap-2">
                <span className="text-emerald-500/70 text-xs mt-0.5 shrink-0">{String(index + 1).padStart(2, '0')}</span>
                <span className="text-xs text-[color:var(--ink-soft)] leading-relaxed">{attractor}</span>
              </li>
            ))}
          </ul>
        </Expandable>

        <Expandable title={t('insights.directional.antiVectors')} summary={t('insights.directional.antiVectorsSummary').replace('{count}', String(antiVectors.length))}>
          <ul className="space-y-1.5">
            {antiVectors.map((antiVector, index) => (
              <li key={`${antiVector}-${index}`} className="flex items-start gap-2">
                <span className="text-red-400/70 text-xs mt-0.5 shrink-0">{String(index + 1).padStart(2, '0')}</span>
                <span className="text-xs text-[color:var(--ink-soft)] leading-relaxed">{antiVector}</span>
              </li>
            ))}
          </ul>
        </Expandable>

        {nextExperimentSurfaces.length > 0 && (
          <Expandable title={t('insights.directional.experimentSurfaces')} summary={t('insights.directional.experimentSurfacesSummary').replace('{count}', String(nextExperimentSurfaces.length))} defaultOpen>
            <div className="space-y-3">
              {nextExperimentSurfaces.map((surface) => (
                <div key={surface.surface} className="border-l-2 border-indigo-400/40 pl-4 space-y-1">
                  <span className="text-xs font-medium text-[color:var(--ink)]">{surface.surface}</span>
                  <p className="text-xs text-[color:var(--ink-faint)] leading-relaxed">{surface.whyThisSurface}</p>
                  <div className="flex gap-4 text-[10px]">
                    <span><span className="text-emerald-500/70 uppercase tracking-wider">{t('insights.directional.success')}:</span> {surface.successSignal}</span>
                    <span><span className="text-red-400/70 uppercase tracking-wider">{t('insights.directional.failure')}:</span> {surface.failureSignal}</span>
                  </div>
                </div>
              ))}
            </div>
          </Expandable>
        )}
      </div>
    </section>
  )
}

export default function InsightsView() {
  const { t } = useI18n()
  const [activeSection, setActiveSection] = useState('ins-breath')

  const tocItems = INSIGHTS_TOC.map((id) => ({ id, label: t(`insights.toc.${id}`) }))

  const bigFive = useMemo(
    () => [
      { id: 'openness', score: 0.92 },
      { id: 'conscientiousness', score: 0.58 },
      { id: 'extraversion', score: 0.35 },
      { id: 'agreeableness', score: 0.52 },
      { id: 'neuroticism', score: 0.48 },
    ].map((item) => ({
      ...item,
      trait: t(`insights.frameworks.bigFive.items.${item.id}.trait`),
      note: t(`insights.frameworks.bigFive.items.${item.id}.note`),
    })),
    [t],
  )

  const growthVectors = useMemo(
    () => [
      { id: 'integration', refs: [{ key: 'winnicott', year: '1971' }, { key: 'schwartz', year: '2004' }] },
      { id: 'shadowDialogue', refs: [{ key: 'jung', year: '1951' }, { key: 'pennebaker', year: '1997' }, { key: 'progoff', year: '1975' }] },
      { id: 'sovereigntyBodyBridge', refs: [{ key: 'lakoff', year: '1999' }, { key: 'vanderkolk', year: '2014' }] },
      { id: 'socialDepth', refs: [{ key: 'dunbar', year: '2010' }, { key: 'bowlby', year: '1969' }] },
      { id: 'convergenceArtifact', refs: [{ key: 'csikszentmihalyi', year: '1996' }, { key: 'simonton', year: '1999' }] },
    ].map((item) => ({
      ...item,
      title: t(`insights.growth.items.${item.id}.title`),
      summary: t(`insights.growth.items.${item.id}.summary`),
      context: t(`insights.growth.items.${item.id}.context`),
      body: t(`insights.growth.items.${item.id}.body`),
      practice: t(`insights.growth.items.${item.id}.practice`),
      refs: item.refs.map((ref) => ({
        author: t(`insights.growth.items.${item.id}.refs.${ref.key}.author`),
        work: t(`insights.growth.items.${item.id}.refs.${ref.key}.work`),
        year: ref.year,
        detail: t(`insights.growth.items.${item.id}.refs.${ref.key}.detail`),
      })),
    })),
    [t],
  )

  const lifePhases = useMemo(
    () => LIFE_PHASES.map((phase) => ({
      ...phase,
      label: t(`insights.evolution.timeline.items.${phase.id}.label`),
      description: t(`insights.evolution.timeline.items.${phase.id}.description`),
      dominant: t(`insights.evolution.timeline.items.${phase.id}.dominant`),
      underdeveloped: valueOrUndefined(t(`insights.evolution.timeline.items.${phase.id}.underdeveloped`), `insights.evolution.timeline.items.${phase.id}.underdeveloped`),
      keyEvent: valueOrUndefined(t(`insights.evolution.timeline.items.${phase.id}.keyEvent`), `insights.evolution.timeline.items.${phase.id}.keyEvent`),
      emerging: valueOrUndefined(t(`insights.evolution.timeline.items.${phase.id}.emerging`), `insights.evolution.timeline.items.${phase.id}.emerging`),
      keyTension: valueOrUndefined(t(`insights.evolution.timeline.items.${phase.id}.keyTension`), `insights.evolution.timeline.items.${phase.id}.keyTension`),
      note: valueOrUndefined(t(`insights.evolution.timeline.items.${phase.id}.note`), `insights.evolution.timeline.items.${phase.id}.note`),
    })),
    [t],
  )

  const dimensionEvolution = useMemo(
    () => [
      { id: 'professional', level: 0.85 },
      { id: 'creative', level: 0.65 },
      { id: 'psychological', level: 0.78 },
      { id: 'spiritual', level: 0.72 },
      { id: 'social', level: 0.42 },
      { id: 'anthropological', level: 0.55 },
    ].map((item) => ({
      ...item,
      dimension: t(`insights.evolution.dimensions.${item.id}.label`),
      trajectory: t(`insights.evolution.dimensions.${item.id}.trajectory`),
    })),
    [t],
  )

  const maturityIndicators = useMemo(
    () => ['metaCognitiveCapacity', 'doingToReflection', 'patternAwareness', 'bodyDiscipline'].map((id) => ({
      id,
      indicator: t(`insights.evolution.maturity.items.${id}.indicator`),
      detail: t(`insights.evolution.maturity.items.${id}.detail`),
    })),
    [t],
  )

  const books = useMemo(
    () => ['warOfArt', 'finiteInfiniteGames', 'bodyKeepsScore', 'soulcraft', 'courageToCreate', 'godelEscherBach'].map((id) => ({
      id,
      title: t(`insights.resources.books.items.${id}.title`),
      author: t(`insights.resources.books.items.${id}.author`),
      year: t(`insights.resources.books.items.${id}.year`),
      why: t(`insights.resources.books.items.${id}.why`),
    })),
    [t],
  )

  const films = useMemo(
    () => ['synecdoche', 'stalker', 'wakingLife'].map((id) => ({
      id,
      title: t(`insights.resources.films.items.${id}.title`),
      director: t(`insights.resources.films.items.${id}.director`),
      year: t(`insights.resources.films.items.${id}.year`),
      why: t(`insights.resources.films.items.${id}.why`),
    })),
    [t],
  )

  const thinkers = useMemo(
    () => ['michaelLevin', 'joschaBach', 'gregoryBateson', 'iainMcGilchrist', 'noraBateson'].map((id) => ({
      id,
      name: t(`insights.resources.thinkers.items.${id}.name`),
      field: t(`insights.resources.thinkers.items.${id}.field`),
    })),
    [t],
  )

  const concepts = useMemo(
    () => ['autopoiesis', 'enactivism', 'apophaticTheology', 'strangeLoops', 'individuation'].map((id) => ({
      id,
      concept: t(`insights.resources.concepts.items.${id}.concept`),
      source: t(`insights.resources.concepts.items.${id}.source`),
      desc: t(`insights.resources.concepts.items.${id}.desc`),
    })),
    [t],
  )

  const bigFiveRefs: ReferenceItem[] = useMemo(() => [
    { author: t('insights.frameworks.bigFive.refs.costa.author'), work: t('insights.frameworks.bigFive.refs.costa.work'), year: '1992', detail: t('insights.frameworks.bigFive.refs.costa.detail') },
    { author: t('insights.frameworks.bigFive.refs.goldberg.author'), work: t('insights.frameworks.bigFive.refs.goldberg.work'), year: '1990', detail: t('insights.frameworks.bigFive.refs.goldberg.detail') },
  ], [t])

  const attachmentRefs: ReferenceItem[] = useMemo(() => [
    { author: t('insights.frameworks.attachment.refs.bowlby.author'), work: t('insights.frameworks.attachment.refs.bowlby.work'), year: '1969', detail: t('insights.frameworks.attachment.refs.bowlby.detail') },
    { author: t('insights.frameworks.attachment.refs.bartholomew.author'), work: t('insights.frameworks.attachment.refs.bartholomew.work'), year: '1991', detail: t('insights.frameworks.attachment.refs.bartholomew.detail') },
  ], [t])

  const flowRefs: ReferenceItem[] = useMemo(() => [
    { author: t('insights.frameworks.flow.refs.csikszentmihalyi.author'), work: t('insights.frameworks.flow.refs.csikszentmihalyi.work'), year: '1990', detail: t('insights.frameworks.flow.refs.csikszentmihalyi.detail') },
    { author: t('insights.frameworks.flow.refs.nakamura.author'), work: t('insights.frameworks.flow.refs.nakamura.work'), year: '2002', detail: t('insights.frameworks.flow.refs.nakamura.detail') },
  ], [t])

  const defenseRefs: ReferenceItem[] = useMemo(() => [
    { author: t('insights.frameworks.defense.refs.vaillant.author'), work: t('insights.frameworks.defense.refs.vaillant.work'), year: '1977', detail: t('insights.frameworks.defense.refs.vaillant.detail') },
    { author: t('insights.frameworks.defense.refs.cramer.author'), work: t('insights.frameworks.defense.refs.cramer.work'), year: '2006', detail: t('insights.frameworks.defense.refs.cramer.detail') },
  ], [t])

  const maturityRefs: ReferenceItem[] = useMemo(() => [
    { author: t('insights.evolution.maturity.refs.erikson.author'), work: t('insights.evolution.maturity.refs.erikson.work'), year: '1950', detail: t('insights.evolution.maturity.refs.erikson.detail') },
    { author: t('insights.evolution.maturity.refs.levinson.author'), work: t('insights.evolution.maturity.refs.levinson.work'), year: '1978', detail: t('insights.evolution.maturity.refs.levinson.detail') },
    { author: t('insights.evolution.maturity.refs.kegan.author'), work: t('insights.evolution.maturity.refs.kegan.work'), year: '1982', detail: t('insights.evolution.maturity.refs.kegan.detail') },
    { author: t('insights.evolution.maturity.refs.loevinger.author'), work: t('insights.evolution.maturity.refs.loevinger.work'), year: '1976', detail: t('insights.evolution.maturity.refs.loevinger.detail') },
  ], [t])

  const burstRefs: ReferenceItem[] = useMemo(() => [
    { author: t('insights.patterns.burst.refs.wallas.author'), work: t('insights.patterns.burst.refs.wallas.work'), year: '1926', detail: t('insights.patterns.burst.refs.wallas.detail') },
    { author: t('insights.patterns.burst.refs.simonton.author'), work: t('insights.patterns.burst.refs.simonton.work'), year: '1988', detail: t('insights.patterns.burst.refs.simonton.detail') },
  ], [t])

  const domainShiftRefs: ReferenceItem[] = useMemo(() => [
    { author: t('insights.patterns.domainShift.refs.kuhn.author'), work: t('insights.patterns.domainShift.refs.kuhn.work'), year: '1962', detail: t('insights.patterns.domainShift.refs.kuhn.detail') },
    { author: t('insights.patterns.domainShift.refs.simonton.author'), work: t('insights.patterns.domainShift.refs.simonton.work'), year: '1988', detail: t('insights.patterns.domainShift.refs.simonton.detail') },
  ], [t])

  useEffect(() => {
    const sections = tocItems.map((item) => document.getElementById(item.id)).filter(Boolean) as HTMLElement[]

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)
        if (visible[0]?.target?.id) setActiveSection(visible[0].target.id)
      },
      { rootMargin: '-15% 0px -55% 0px', threshold: [0.2, 0.35, 0.5] },
    )

    sections.forEach((section) => observer.observe(section))
    return () => observer.disconnect()
  }, [tocItems])

  return (
    <div className="insights-layout">
      <aside className="insights-toc" aria-label={t('insights.toc.aria')}>
        <p className="insights-toc-title">{t('insights.toc.title')}</p>
        {tocItems.map((item) => (
          <a key={item.id} href={`#${item.id}`} className={`insights-toc-link${activeSection === item.id ? ' is-active' : ''}`} aria-current={activeSection === item.id ? 'location' : undefined}>
            {item.label}
          </a>
        ))}
      </aside>

      <div className="insights-content space-y-20">
        <div className="breath-pause" id="ins-breath" tabIndex={-1}>
          <p className="breath-pause-text">
            {t('insights.pause.beforeReading')}
            <br />
            <em>{t('insights.pause.breathe')}</em>
          </p>
          <p className="breath-pause-sub">{t('insights.pause.subtitle')}</p>
        </div>

        <DirectionalVectorSection />

        <section id="ins-growth" tabIndex={-1}>
          <SectionHead title={t('insights.growth.title')} subtitle={t('insights.growth.subtitle')} />
          <div className="space-y-2">
            {growthVectors.map((item) => (
              <Expandable key={item.id} renderTitle={<div className="flex items-center gap-3"><span className="text-sm font-medium text-[color:var(--ink)]">{item.title}</span></div>} explore={<ExploreButton finding={item.title} context={item.context} />} summary={item.summary}>
                {item.id === 'sovereigntyBodyBridge' ? (
                  <TwoCol left={<p className="text-sm leading-relaxed text-[color:var(--ink-soft)]">{item.body}</p>} right={<Practice text={item.practice} />} />
                ) : (
                  <>
                    <p className="text-sm leading-relaxed text-[color:var(--ink-soft)]">{item.body}</p>
                    <Practice text={item.practice} />
                  </>
                )}
                <References>
                  {item.refs.map((ref) => (
                    <Cite key={`${item.id}-${ref.author}-${ref.year}`} author={ref.author} work={ref.work} year={ref.year} detail={ref.detail} />
                  ))}
                </References>
              </Expandable>
            ))}
          </div>
        </section>

        <section id="ins-frameworks" tabIndex={-1}>
          <SectionHead title={t('insights.frameworks.title')} subtitle={t('insights.frameworks.subtitle')} />
          <div className="space-y-2">
            <Expandable title={t('insights.frameworks.bigFive.title')} summary={<div className="flex gap-3 mt-1">{bigFive.map((item) => <span key={item.id} className="text-[10px] text-[color:var(--ink-faint)]">{item.trait.slice(0, 1)}: {Math.round(item.score * 100)}%</span>)}</div>}>
              <div className="space-y-4">{bigFive.map((item) => <TraitBar key={item.id} trait={item.trait} score={item.score} note={item.note} />)}</div>
              <p className="mt-4 text-xs text-[color:var(--ink-faint)] leading-relaxed">{t('insights.frameworks.bigFive.body')}</p>
              <References>{bigFiveRefs.map((ref) => <Cite key={`${ref.author}-${ref.year}`} author={ref.author} work={ref.work} year={ref.year} detail={ref.detail} />)}</References>
            </Expandable>

            <Expandable title={t('insights.frameworks.attachment.title')} summary={t('insights.frameworks.attachment.summary')}>
              <p className="text-sm leading-relaxed text-[color:var(--ink-soft)]">{t('insights.frameworks.attachment.body1')}</p>
              <p className="mt-3 text-sm leading-relaxed text-[color:var(--ink-soft)]">{t('insights.frameworks.attachment.body2')}</p>
              <References>{attachmentRefs.map((ref) => <Cite key={`${ref.author}-${ref.year}`} author={ref.author} work={ref.work} year={ref.year} detail={ref.detail} />)}</References>
            </Expandable>

            <Expandable title={t('insights.frameworks.flow.title')} summary={t('insights.frameworks.flow.summary')}>
              <p className="text-sm leading-relaxed text-[color:var(--ink-soft)]">{t('insights.frameworks.flow.body')}</p>
              <TwoCol
                left={<div className="space-y-2"><h4 className="text-xs font-medium uppercase tracking-wider text-emerald-500/70">{t('insights.frameworks.flow.triggersLabel')}</h4><p className="text-sm text-[color:var(--ink-soft)]">{t('insights.frameworks.flow.triggersBody')}</p></div>}
                right={<div className="space-y-2"><h4 className="text-xs font-medium uppercase tracking-wider text-amber-500/70">{t('insights.frameworks.flow.blockersLabel')}</h4><p className="text-sm text-[color:var(--ink-soft)]">{t('insights.frameworks.flow.blockersBody')}</p></div>}
              />
              <References>{flowRefs.map((ref) => <Cite key={`${ref.author}-${ref.year}`} author={ref.author} work={ref.work} year={ref.year} detail={ref.detail} />)}</References>
            </Expandable>

            <Expandable title={t('insights.frameworks.defense.title')} summary={t('insights.frameworks.defense.summary')}>
              <div className="space-y-4">
                <div>
                  <span className="text-xs font-medium uppercase tracking-wider text-emerald-500/70">{t('insights.frameworks.defense.matureLabel')}</span>
                  <p className="mt-1 text-sm leading-relaxed text-[color:var(--ink-soft)]">{t('insights.frameworks.defense.matureBody')}</p>
                </div>
                <div>
                  <span className="text-xs font-medium uppercase tracking-wider text-amber-500/70">{t('insights.frameworks.defense.neuroticLabel')}</span>
                  <p className="mt-1 text-sm leading-relaxed text-[color:var(--ink-soft)]">{t('insights.frameworks.defense.neuroticBody')}</p>
                </div>
              </div>
              <p className="mt-3 text-xs text-[color:var(--ink-faint)]">{t('insights.frameworks.defense.noteBody')}</p>
              <References>{defenseRefs.map((ref) => <Cite key={`${ref.author}-${ref.year}`} author={ref.author} work={ref.work} year={ref.year} detail={ref.detail} />)}</References>
            </Expandable>
          </div>
        </section>

        <section id="ins-evolution" tabIndex={-1}>
          <SectionHead title={t('insights.evolution.title')} subtitle={t('insights.evolution.subtitle')} />
          <div className="space-y-2">
            <Expandable title={t('insights.evolution.timeline.title')} summary={t('insights.evolution.timeline.summary')} defaultOpen>
              <div className="space-y-0">
                {lifePhases.map((phase, index) => (
                  <div key={phase.id} className="relative flex gap-4 pb-6 last:pb-0">
                    {index < lifePhases.length - 1 && <div className="absolute left-[7px] top-5 bottom-0 w-px bg-slate-700/60" />}
                    <div className={`relative mt-1.5 h-4 w-4 shrink-0 rounded-full ${phase.color}/30 flex items-center justify-center`}><div className={`h-2 w-2 rounded-full ${phase.color}`} /></div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-baseline gap-2 flex-wrap"><span className="text-sm font-medium text-[color:var(--ink)]">{phase.label}</span><span className="text-xs text-[color:var(--ink-faint)]">{phase.period}</span></div>
                      <p className="text-xs leading-relaxed text-[color:var(--ink-soft)]">{phase.description}</p>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px]">
                        <span className="text-[color:var(--ink-faint)]"><span className="text-emerald-500/70 uppercase tracking-wider">{t('insights.evolution.dominant')}:</span>{' '}{phase.dominant}</span>
                        {phase.underdeveloped && <span className="text-[color:var(--ink-faint)]"><span className="text-amber-500/70 uppercase tracking-wider">{t('insights.evolution.underdeveloped')}:</span>{' '}{phase.underdeveloped}</span>}
                        {phase.keyEvent && <span className="text-[color:var(--ink-faint)]"><span className="text-blue-400/70 uppercase tracking-wider">{t('insights.evolution.keyEvent')}:</span>{' '}{phase.keyEvent}</span>}
                        {phase.emerging && <span className="text-[color:var(--ink-faint)]"><span className="text-blue-400/70 uppercase tracking-wider">{t('insights.evolution.emerging')}:</span>{' '}{phase.emerging}</span>}
                        {phase.keyTension && <span className="text-[color:var(--ink-faint)]"><span className="text-red-400/70 uppercase tracking-wider">{t('insights.evolution.keyTension')}:</span>{' '}{phase.keyTension}</span>}
                        {phase.note && <span className="text-[color:var(--ink-faint)]"><span className="text-[color:var(--ink-soft)]/70 uppercase tracking-wider">{t('insights.evolution.note')}:</span>{' '}{phase.note}</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Expandable>

            <Expandable title={t('insights.evolution.dimensionalShift.title')} summary={t('insights.evolution.dimensionalShift.summary')}>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-[color:var(--line)]">
                      <th className="py-2 pr-4 text-left font-medium text-[color:var(--ink-soft)]">{t('insights.evolution.dimension')}</th>
                      <th className="py-2 pr-4 text-left font-medium text-[color:var(--ink-soft)]">{t('insights.evolution.currentLevel')}</th>
                      <th className="py-2 text-left font-medium text-[color:var(--ink-soft)]">{t('insights.evolution.trajectory')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dimensionEvolution.map((dimension) => (
                      <tr key={dimension.dimension} className="border-b border-[color:var(--line)]">
                        <td className="py-2.5 pr-4 text-[color:var(--ink)] font-medium">{dimension.dimension}</td>
                        <td className="py-2.5 pr-4 w-32"><ConfidenceBar value={dimension.level} /></td>
                        <td className="py-2.5 text-[color:var(--ink-faint)]">{dimension.trajectory}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Expandable>

            <Expandable title={t('insights.evolution.maturity.title')} summary={t('insights.evolution.maturity.summary')}>
              <div className="space-y-4">
                {maturityIndicators.map((item) => (
                  <div key={item.id} className="border-l-2 border-slate-700 pl-4"><span className="text-sm text-[color:var(--ink)]">{item.indicator}</span><p className="mt-1 text-xs leading-relaxed text-[color:var(--ink-faint)]">{item.detail}</p></div>
                ))}
              </div>
              <References>{maturityRefs.map((ref) => <Cite key={`${ref.author}-${ref.year}`} author={ref.author} work={ref.work} year={ref.year} detail={ref.detail} />)}</References>
            </Expandable>
          </div>
        </section>

        <section id="ins-patterns" tabIndex={-1}>
          <SectionHead title={t('insights.patterns.title')} subtitle={t('insights.patterns.subtitle')} />
          <TwoCol left={<DailyRhythmBar />} right={<div className="space-y-3"><h4 className="text-sm font-medium text-[color:var(--ink)]">{t('insights.patterns.phaseInterpretation')}</h4><p className="text-sm leading-relaxed text-[color:var(--ink-soft)]">{t('insights.patterns.phaseInterpretationBody')}</p></div>} />
          <div className="mt-8 space-y-2">
            <Expandable title={t('insights.patterns.burst.title')} summary={t('insights.patterns.burst.summary')}>
              <p className="text-sm leading-relaxed text-[color:var(--ink-soft)]">{t('insights.patterns.burst.body')}</p>
              <References>{burstRefs.map((ref) => <Cite key={`${ref.author}-${ref.year}`} author={ref.author} work={ref.work} year={ref.year} detail={ref.detail} />)}</References>
            </Expandable>

            <Expandable title={t('insights.patterns.domainShift.title')} summary={t('insights.patterns.domainShift.summary')}>
              <p className="text-sm leading-relaxed text-[color:var(--ink-soft)]">{t('insights.patterns.domainShift.body')}</p>
              <References>{domainShiftRefs.map((ref) => <Cite key={`${ref.author}-${ref.year}`} author={ref.author} work={ref.work} year={ref.year} detail={ref.detail} />)}</References>
            </Expandable>
          </div>
        </section>

        <section id="ins-resources" tabIndex={-1}>
          <SectionHead title={t('insights.resources.title')} subtitle={t('insights.resources.subtitle')} />
          <div className="space-y-2">
            <Expandable title={t('insights.resources.books.title')} summary={t('insights.resources.books.summary')}>
              <div className="space-y-4">
                {books.map((book) => (
                  <div key={book.id} className="flex items-start justify-between gap-2">
                    <div><span className="text-sm text-[color:var(--ink)]">{book.title}</span><span className="text-sm text-[color:var(--ink-faint)]">, {book.author} ({book.year})</span><p className="mt-0.5 text-xs text-[color:var(--ink-faint)]">{book.why}</p></div>
                    <ExploreButton finding={book.title} context={book.why} />
                  </div>
                ))}
              </div>
            </Expandable>

            <Expandable title={t('insights.resources.films.title')} summary={t('insights.resources.films.summary')}>
              <div className="space-y-4">
                {films.map((film) => (
                  <div key={film.id}><span className="text-sm text-[color:var(--ink)]">{film.title}</span><span className="text-sm text-[color:var(--ink-faint)]">, {film.director} ({film.year})</span><p className="mt-0.5 text-xs text-[color:var(--ink-faint)]">{film.why}</p></div>
                ))}
              </div>
            </Expandable>

            <Expandable title={t('insights.resources.thinkers.title')} summary={t('insights.resources.thinkers.summary')}>
              <div className="space-y-4">
                {thinkers.map((thinker) => (
                  <div key={thinker.id} className="flex items-start justify-between gap-2">
                    <div><span className="text-sm font-medium text-[color:var(--ink)]">{thinker.name}</span><p className="mt-0.5 text-xs text-[color:var(--ink-faint)]">{thinker.field}</p></div>
                    <ExploreButton finding={thinker.name} context={thinker.field} />
                  </div>
                ))}
              </div>
            </Expandable>

            <Expandable title={t('insights.resources.concepts.title')} summary={t('insights.resources.concepts.summary')}>
              <div className="space-y-4">
                {concepts.map((concept) => (
                  <div key={concept.id} className="flex items-start justify-between gap-2">
                    <div><span className="text-sm text-[color:var(--ink)]">{concept.concept}</span><span className="text-sm text-[color:var(--ink-faint)]">, {concept.source}</span><p className="mt-0.5 text-xs text-[color:var(--ink-faint)]">{concept.desc}</p></div>
                    <ExploreButton finding={concept.concept} context={concept.desc} />
                  </div>
                ))}
              </div>
            </Expandable>
          </div>
        </section>
      </div>
    </div>
  )
}

import { useCallback, useId, useState, type ReactNode } from 'react'
import { useI18n } from '../i18n'

/** Two-column layout: visual content left, text/analysis right on desktop */
export function TwoCol({ left, right }: { left: ReactNode; right: ReactNode }) {
  return (
    <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1.08fr)_minmax(18rem,0.92fr)] lg:gap-16 items-start">
      <div>{left}</div>
      <div>{right}</div>
    </div>
  )
}

/** Section with expand/collapse for progressive disclosure */
export function Expandable({
  title,
  renderTitle,
  summary,
  explore,
  children,
  defaultOpen = false,
}: {
  title?: string
  renderTitle?: ReactNode
  summary?: ReactNode
  explore?: ReactNode
  children: ReactNode
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  const panelId = useId()

  return (
    <div
      className="border-b border-[color:var(--line)] pb-6 transition-colors duration-200"
      style={{ backgroundColor: open ? 'rgba(246, 237, 224, 0.34)' : 'transparent' }}
    >
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        aria-controls={panelId}
        className="flex w-full items-start gap-4 text-left cursor-pointer"
      >
        <div className="min-w-0 flex-1">
          {renderTitle ?? (
            <span className="display-type text-[1.2rem] leading-tight text-[color:var(--ink)]">
              {title}
            </span>
          )}

          {summary && !open && (
            <div className="mt-2 max-w-3xl text-[0.82rem] leading-7 text-[color:var(--ink-faint)]">
              {summary}
            </div>
          )}
        </div>

        <span
          aria-hidden="true"
          className={`mt-1.5 shrink-0 text-[color:var(--ink-faint)] transition-transform duration-200 ${open ? 'rotate-90' : ''}`}
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </span>
      </button>

      {open && (
        <div id={panelId} className="mt-5">
          {children}
        </div>
      )}

      {explore && (
        <div className={`${open ? 'mt-5' : 'mt-3'} flex justify-end`}>
          {explore}
        </div>
      )}
    </div>
  )
}

/** Copyable code block */
export function CopyBlock({ code, label }: { code: string; label?: string }) {
  const { t } = useI18n()
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [code])

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-4">
        {label ? (
          <div className="text-[0.62rem] uppercase tracking-[0.3em] text-[color:var(--ink-faint)]">
            {label}
          </div>
        ) : (
          <div />
        )}
        <button
          onClick={handleCopy}
          className="shrink-0 text-[0.62rem] uppercase tracking-[0.28em] text-[color:var(--ink-faint)] transition-colors hover:text-[color:var(--accent)] cursor-pointer"
        >
          {copied ? t('shared.copied') : t('shared.copy')}
        </button>
      </div>
      <pre className="overflow-x-auto border border-[color:var(--line)] bg-[color:var(--panel)] p-4 text-[0.76rem] leading-7 text-[color:var(--ink-soft)]">
        <code>{code}</code>
      </pre>
    </div>
  )
}

/** Citation reference */
export function Cite({
  author,
  work,
  year,
  detail,
}: {
  author: string
  work: string
  year?: string
  detail?: string
}) {
  const { t } = useI18n()
  return (
    <div className="flex gap-2 py-1">
      <span className="mt-0.5 shrink-0 text-[0.65rem] uppercase tracking-[0.24em] text-[color:var(--accent)]">
        {t('shared.ref')}
      </span>
      <div>
        <span className="text-[0.78rem] text-[color:var(--ink-soft)]">
          {author}
          {year ? ` (${year})` : ''}. <em className="text-[color:var(--ink)]">{work}</em>
        </span>
        {detail && <span className="text-[0.78rem] text-[color:var(--ink-faint)]"> - {detail}</span>}
      </div>
    </div>
  )
}

/** Citation block for grouping references */
export function References({ children }: { children: ReactNode }) {
  const { t } = useI18n()
  return (
    <div className="mt-6 space-y-1 border-t border-[color:var(--line)] pt-4">
      <div className="mb-2 text-[0.62rem] uppercase tracking-[0.3em] text-[color:var(--ink-faint)]">
        {t('shared.references')}
      </div>
      {children}
    </div>
  )
}

/** Confidence bar — thin, inline */
export function ConfidenceBar({
  value,
  color = 'bg-[color:var(--accent)]',
}: {
  value: number
  color?: string
}) {
  return (
    <div className="flex items-center gap-2">
      <div className="h-px flex-1 overflow-hidden bg-[color:var(--line-strong)]">
        <div
          className={`h-full ${color}`}
          style={{ width: `${value * 100}%` }}
        />
      </div>
      <span className="w-8 text-right text-[0.72rem] font-mono text-[color:var(--ink-faint)]">
        {Math.round(value * 100)}%
      </span>
    </div>
  )
}

/** Section header with explanation */
export function SectionHead({
  title,
  subtitle,
  explanation,
}: {
  title: string
  subtitle?: string
  explanation?: string
}) {
  return (
    <div className="mb-10">
      <div className="mb-4 h-px w-20 bg-[color:var(--accent)]" />
      <h2 className="text-[clamp(1.8rem,4.5vw,3.25rem)] leading-[0.98] text-[color:var(--ink)]">
        {title}
      </h2>
      {subtitle && <p className="mt-3 max-w-3xl text-[0.98rem] leading-8 text-[color:var(--ink-soft)]">{subtitle}</p>}
      {explanation && (
        <p className="mt-4 max-w-3xl text-[0.8rem] leading-7 text-[color:var(--ink-faint)]">
          {explanation}
        </p>
      )}
    </div>
  )
}

/** Explore button — copies a ready-to-use AI prompt for deeper exploration */
export function ExploreButton({
  finding,
  context,
  sources,
}: {
  finding: string
  context?: string
  sources?: string
}) {
  const { t } = useI18n()
  const [copied, setCopied] = useState(false)

  const prompt = [
    `I was analyzed by PSYCHE/OS, a digital psyche operating system that maps cognitive patterns across psychological dimensions.`,
    ``,
    `One of the findings was: "${finding}"`,
    context ? `\nContext: ${context}` : '',
    sources ? `\nThis was derived from: ${sources}` : '',
    ``,
    `Please:`,
    `1. Explain the psychological basis of this finding in accessible terms`,
    `2. Connect it to established theories and current research`,
    `3. Point me to active researchers and thinkers working on this topic`,
    `4. Suggest relevant books, talks, videos, or podcasts for deeper exploration`,
    `5. Note any current debates or open questions in this area`,
    `6. If there are practical implications or exercises, describe them`,
  ].filter(Boolean).join('\n')

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(prompt)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [prompt])

  return (
    <button
      onClick={(e) => { e.stopPropagation(); handleCopy() }}
      title={t('shared.explorePromptTitle')}
      className="inline-flex items-center gap-1 text-[0.52rem] uppercase tracking-[0.18em] text-[color:var(--ink-faint)] transition-colors hover:text-[color:var(--accent)] cursor-pointer"
    >
      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
      {copied ? t('shared.promptCopied') : t('shared.explore')}
    </button>
  )
}

/**
 * DriftBadge — shows ↑/↓ change between two pipeline snapshots.
 * delta: absolute difference (e.g. +0.12 = +12 confidence points)
 */
export function DriftBadge({
  delta,
  threshold = 0.02,
  format = 'percent',
}: {
  delta: number | null | undefined
  threshold?: number
  format?: 'percent' | 'raw'
}) {
  if (delta == null || Math.abs(delta) < threshold) return null
  const up  = delta > 0
  const val = format === 'percent'
    ? `${Math.abs(delta * 100).toFixed(0)}%`
    : `${Math.abs(delta).toFixed(2)}`
  return (
    <span
      title={`${up ? '+' : ''}${(delta * 100).toFixed(1)}% since last snapshot`}
      style={{
        display:       'inline-flex',
        alignItems:    'center',
        gap:           '0.15em',
        fontSize:      '0.65rem',
        fontWeight:    700,
        letterSpacing: '0.04em',
        color:         up ? '#4a8c3c' : '#b03820',
        background:    up ? 'rgba(74,140,60,0.10)' : 'rgba(176,56,32,0.10)',
        borderRadius:  '4px',
        padding:       '0.1em 0.4em',
        marginLeft:    '0.45em',
        verticalAlign: 'middle',
        cursor:        'default',
        userSelect:    'none',
      }}
    >
      {up ? '↑' : '↓'} {val}
    </span>
  )
}

/** State badge */
export function StateBadge({ state }: { state: string }) {
  const styles: Record<string, string> = {
    Expressed: 'text-[#4f6b55] border-[#4f6b55]/30 bg-[#4f6b55]/8',
    Emerging: 'text-[#7a6151] border-[#7a6151]/30 bg-[#7a6151]/8',
    Latent: 'text-[#a07a42] border-[#a07a42]/30 bg-[#a07a42]/8',
    Sabotaged: 'text-[#8b4632] border-[#8b4632]/30 bg-[#8b4632]/8',
  }
  return (
    <span className={`border px-2 py-0.5 text-[0.62rem] uppercase tracking-[0.18em] ${styles[state] ?? 'text-[color:var(--ink-soft)] border-[color:var(--line)] bg-[color:var(--panel)]'}`}>
      {state}
    </span>
  )
}

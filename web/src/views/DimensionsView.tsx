import { useEffect, useState } from 'react'
import { dimensionalScores, DIMENSION_COLORS } from '../data/loader'
import { getDimensionDelta } from '../data/timelineStore'
import { useI18n } from '../i18n'
import {
  SectionHead,
  Expandable,
  DriftBadge,
} from '../components/shared'

// ── Helpers ─────────────────────────────────────────────────────────

const STATUS_COLOR: Record<string, string> = {
  Stabile:      '#4a8a50',
  Emergente:    '#7a6a2a',
  'In tensione': '#9a3a28',
}

const dimensions = Object.entries(dimensionalScores).map(([name, dim]) => {
  const score      = dim.score ?? dim.depth ?? 0
  const status     = dim.status ?? (score >= 0.7 ? 'Stabile' : score >= 0.4 ? 'Emergente' : 'In tensione')
  const color      = DIMENSION_COLORS[name] ?? '#9f4a34'
  const statusColor = STATUS_COLOR[status] ?? '#888'
  return { name, score, status, color, statusColor, ...dim }
})

// ── Component ────────────────────────────────────────────────────────

export default function DimensionsView() {
  const { t } = useI18n()
  const [selected, setSelected] = useState<string | null>(null)
  const [rotation, setRotation] = useState(0)
  // Animazione orbitale
  useEffect(() => {
    const interval = setInterval(() => setRotation(r => (r + 0.5) % 360), 40)
    return () => clearInterval(interval)
  }, [])

  const centerX = 220
  const centerY = 220
  const radius = 140
  const getPos = (i: number, total: number) => {
    const angle = (i * 360 / total + rotation) * (Math.PI / 180)
    return {
      x: centerX + Math.cos(angle) * radius,
      y: centerY + Math.sin(angle) * radius,
    }
  }

  const sel = selected ? dimensions.find(d => d.name === selected) : null

  // Fallback se non ci sono dimensioni
  if (!dimensions || dimensions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh]">
        <SectionHead title={t('dimensions.title')} explanation={t('dimensions.explanation')} />
        <div className="text-lg text-[color:var(--ink-faint)] mt-10">{t('dimensions.none')}</div>
      </div>
    )
  }

  return (
    <div className="space-y-10">
      <SectionHead
        title={t('dimensions.title')}
        explanation={t('dimensions.explanation')}
      />
      <div className="flex flex-col items-center">
        <svg width={440} height={440} style={{ margin: '0 auto', display: 'block' }}>
          <defs>
            <radialGradient id="psyche-center" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#f3e8ff" stopOpacity="1" />
              <stop offset="100%" stopColor="#a78bfa" stopOpacity="0.7" />
            </radialGradient>
          </defs>
          <circle cx={centerX} cy={centerY} r={54} fill="url(#psyche-center)" stroke="#a78bfa" strokeWidth={3} />
          <text x={centerX} y={centerY+6} textAnchor="middle" fontSize="1.5rem" fontWeight="bold" fill="#7c3aed">PSYCHE</text>
          <circle cx={centerX} cy={centerY} r={radius} fill="none" stroke="#ede9fe" strokeDasharray="4 6" />
          {dimensions.map((dim, i) => {
            const { x, y } = getPos(i, dimensions.length)
            const isSelected = selected === dim.name
            return (
              <g key={dim.name} style={{ cursor: 'pointer' }}
                onClick={() => setSelected(dim.name)}
              >
                <circle
                  cx={x}
                  cy={y}
                  r={isSelected ? 38 : 26}
                  fill={dim.color}
                  fillOpacity={isSelected ? 0.22 : 0.13}
                  stroke={dim.statusColor}
                  strokeWidth={isSelected ? 5 : 2}
                  style={{ filter: isSelected ? 'drop-shadow(0 0 8px #a78bfa88)' : 'none', transition: 'all 0.18s cubic-bezier(.4,2,.6,1)' }}
                />
                <circle
                  cx={x+30}
                  cy={y-30}
                  r={10}
                  fill={dim.statusColor}
                  stroke="#fff"
                  strokeWidth={2}
                />
                <text x={x+30} y={y-26} textAnchor="middle" fontSize="0.8rem" fontWeight="bold" fill="#fff">{dim.status[0]}</text>
                <text x={x} y={y+6} textAnchor="middle" fontSize={isSelected ? '1.5rem' : '1.1rem'} fontWeight="bold" fill="#312e81">{dim.name.slice(0,2).toUpperCase()}</text>
              </g>
            )
          })}
        </svg>
        {/* Dettaglio sotto la mappa */}
        {sel && (
          <div className="space-y-3 pt-6 w-full max-w-xl animate-fadein">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-lg" style={{ color: sel.color }}>{sel.name}</span>
              <span className="px-2 py-0.5 rounded text-xs font-medium text-white" style={{ backgroundColor: sel.statusColor }}>{sel.status}</span>
              <DriftBadge delta={getDimensionDelta(sel.name)?.scoreDelta} />
            </div>
            <div className="flex items-center gap-2">
              <span className="block h-1.5 w-32 rounded-full bg-[color:var(--panel)] overflow-hidden">
                <span className="block h-full rounded-full" style={{ width: `${sel.score * 100}%`, backgroundColor: sel.color }} />
              </span>
              <span className="text-xs tabular-nums">{Math.round(sel.score * 100)}%</span>
            </div>
            {sel.convergence && (
              <p className="text-xs text-[color:var(--ink-soft)] leading-relaxed">{sel.convergence}</p>
            )}
            {sel.blindSpot && (
              <div className="border-l-2 border-amber-500/40 pl-3">
                <span className="text-xs font-medium uppercase tracking-wider text-amber-500/70">{t('dimensions.blindSpot')}</span>
                <span className="block text-xs text-[color:var(--ink-soft)]">{sel.blindSpot}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Dimension list */}
      <div className="space-y-0 mt-6">
        {dimensions.map((dim) => (
          <Expandable
            key={dim.name}
            renderTitle={
              <div
                className="flex items-center gap-3 cursor-pointer"
                onClick={() => setSelected(selected === dim.name ? null : dim.name)}
              >
                <span className="text-sm font-medium text-[color:var(--ink)]">{dim.name}</span>
                <span
                  className="inline-block px-2 py-0.5 rounded text-xs font-medium text-white"
                  style={{ backgroundColor: dim.statusColor }}
                >
                  {dim.status}
                </span>
                <DriftBadge delta={getDimensionDelta(dim.name)?.scoreDelta} />
              </div>
            }
            summary={`${t('dimensions.score')}: ${Math.round(dim.score * 100)}%`}
          >
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <span className="block h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: dim.color }} />
                <div className="h-1 flex-1 overflow-hidden rounded-full bg-[color:var(--panel)]">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${dim.score * 100}%`, backgroundColor: dim.color }}
                  />
                </div>
                <span className="shrink-0 text-xs tabular-nums text-[color:var(--ink-soft)]">
                  {Math.round(dim.score * 100)}%
                </span>
              </div>
              {dim.convergence && (
                <p className="text-sm leading-relaxed text-[color:var(--ink-soft)]">{dim.convergence}</p>
              )}
              {dim.blindSpot && (
                <div className="border-l-2 border-amber-500/40 pl-4">
                  <span className="text-xs font-medium uppercase tracking-wider text-amber-500/70">
                    {t('dimensions.blindSpot')}
                  </span>
                  <p className="mt-1 text-sm leading-relaxed text-[color:var(--ink-soft)]">{dim.blindSpot}</p>
                </div>
              )}
              {dim.keyFindings && dim.keyFindings.length > 0 && (
                <ul className="space-y-1">
                  {dim.keyFindings.map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-[color:var(--ink-soft)]">
                      <span className="text-[color:var(--accent)] mt-0.5 shrink-0">·</span>
                      {f}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </Expandable>
        ))}
      </div>
    </div>
  )
}

import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'
import { useState } from 'react'
import { dimensionalScores, DIMENSION_COLORS } from '../data/loader'
import { getDimensionDelta } from '../data/timelineStore'
import {
  SectionHead,
  TwoCol,
  Expandable,
  DriftBadge,
} from '../components/shared'

// ── Helpers ─────────────────────────────────────────────────────────

const STATUS_COLOR: Record<string, string> = {
  Stabile:      '#4a8a50',
  Emergente:    '#7a6a2a',
  'In tensione': '#9a3a28',
}

const radarData = Object.entries(dimensionalScores).map(([name, dim]) => ({
  dimension: name,
  score:     (dim.score ?? dim.depth ?? 0) * 100,
  fullMark:  100,
}))

const dimensions = Object.entries(dimensionalScores).map(([name, dim]) => {
  const score      = dim.score ?? dim.depth ?? 0
  const status     = dim.status ?? (score >= 0.7 ? 'Stabile' : score >= 0.4 ? 'Emergente' : 'In tensione')
  const color      = DIMENSION_COLORS[name] ?? '#9f4a34'
  const statusColor = STATUS_COLOR[status] ?? '#888'
  return { name, score, status, color, statusColor, ...dim }
})

// ── Component ────────────────────────────────────────────────────────

export default function DimensionsView() {
  const [selected, setSelected] = useState<string | null>(null)

  const sel = selected ? dimensions.find(d => d.name === selected) : null

  return (
    <div className="space-y-10">
      <SectionHead
        title="Dimensional Profile"
        explanation="PSYCHE/OS analyzes identity across 6 dimensions derived from established psychological, sociological, and anthropological frameworks. Scores reflect cross-source convergence, not absolute measurement."
      />

      <TwoCol
        left={
          <div className="mx-auto max-w-lg">
            <ResponsiveContainer width="100%" height={340}>
              <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="75%">
                <PolarGrid stroke="#cdbdad" />
                <PolarAngleAxis dataKey="dimension" tick={{ fill: '#7f7264', fontSize: 11 }} />
                <PolarRadiusAxis
                  angle={90} domain={[0, 100]}
                  tick={{ fill: '#96897c', fontSize: 10 }} axisLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fbf7f1', border: '1px solid #d3c4b6',
                    borderRadius: '6px', color: '#4d4339', fontSize: '12px',
                  }}
                  formatter={(v) => [`${Number(v ?? 0).toFixed(0)}%`, 'Score']}
                />
                <Radar
                  name="Score" dataKey="score"
                  stroke="#9f4a34" fill="#9f4a34" fillOpacity={0.08} strokeWidth={1.5}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        }
        right={
          <div className="space-y-5">
            <p className="text-sm leading-relaxed text-[color:var(--ink-soft)]">
              The radar chart shows your dimensional profile across six
              psychological axes. Each axis is scored from 0–100% based on
              cross-source evidence convergence.
            </p>
            {/* Selected dimension detail */}
            {sel && (
              <div className="space-y-3 pt-3 border-t border-[color:var(--line)]">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-sm" style={{ color: sel.color }}>
                    {sel.name}
                  </span>
                  <span
                    className="px-2 py-0.5 rounded text-xs font-medium text-white"
                    style={{ backgroundColor: sel.statusColor }}
                  >
                    {sel.status}
                  </span>
                  <DriftBadge delta={getDimensionDelta(sel.name)?.scoreDelta} />
                </div>
                <div className="flex items-center gap-2">
                  <span className="block h-1.5 w-28 rounded-full bg-[color:var(--panel)] overflow-hidden">
                    <span
                      className="block h-full rounded-full"
                      style={{ width: `${sel.score * 100}%`, backgroundColor: sel.color }}
                    />
                  </span>
                  <span className="text-xs tabular-nums">{Math.round(sel.score * 100)}%</span>
                </div>
                {sel.convergence && (
                  <p className="text-xs text-[color:var(--ink-soft)] leading-relaxed">{sel.convergence}</p>
                )}
                {sel.blindSpot && (
                  <div className="border-l-2 border-amber-500/40 pl-3">
                    <span className="text-xs font-medium uppercase tracking-wider text-amber-500/70">
                      Blind Spot
                    </span>
                    <p className="mt-0.5 text-xs text-[color:var(--ink-soft)] leading-relaxed">
                      {sel.blindSpot}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        }
      />

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
            summary={`Score: ${Math.round(dim.score * 100)}%`}
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
                    Blind Spot
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

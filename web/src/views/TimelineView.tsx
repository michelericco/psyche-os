/**
 * TimelineView — visualizza la storia temporale delle stratificazioni.
 *
 * Mostra ogni snapshot come riga cronologica con i delta tra una
 * pipeline run e la successiva, organizzati per layer:
 *   Genome · Dimensions · Patterns · Archetypes · Potentials · Narrative
 */
import { useState, useEffect } from 'react'
import { SectionHead } from '../components/shared'
import {
  loadTimeline,
  saveSnapshot,
  deleteSnapshot,
  getLastRunSummary,
} from '../data/timelineStore'
import {
  crossValidatedPatterns,
  archetypeMapping,
  dimensionalScores,
  allPotentials,
  narrativeArc,
  directionalVector,
  modelLimitations,
  simulacrumIndex,
} from '../data/loader'
import type { SynthesisSnapshot, SynthesisDelta } from '../data/types'

// Build the current synthesis object from loader exports
const CURRENT_SYNTHESIS = {
  crossValidatedPatterns,
  archetypeMapping,
  unifiedDimensionalScores: dimensionalScores,
  topPotentials:           allPotentials,
  narrativeArc,
  directionalVector,
  modelLimitations,
  simulacrumIndex,
}

// ── Layer colours ──────────────────────────────────────────────────
const LAYER_COLOR: Record<string, string> = {
  Genome:     '#7a5c38',
  Dimensions: '#4a7a9a',
  Patterns:   '#6a4a8a',
  Archetypes: '#9a4a2a',
  Potentials: '#3a7a5a',
  Narrative:  '#8a6a2a',
}

// ── Main component ─────────────────────────────────────────────────

export default function TimelineView() {
  const [snapshots, setSnapshots] = useState<SynthesisSnapshot[]>([])
  const [label, setLabel]         = useState('')
  const [expanded, setExpanded]   = useState<string | null>(null)
  const [saved, setSaved]         = useState(false)

  useEffect(() => {
    const tl = loadTimeline()
    if (tl) setSnapshots([...tl.snapshots].reverse()) // newest first
  }, [])

  function refresh() {
    const tl = loadTimeline()
    if (tl) setSnapshots([...tl.snapshots].reverse())
  }

  function handleSave() {
    saveSnapshot(CURRENT_SYNTHESIS as Parameters<typeof saveSnapshot>[0], label || undefined)
    setLabel('')
    setSaved(true)
    refresh()
    setTimeout(() => setSaved(false), 2000)
  }

  function handleDelete(id: string) {
    deleteSnapshot(id)
    refresh()
  }

  const summary = getLastRunSummary()

  return (
    <div className="mx-auto max-w-3xl space-y-12 py-8">
      <SectionHead
        title="Stratification timeline"
        subtitle="Each snapshot is a full pipeline run. Drift between layers reveals how the psyche evolves."
      />

      {/* Last run summary */}
      {summary && (
        <p style={{ fontSize: '0.82rem', color: 'var(--ink-faint)', fontStyle: 'italic' }}>
          Last run: {summary}
        </p>
      )}

      {/* Save new snapshot */}
      <div
        style={{
          padding:      '1.25rem 1.5rem',
          background:   'var(--paper-strong)',
          borderRadius: '14px',
          boxShadow:    'var(--shadow-card)',
          display:      'flex',
          gap:          '0.75rem',
          alignItems:   'center',
          flexWrap:     'wrap',
        }}
      >
        <input
          type="text"
          value={label}
          onChange={e => setLabel(e.target.value)}
          placeholder="Label this snapshot (optional)"
          style={{ flex: '1 1 14rem', minWidth: 0 }}
          onKeyDown={e => e.key === 'Enter' && handleSave()}
        />
        <button
          onClick={handleSave}
          style={{
            padding:      '0.55rem 1.2rem',
            background:   'var(--accent)',
            color:        '#fff',
            border:       'none',
            borderRadius: '8px',
            cursor:       'pointer',
            fontWeight:   600,
            fontSize:     '0.85rem',
            transition:   'opacity 200ms',
            opacity:      saved ? 0.6 : 1,
          }}
        >
          {saved ? 'Saved ✓' : 'Save snapshot'}
        </button>
      </div>

      {/* Stratification legend */}
      <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
        {Object.entries(LAYER_COLOR).map(([layer, color]) => (
          <span
            key={layer}
            style={{
              fontSize:      '0.68rem',
              fontWeight:    700,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color,
              border:        `1px solid ${color}40`,
              background:    `${color}12`,
              borderRadius:  '4px',
              padding:       '0.15em 0.55em',
            }}
          >
            {layer}
          </span>
        ))}
      </div>

      {/* Empty state */}
      {snapshots.length === 0 && (
        <div style={{ textAlign: 'center', color: 'var(--ink-faint)', padding: '3rem 0', fontSize: '0.9rem' }}>
          No snapshots yet. Save your first one above to begin tracking.
        </div>
      )}

      {/* Snapshot list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
        {snapshots.map((snap, i) => (
          <SnapshotRow
            key={snap.id}
            snap={snap}
            index={snapshots.length - i}
            isFirst={i === 0}
            isLast={i === snapshots.length - 1}
            isExpanded={expanded === snap.id}
            onToggle={() => setExpanded(expanded === snap.id ? null : snap.id)}
            onDelete={() => handleDelete(snap.id)}
            canDelete={snapshots.length > 1}
          />
        ))}
      </div>
    </div>
  )
}

// ── Snapshot row ───────────────────────────────────────────────────

function SnapshotRow({
  snap,
  index,
  isFirst,
  isLast,
  isExpanded,
  onToggle,
  onDelete,
  canDelete,
}: {
  snap:       SynthesisSnapshot
  index:      number
  isFirst:    boolean
  isLast:     boolean
  isExpanded: boolean
  onToggle:   () => void
  onDelete:   () => void
  canDelete:  boolean
}) {
  const date = new Date(snap.createdAt)
  const dateStr = date.toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
  const timeStr = date.toLocaleTimeString('en-GB', {
    hour: '2-digit', minute: '2-digit',
  })

  return (
    <div style={{ display: 'flex', gap: '0' }}>
      {/* Timeline spine */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '2rem', flexShrink: 0 }}>
        <div style={{
          width: '2px',
          flex: isFirst ? '0 0 1.1rem' : '0 0 0',
          background: 'var(--line)',
        }} />
        <div style={{
          width: '10px', height: '10px',
          borderRadius: '50%',
          background: snap.delta ? 'var(--accent)' : 'var(--ink-faint)',
          border: '2px solid var(--paper-strong)',
          boxShadow: `0 0 0 2px ${snap.delta ? 'var(--accent)' : 'var(--line)'}`,
          flexShrink: 0,
        }} />
        {!isLast && (
          <div style={{ width: '2px', flex: 1, minHeight: '2rem', background: 'var(--line)' }} />
        )}
      </div>

      {/* Card */}
      <div
        style={{
          flex: 1,
          marginLeft: '0.85rem',
          marginBottom: '1.25rem',
          background: 'var(--paper-strong)',
          borderRadius: '12px',
          boxShadow: 'var(--shadow-card)',
          overflow: 'hidden',
        }}
      >
        {/* Header row */}
        <div
          onClick={onToggle}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.9rem 1.1rem',
            cursor: 'pointer',
            userSelect: 'none',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
            <span style={{
              fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.22em',
              textTransform: 'uppercase', color: 'var(--ink-faint)',
              flexShrink: 0,
            }}>
              #{index}
            </span>
            <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--ink)', minWidth: 0 }}>
              {snap.label ?? dateStr}
            </span>
            {snap.label && (
              <span style={{ fontSize: '0.75rem', color: 'var(--ink-faint)' }}>
                {dateStr} {timeStr}
              </span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
            {snap.delta && (
              <DeltaSummaryPills delta={snap.delta} />
            )}
            {!snap.delta && (
              <span style={{ fontSize: '0.7rem', color: 'var(--ink-faint)', fontStyle: 'italic' }}>
                baseline
              </span>
            )}
            <span style={{ fontSize: '0.75rem', color: 'var(--ink-faint)' }}>
              {isExpanded ? '▲' : '▼'}
            </span>
          </div>
        </div>

        {/* Expanded delta detail */}
        {isExpanded && snap.delta && (
          <DeltaDetail delta={snap.delta} />
        )}
        {isExpanded && !snap.delta && (
          <div style={{ padding: '0 1.1rem 1rem', fontSize: '0.82rem', color: 'var(--ink-faint)', fontStyle: 'italic' }}>
            This is the baseline snapshot — no delta to show.
          </div>
        )}

        {/* Footer: delete */}
        {isExpanded && canDelete && (
          <div style={{ padding: '0.65rem 1.1rem', borderTop: '1px solid var(--line)', textAlign: 'right' }}>
            <button
              onClick={e => { e.stopPropagation(); onDelete() }}
              style={{
                fontSize: '0.72rem', color: '#b03820',
                background: 'none', border: 'none',
                cursor: 'pointer', padding: '0.2rem 0.5rem',
                borderRadius: '4px',
              }}
            >
              Delete snapshot
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Pill summary of a delta ────────────────────────────────────────

function DeltaSummaryPills({ delta }: { delta: SynthesisDelta }) {
  const pills: { label: string; color: string }[] = []

  const totalPatternChanges = delta.patterns.shifted.length + delta.patterns.added.length + delta.patterns.removed.length
  if (totalPatternChanges) pills.push({ label: `${totalPatternChanges} pattern${totalPatternChanges > 1 ? 's' : ''}`, color: LAYER_COLOR.Patterns })

  const dimCount = Object.keys(delta.dimensions).length
  if (dimCount) pills.push({ label: `${dimCount} dim`, color: LAYER_COLOR.Dimensions })

  if (delta.potentials.length) pills.push({ label: `${delta.potentials.length} potential`, color: LAYER_COLOR.Potentials })
  if (delta.narrative.chapterChanged) pills.push({ label: 'narrative ↻', color: LAYER_COLOR.Narrative })
  if (delta.archetypes.dominant) pills.push({ label: 'archetype shift', color: LAYER_COLOR.Archetypes })

  if (!pills.length) return <span style={{ fontSize: '0.7rem', color: 'var(--ink-faint)', fontStyle: 'italic' }}>no significant change</span>

  return (
    <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
      {pills.map(p => (
        <span key={p.label} style={{
          fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.08em',
          color: p.color, background: `${p.color}15`,
          border: `1px solid ${p.color}30`,
          borderRadius: '4px', padding: '0.12em 0.45em',
        }}>
          {p.label}
        </span>
      ))}
    </div>
  )
}

// ── Expanded delta detail ──────────────────────────────────────────

function DeltaDetail({ delta }: { delta: SynthesisDelta }) {
  const sections: React.ReactElement[] = []

  // Patterns
  if (delta.patterns.shifted.length || delta.patterns.added.length || delta.patterns.removed.length) {
    sections.push(
      <DeltaSection key="pat" title="Patterns" color={LAYER_COLOR.Patterns}>
        {delta.patterns.added.map(l => (
          <DeltaRow key={l} label={l} tag="new" tagColor="#4a8c3c" />
        ))}
        {delta.patterns.removed.map(l => (
          <DeltaRow key={l} label={l} tag="removed" tagColor="#b03820" />
        ))}
        {delta.patterns.shifted.map(p => (
          <DeltaRow key={p.id} label={p.label} delta={p.delta} />
        ))}
      </DeltaSection>
    )
  }

  // Dimensions
  if (Object.keys(delta.dimensions).length) {
    sections.push(
      <DeltaSection key="dim" title="Dimensions" color={LAYER_COLOR.Dimensions}>
        {Object.entries(delta.dimensions).map(([dim, d]) => (
          <DeltaRow
            key={dim}
            label={dim}
            delta={d.scoreDelta}
            sub={d.statusChange ? `${d.statusChange.from} → ${d.statusChange.to}` : undefined}
          />
        ))}
      </DeltaSection>
    )
  }

  // Potentials
  if (delta.potentials.length) {
    sections.push(
      <DeltaSection key="pot" title="Potentials" color={LAYER_COLOR.Potentials}>
        {delta.potentials.map(p => (
          <DeltaRow
            key={p.label}
            label={p.label}
            sub={`${p.from} → ${p.to}`}
          />
        ))}
      </DeltaSection>
    )
  }

  // Archetypes
  if (delta.archetypes.dominant || delta.archetypes.emergent) {
    sections.push(
      <DeltaSection key="arc" title="Archetypes" color={LAYER_COLOR.Archetypes}>
        {delta.archetypes.dominant && (
          <DeltaRow label="Dominant" sub={`${delta.archetypes.dominant.from} → ${delta.archetypes.dominant.to}`} />
        )}
        {delta.archetypes.emergent && (
          <DeltaRow label="Emergent" sub={`${delta.archetypes.emergent.from} → ${delta.archetypes.emergent.to}`} />
        )}
      </DeltaSection>
    )
  }

  // Narrative
  if (delta.narrative.chapterChanged) {
    sections.push(
      <DeltaSection key="nar" title="Narrative" color={LAYER_COLOR.Narrative}>
        <DeltaRow
          label="Chapter"
          sub={`${delta.narrative.from ?? '—'} → ${delta.narrative.to ?? '—'}`}
        />
      </DeltaSection>
    )
  }

  if (!sections.length) {
    return (
      <p style={{ padding: '0 1.1rem 1rem', fontSize: '0.82rem', color: 'var(--ink-faint)', fontStyle: 'italic' }}>
        No changes above the significance threshold ({delta.interval} days elapsed).
      </p>
    )
  }

  return (
    <div style={{
      padding: '0 1.1rem 1rem',
      display: 'flex', flexDirection: 'column', gap: '1rem',
      borderTop: '1px solid var(--line)',
      paddingTop: '0.9rem',
    }}>
      <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--ink-faint)', letterSpacing: '0.08em' }}>
        Interval: {delta.interval} day{delta.interval !== 1 ? 's' : ''}
      </p>
      {sections}
    </div>
  )
}

function DeltaSection({ title, color, children }: { title: string; color: string; children: React.ReactNode }) {
  return (
    <div>
      <p style={{
        margin: '0 0 0.45rem',
        fontSize: '0.65rem', fontWeight: 700,
        letterSpacing: '0.18em', textTransform: 'uppercase',
        color,
      }}>
        {title}
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
        {children}
      </div>
    </div>
  )
}

function DeltaRow({
  label, delta, sub, tag, tagColor,
}: {
  label:     string
  delta?:    number
  sub?:      string
  tag?:      string
  tagColor?: string
}) {
  const up = delta != null && delta > 0
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', flexWrap: 'wrap' }}>
      <span style={{ fontSize: '0.82rem', color: 'var(--ink-soft)', flex: '1 1 8rem' }}>{label}</span>
      {delta != null && (
        <span style={{
          fontSize: '0.72rem', fontWeight: 700,
          color: up ? '#4a8c3c' : '#b03820',
        }}>
          {up ? '+' : ''}{(delta * 100).toFixed(1)}%
        </span>
      )}
      {sub && (
        <span style={{ fontSize: '0.72rem', color: 'var(--ink-faint)' }}>{sub}</span>
      )}
      {tag && (
        <span style={{
          fontSize: '0.62rem', fontWeight: 700,
          color: tagColor ?? 'var(--ink-faint)',
          background: `${tagColor ?? '#888'}15`,
          borderRadius: '4px', padding: '0.1em 0.4em',
        }}>
          {tag}
        </span>
      )}
    </div>
  )
}

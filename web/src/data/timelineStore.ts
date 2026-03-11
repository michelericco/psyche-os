/**
 * PSYCHE/OS — Temporal stratification store
 *
 * Saves snapshots of Synthesis into localStorage, computes delta
 * between consecutive runs, and exposes helpers for UI drift indicators.
 */
import type {
  Synthesis,
  SynthesisDelta,
  SynthesisSnapshot,
  SynthesisTimeline,
} from './types'

const STORAGE_KEY = 'psyche-os:timeline'
const MIN_SCORE_DELTA = 0.03   // ignore micro-variations below this threshold

// ── Delta computation ──────────────────────────────────────────────

export function computeDelta(
  prev: Synthesis,
  next: Synthesis,
  daysBetween: number,
): SynthesisDelta {

  // Patterns
  const prevIds = new Set(prev.crossValidatedPatterns.map(p => p.id))
  const nextMap  = new Map(next.crossValidatedPatterns.map(p => [p.id, p]))

  const patterns: SynthesisDelta['patterns'] = {
    added: next.crossValidatedPatterns
      .filter(p => !prevIds.has(p.id))
      .map(p => p.label),

    removed: prev.crossValidatedPatterns
      .filter(p => !nextMap.has(p.id))
      .map(p => p.label),

    shifted: next.crossValidatedPatterns
      .filter(p => prevIds.has(p.id))
      .map(p => {
        const old = prev.crossValidatedPatterns.find(o => o.id === p.id)!
        return { id: p.id, label: p.label, delta: p.confidence - old.confidence }
      })
      .filter(p => Math.abs(p.delta) >= MIN_SCORE_DELTA),
  }

  // Dimensions
  const dimensions: SynthesisDelta['dimensions'] = {}
  for (const dim of Object.keys(next.unifiedDimensionalScores)) {
    const n = next.unifiedDimensionalScores[dim]
    const o = prev.unifiedDimensionalScores[dim]
    if (!o) continue
    const scoreDelta = (n.score ?? n.depth ?? 0) - (o.score ?? o.depth ?? 0)
    if (Math.abs(scoreDelta) >= MIN_SCORE_DELTA || n.status !== o.status) {
      dimensions[dim] = {
        scoreDelta,
        ...(n.status !== o.status
          ? { statusChange: { from: o.status ?? '—', to: n.status ?? '—' } }
          : {}),
      }
    }
  }

  // Archetypes
  const archetypes: SynthesisDelta['archetypes'] = {}
  if (prev.archetypeMapping.dominant.archetype !== next.archetypeMapping.dominant.archetype) {
    archetypes.dominant = {
      from: prev.archetypeMapping.dominant.archetype,
      to:   next.archetypeMapping.dominant.archetype,
    }
  }
  if (prev.archetypeMapping.emergent.archetype !== next.archetypeMapping.emergent.archetype) {
    archetypes.emergent = {
      from: prev.archetypeMapping.emergent.archetype,
      to:   next.archetypeMapping.emergent.archetype,
    }
  }

  // Potentials
  const potentials: SynthesisDelta['potentials'] = []
  for (const np of next.topPotentials) {
    const op = prev.topPotentials.find(p => p.label === np.label)
    if (op && op.state !== np.state) {
      potentials.push({ label: np.label, from: op.state, to: np.state })
    }
  }

  // Narrative
  const narrative: SynthesisDelta['narrative'] = {
    chapterChanged:
      prev.narrativeArc.currentChapter !== next.narrativeArc.currentChapter,
    from: prev.narrativeArc.currentChapter,
    to:   next.narrativeArc.currentChapter,
  }

  // Genome (score changes per primitive)
  const genome: SynthesisDelta['genome'] = {}

  return { interval: daysBetween, patterns, dimensions, archetypes, potentials, narrative, genome }
}

// ── Persistence ────────────────────────────────────────────────────

export function loadTimeline(): SynthesisTimeline | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as SynthesisTimeline) : null
  } catch {
    return null
  }
}

export function saveTimeline(timeline: SynthesisTimeline): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(timeline))
}

/**
 * Save a new snapshot of the current synthesis.
 * Automatically computes delta against the previous snapshot.
 * Returns the new snapshot.
 */
export function saveSnapshot(
  synthesis: Synthesis,
  label?: string,
): SynthesisSnapshot {
  const timeline = loadTimeline() ?? { snapshots: [], activeId: '' }

  const prev = timeline.snapshots.at(-1)
  const daysBetween = prev
    ? Math.round(
        (Date.now() - new Date(prev.createdAt).getTime()) / 86_400_000,
      )
    : 0

  const snapshot: SynthesisSnapshot = {
    id:          crypto.randomUUID(),
    createdAt:   new Date().toISOString(),
    label:       label ?? undefined,
    previousId:  prev?.id,
    data:        synthesis,
    delta:       prev ? computeDelta(prev.data, synthesis, daysBetween) : undefined,
  }

  timeline.snapshots.push(snapshot)
  timeline.activeId = snapshot.id
  saveTimeline(timeline)
  return snapshot
}

/**
 * Delete a snapshot by id (cannot delete if it's the only one).
 */
export function deleteSnapshot(id: string): void {
  const timeline = loadTimeline()
  if (!timeline || timeline.snapshots.length <= 1) return
  timeline.snapshots = timeline.snapshots.filter(s => s.id !== id)
  if (timeline.activeId === id) {
    timeline.activeId = timeline.snapshots.at(-1)!.id
  }
  saveTimeline(timeline)
}

// ── UI helpers ─────────────────────────────────────────────────────

/** Returns the delta of the most recent snapshot (if available) */
export function getLatestDelta(): SynthesisDelta | null {
  const timeline = loadTimeline()
  if (!timeline) return null
  const last = timeline.snapshots.at(-1)
  return last?.delta ?? null
}

/** Returns the dimension delta for a specific dimension */
export function getDimensionDelta(
  dim: string,
): { scoreDelta: number; statusChange?: { from: string; to: string } } | null {
  const delta = getLatestDelta()
  return delta?.dimensions[dim] ?? null
}

/** Returns the confidence delta for a specific pattern id */
export function getPatternDelta(patternId: string): number | null {
  const delta = getLatestDelta()
  if (!delta) return null
  const shifted = delta.patterns.shifted.find(p => p.id === patternId)
  return shifted?.delta ?? null
}

/** Summary string for the last run, e.g. "3 days ago · 2 patterns shifted" */
export function getLastRunSummary(): string | null {
  const timeline = loadTimeline()
  if (!timeline || timeline.snapshots.length === 0) return null
  const last = timeline.snapshots.at(-1)!
  const d    = last.delta
  if (!d) return `First snapshot — ${_fmtDate(last.createdAt)}`

  const parts: string[] = []
  if (d.patterns.shifted.length) parts.push(`${d.patterns.shifted.length} pattern${d.patterns.shifted.length > 1 ? 's' : ''} shifted`)
  if (d.patterns.added.length)   parts.push(`${d.patterns.added.length} new`)
  if (d.patterns.removed.length) parts.push(`${d.patterns.removed.length} removed`)
  if (d.potentials.length)       parts.push(`${d.potentials.length} potential transition${d.potentials.length > 1 ? 's' : ''}`)
  if (d.narrative.chapterChanged) parts.push('narrative chapter changed')
  const summary = parts.length ? parts.join(' · ') : 'no significant changes'

  return `${d.interval}d gap · ${summary}`
}

function _fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}
